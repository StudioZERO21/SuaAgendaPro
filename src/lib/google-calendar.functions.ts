import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GCalSettings = {
  calendarId: string;
  syncCreate: boolean;
  syncUpdate: boolean;
  syncCancel: boolean;
  includeClientName: boolean;
  reminderMinutes: number;
  autoSyncEnabled: boolean;
  autoSyncInterval: number;
};

export type GCalStatus = {
  connected: boolean;
  email: string | null;
  settings: GCalSettings;
  calendars: { id: string; summary: string; primary?: boolean }[];
};

const DEFAULT_SETTINGS: GCalSettings = {
  calendarId: "primary",
  syncCreate: true,
  syncUpdate: true,
  syncCancel: true,
  includeClientName: true,
  reminderMinutes: 30,
  autoSyncEnabled: true,
  autoSyncInterval: 15,
};

const settingsSchema = z.object({
  calendarId: z.string().trim().min(1).max(255),
  syncCreate: z.boolean(),
  syncUpdate: z.boolean(),
  syncCancel: z.boolean(),
  includeClientName: z.boolean(),
  reminderMinutes: z.number().int().min(0).max(1440),
  autoSyncEnabled: z.boolean(),
  autoSyncInterval: z.number().int().min(5).max(480),
});

// ── Credentials ───────────────────────────────────────────────────────────────

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function getRedirectUri(origin: string) {
  return `${origin}/api/public/google-calendar/callback`;
}

// ── Token helpers (server-only) ───────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  const creds = getGoogleCredentials();
  if (!creds) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  return (await res.json()) as { access_token: string; expires_in: number };
}

type GCalTokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
  google_email: string | null;
  settings: Record<string, unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gcalTable(db: any) {
  return db.from("google_calendar_tokens") as ReturnType<typeof db.from>;
}

export async function getValidToken(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = (await gcalTable(supabaseAdmin)
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single()) as { data: Pick<GCalTokenRow, "access_token" | "refresh_token" | "expires_at"> | null };

  if (!data) return null;

  const expiresAt = new Date(data.expires_at).getTime();
  const needsRefresh = expiresAt - Date.now() < 5 * 60 * 1000;

  if (!needsRefresh) return data.access_token;
  if (!data.refresh_token) return null;

  const refreshed = await refreshAccessToken(data.refresh_token);
  if (!refreshed) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await gcalTable(supabaseAdmin)
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return refreshed.access_token;
}

// ── Calendar event helpers ────────────────────────────────────────────────────

type AppointmentForSync = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  google_event_id: string | null;
  clients: { name: string } | null;
  services: { name: string } | null;
};

function buildEventBody(
  appt: AppointmentForSync,
  settings: GCalSettings,
): object {
  const start = new Date(appt.scheduled_at);
  const end = new Date(start.getTime() + appt.duration_minutes * 60 * 1000);
  const clientName = appt.clients?.name ?? "Cliente";
  const serviceName = appt.services?.name ?? "Serviço";

  const summary = settings.includeClientName
    ? `${serviceName} — ${clientName}`
    : serviceName;

  const body: Record<string, unknown> = {
    summary,
    description: appt.notes ?? undefined,
    start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
    end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
  };

  if (settings.reminderMinutes > 0) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: "popup", minutes: settings.reminderMinutes }],
    };
  }

  return body;
}

