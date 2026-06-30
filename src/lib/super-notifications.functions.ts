import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

// ─── Feed de notificações (log com filtros) ──────────────────────────────────

export type NotifRow = {
  id:          string;
  userId:      string;
  userName:    string;
  userEmail:   string;
  kind:        string;
  channel:     string;
  status:      string;   // pending | sent | failed | skipped
  target:      string | null;
  error:       string | null;
  scheduledFor: string | null;
  sentAt:      string | null;
  createdAt:   string;
};

export const getNotificationFeed = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      _st,
      status:  z.string().optional(),
      channel: z.string().optional(),
      kind:    z.string().optional(),
      from:    z.string().optional(),
      to:      z.string().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<NotifRow[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = (supabaseAdmin as any)
      .from("subscription_notifications")
      .select("id, user_id, kind, channel, status, target, error, scheduled_for, sent_at, created_at, profiles!inner(display_name)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status  && data.status  !== "todos") q = q.eq("status", data.status);
    if (data.channel && data.channel !== "todos") q = q.eq("channel", data.channel);
    if (data.kind    && data.kind    !== "todos") q = q.eq("kind", data.kind);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to)   q = q.lte("created_at", data.to + "T23:59:59Z");

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows ?? []).map((r: any) => ({
      id:           r.id,
      userId:       r.user_id,
      userName:     r.profiles?.display_name ?? "—",
      userEmail:    emailMap.get(r.user_id) ?? "—",
      kind:         r.kind,
      channel:      r.channel,
      status:       r.status,
      target:       r.target ?? null,
      error:        r.error ?? null,
      scheduledFor: r.scheduled_for ?? null,
      sentAt:       r.sent_at ?? null,
      createdAt:    r.created_at,
    }));
  });

// ─── Fila (próximos envios) ───────────────────────────────────────────────────

export const getNotificationQueue = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<NotifRow[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await (supabaseAdmin as any)
      .from("subscription_notifications")
      .select("id, user_id, kind, channel, status, target, error, scheduled_for, sent_at, created_at, profiles!inner(display_name)")
      .eq("status", "pending")
      .order("scheduled_for", { ascending: true })
      .limit(300);

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows ?? []).map((r: any) => ({
      id: r.id, userId: r.user_id, userName: r.profiles?.display_name ?? "—",
      userEmail: emailMap.get(r.user_id) ?? "—", kind: r.kind, channel: r.channel,
      status: r.status, target: r.target ?? null, error: r.error ?? null,
      scheduledFor: r.scheduled_for ?? null, sentAt: r.sent_at ?? null, createdAt: r.created_at,
    }));
  });

// ─── Configurações do motor ───────────────────────────────────────────────────

export type NotifSettings = {
  channels:        Record<string, "email" | "whatsapp" | "both" | "off">;
  windowStartHour: number;
  windowEndHour:   number;
  throttlePerRun:  number;
  sendDelayMs:     number;
  timezone:        string;
};

export const getNotificationSettings = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<NotifSettings> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await (supabaseAdmin as any)
      .from("notification_settings").select("*").eq("id", true).maybeSingle();
    return {
      channels:        s?.channels ?? {},
      windowStartHour: s?.window_start_hour ?? 9,
      windowEndHour:   s?.window_end_hour ?? 20,
      throttlePerRun:  s?.throttle_per_run ?? 8,
      sendDelayMs:     s?.send_delay_ms ?? 1500,
      timezone:        s?.timezone ?? "America/Sao_Paulo",
    };
  });

export const saveNotificationSettings = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      channels:        z.record(z.enum(["email", "whatsapp", "both", "off"])),
      windowStartHour: z.number().int().min(0).max(23),
      windowEndHour:   z.number().int().min(1).max(24),
      throttlePerRun:  z.number().int().min(1).max(100),
      sendDelayMs:     z.number().int().min(0).max(30000),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("notification_settings")
      .update({
        channels:          data.channels,
        window_start_hour: data.windowStartHour,
        window_end_hour:   data.windowEndHour,
        throttle_per_run:  data.throttlePerRun,
        send_delay_ms:     data.sendDelayMs,
        updated_at:        new Date().toISOString(),
      })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Disparo manual das funções ───────────────────────────────────────────────

async function invokeEdge(fn: "subscription-cron" | "notification-worker") {
  const url = `${process.env.SUPABASE_URL}/functions/v1/${fn}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Falha (${res.status})`);
  return body;
}

export const triggerSubscriptionCron = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    return invokeEdge("subscription-cron");
  });

export const triggerNotificationWorker = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    return invokeEdge("notification-worker");
  });