export async function pushAppointmentToGoogle(
  userId: string,
  appointmentId: string,
  action: "create" | "update" | "cancel",
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Load token + settings
  const { data: tokenRow } = (await gcalTable(supabaseAdmin)
    .select("settings, google_email")
    .eq("user_id", userId)
    .single()) as { data: Pick<GCalTokenRow, "settings" | "google_email"> | null };

  if (!tokenRow) return;
  const settings: GCalSettings = { ...DEFAULT_SETTINGS, ...(tokenRow.settings as Partial<GCalSettings>) };

  // Check relevant sync flag
  if (action === "create" && !settings.syncCreate) return;
  if (action === "update" && !settings.syncUpdate) return;
  if (action === "cancel" && !settings.syncCancel) return;

  const token = await getValidToken(userId);
  if (!token) return;

  // Load appointment
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, notes, google_event_id, clients(name), services(name)")
    .eq("id", appointmentId)
    .single();

  if (!appt) return;

  const calendarId = encodeURIComponent(settings.calendarId);
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (action === "cancel" && appt.google_event_id) {
    await fetch(`${baseUrl}/${appt.google_event_id}`, { method: "DELETE", headers });
    await supabaseAdmin
      .from("appointments")
      .update({ google_event_id: null })
      .eq("id", appointmentId);
    return;
  }

  const eventBody = buildEventBody(appt as AppointmentForSync, settings);

  if (action === "update" && appt.google_event_id) {
    await fetch(`${baseUrl}/${appt.google_event_id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(eventBody),
    });
    return;
  }

  // create
  const res = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(eventBody),
  });
  if (res.ok) {
    const created = (await res.json()) as { id: string };
    await supabaseAdmin
      .from("appointments")
      .update({ google_event_id: created.id })
      .eq("id", appointmentId);
  }
}

// ── Server Functions ──────────────────────────────────────────────────────────

export const startGoogleOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ origin: z.string().trim().url().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const creds = getGoogleCredentials();
    if (!creds) return { ok: false as const, reason: "not_configured" as const };

    const { createOAuthState } = await import("@/lib/mp-oauth.server");
    const redirectUri = getRedirectUri(data.origin);
    const state = createOAuthState(context.userId, redirectUri, crypto.randomUUID());

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", creds.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "));
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    return { ok: true as const, url: url.toString() };
  });

export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GCalStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = (await gcalTable(supabaseAdmin)
      .select("google_email, settings")
      .eq("user_id", context.userId)
      .maybeSingle()) as { data: Pick<GCalTokenRow, "google_email" | "settings"> | null };

    if (!data) {
      return { connected: false, email: null, settings: DEFAULT_SETTINGS, calendars: [] };
    }

    const settings: GCalSettings = { ...DEFAULT_SETTINGS, ...(data.settings as Partial<GCalSettings>) };

    // Try to load calendars list
    let calendars: { id: string; summary: string; primary?: boolean }[] = [];
    try {
      const token = await getValidToken(context.userId);
      if (token) {
        const res = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const list = (await res.json()) as {
            items?: { id: string; summary: string; primary?: boolean }[];
          };
          calendars = list.items ?? [];
        }
      }
    } catch {}

    return {
      connected: true,
      email: data.google_email ?? null,
      settings,
      calendars,
    };
  });

export const saveGoogleCalendarSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await gcalTable(supabaseAdmin)
      .update({ settings: data })
      .eq("user_id", context.userId);

    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Revoke token at Google
    try {
      const token = await getValidToken(context.userId);
      if (token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: "POST" });
      }
    } catch {}

    await gcalTable(supabaseAdmin)
      .delete()
      .eq("user_id", context.userId);

    return { ok: true };
  });

export const syncAppointmentWithGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      appointmentId: z.string().uuid(),
      action: z.enum(["create", "update", "cancel"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await pushAppointmentToGoogle(context.userId, data.appointmentId, data.action);
    return { ok: true };
  });

export const syncNowToGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const token = await getValidToken(context.userId);
    if (!token) throw new Error("not_connected");

    const { data: tokenRow } = (await gcalTable(supabaseAdmin)
      .select("settings")
      .eq("user_id", context.userId)
      .single()) as { data: Pick<GCalTokenRow, "settings"> | null };

    const settings: GCalSettings = { ...DEFAULT_SETTINGS, ...((tokenRow?.settings as Partial<GCalSettings>) ?? {}) };
    if (!settings.syncCreate) return { synced: 0, skipped: 0 };

    // Fetch upcoming appointments without google_event_id
    const { data: appointments } = await supabaseAdmin
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, notes, google_event_id, clients(name), services(name)")
      .eq("professional_id", context.userId)
      .is("google_event_id", null)
      .gte("scheduled_at", new Date().toISOString())
      .in("status", ["pending", "confirmed"])
      .order("scheduled_at")
      .limit(50);

    if (!appointments?.length) return { synced: 0, skipped: 0 };

    const calendarId = encodeURIComponent(settings.calendarId);
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    let synced = 0;
    let lastError: string | null = null;
    for (const appt of appointments) {
      try {
        const eventBody = buildEventBody(appt as unknown as AppointmentForSync, settings);
        const res = await fetch(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(eventBody),
        });
        if (res.ok) {
          const created = (await res.json()) as { id: string };
          await supabaseAdmin
            .from("appointments")
            .update({ google_event_id: created.id })
            .eq("id", appt.id);
          synced++;
        } else {
          lastError = `HTTP ${res.status}: ${await res.text()}`;
        }
      } catch (e) {
        lastError = String(e);
      }
    }

    return { synced, skipped: appointments.length - synced, error: lastError };
  });
