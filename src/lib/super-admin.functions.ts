import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

// ─── Métricas ─────────────────────────────────────────────────────────────────

export type SuperMetrics = {
  totalUsers:     number;
  activeUsers:    number;
  trialUsers:     number;
  suspendedUsers: number;
  cancelledUsers: number;
  specialUsers:   number;
  mrr:            number;
  churnThisMonth: number;
};

export const getSuperAdminMetrics = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<SuperMetrics> => {
    await requireSuperAuth(data._st ?? null);

    const { cacheGet, cacheSet } = await import("@/lib/redis.server");
    const cacheKey = "super:metrics";
    const cached = await cacheGet<SuperMetrics>(cacheKey);
    if (cached) return cached;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status, plan_id, cancelled_at, plans!inner(price_cents)");

    if (error) throw new Error(error.message);
    const subs = rows ?? [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const counts = subs.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mrr = subs
      .filter((r) => r.status === "active")
      .reduce((sum, r) => sum + ((r.plans as any)?.price_cents ?? 0), 0) / 100;

    const churnThisMonth = subs.filter(
      (r) => r.status === "cancelled" && r.cancelled_at && r.cancelled_at >= startOfMonth,
    ).length;

    const result: SuperMetrics = {
      totalUsers:     subs.length,
      activeUsers:    counts["active"]    ?? 0,
      trialUsers:     counts["trial"]     ?? 0,
      suspendedUsers: counts["suspended"] ?? 0,
      cancelledUsers: counts["cancelled"] ?? 0,
      specialUsers:   counts["especial"]  ?? 0,
      mrr,
      churnThisMonth,
    };

    await cacheSet(cacheKey, result, 120); // 2 min
    return result;
  });

// ─── Lista de usuários ────────────────────────────────────────────────────────

export type SuperUser = {
  id:               string;
  email:            string;
  name:             string;
  phone:            string;
  slug:             string;
  specialty:        string;
  avatarUrl:        string | null;
  planId:           string;
  planName:         string;
  status:           string;
  trialEndsAt:      string | null;
  currentPeriodEnd: string | null;
  cancelledAt:      string | null;
  createdAt:        string;
  notes:            string | null;
  grantedBy:        string | null;
};

export const getSuperAdminUsers = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<SuperUser[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        status, plan_id, trial_ends_at, current_period_end, cancelled_at, notes, created_at,
        plans!inner(display_name),
        profiles!inner(id, display_name, phone, slug, specialty, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = (rows ?? []).map((r) => (r.profiles as any)?.id).filter(Boolean);

    const [emailMap, activeGrants] = await Promise.all([
      Promise.all(
        userIds.map(async (uid: string) => {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
          return [uid, user?.email ?? ""] as [string, string];
        }),
      ).then((pairs) => Object.fromEntries(pairs)),
      supabaseAdmin
        .from("special_access_grants")
        .select("user_id, granted_by")
        .is("revoked_at", null)
        .then(({ data }) => new Map((data ?? []).map((g: any) => [g.user_id, g.granted_by as string]))),
    ]);

    return (rows ?? []).map((r) => {
      const p = r.profiles as any;
      return {
        id:               p?.id                              ?? "",
        email:            emailMap[p?.id]                    ?? "",
        name:             p?.display_name                    ?? "",
        phone:            p?.phone                           ?? "",
        slug:             p?.slug                            ?? "",
        specialty:        p?.specialty                       ?? "",
        avatarUrl:        p?.avatar_url                      ?? null,
        planId:           r.plan_id,
        planName:         (r.plans as any)?.display_name     ?? r.plan_id,
        status:           r.status,
        trialEndsAt:      r.trial_ends_at,
        currentPeriodEnd: r.current_period_end,
        cancelledAt:      r.cancelled_at,
        createdAt:        r.created_at,
        notes:            r.notes,
        grantedBy:        activeGrants.get(p?.id)            ?? null,
      };
    });
  });

// ─── Ações admin ──────────────────────────────────────────────────────────────

async function auditLog(
  supabaseAdmin: any,
  action: string,
  userId: string,
  email: string,
  details: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("admin_audit_log").insert({
    action,
    target_user_id:    userId,
    target_user_email: email,
    details,
  });
}

export const adminChangePlan = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), planId: z.string(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const newStatus = data.planId === "especial" ? "especial" : "active";
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ plan_id: data.planId, status: newStatus, notes: data.notes ?? null })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "change_plan", data.userId, data.userEmail ?? "", { planId: data.planId, notes: data.notes });
  });

export const adminUnblockUser = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        notes: data.notes ?? "Desbloqueado manualmente pelo admin",
      })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "unblock_user", data.userId, data.userEmail ?? "", { notes: data.notes });
  });

export const adminGrantSpecial = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { getSuperAuthEmail } = await import("@/lib/super-auth.server");
    const grantedBy = await getSuperAuthEmail(data._st ?? null);
    if (!grantedBy) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check per-admin limit of 5 active special grants
    const { count } = await supabaseAdmin
      .from("special_access_grants")
      .select("id", { count: "exact", head: true })
      .eq("granted_by", grantedBy)
      .is("revoked_at", null);

    if ((count ?? 0) >= 5) {
      throw new Error(`Limite de 5 acessos especiais atingido. Revogue um para conceder novo.`);
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id:            "especial",
        status:             "especial",
        trial_ends_at:      null,
        current_period_end: null,
        notes:              data.notes ?? `Plano Especial concedido por ${grantedBy}`,
      })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);

    // Record the grant (revoke any stale active grant for this user first)
    await supabaseAdmin
      .from("special_access_grants")
      .update({ revoked_at: new Date().toISOString(), revoked_by: grantedBy })
      .eq("user_id", data.userId)
      .is("revoked_at", null);

    await supabaseAdmin
      .from("special_access_grants")
      .insert({ user_id: data.userId, granted_by: grantedBy });

    await auditLog(supabaseAdmin, "grant_especial", data.userId, data.userEmail ?? "", { notes: data.notes, grantedBy });
  });

export const adminRevokeSpecial = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { getSuperAuthEmail } = await import("@/lib/super-auth.server");
    const revokedBy = await getSuperAuthEmail(data._st ?? null);
    if (!revokedBy) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("special_access_grants")
      .update({ revoked_at: new Date().toISOString(), revoked_by: revokedBy })
      .eq("user_id", data.userId)
      .is("revoked_at", null);

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", plan_id: "trial", notes: data.notes ?? `Especial revogado por ${revokedBy}` })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "revoke_especial", data.userId, data.userEmail ?? "", { notes: data.notes, revokedBy });
  });

export const getSuperAdminInfo = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<{ email: string; grantCount: number }> => {
    await requireSuperAuth(data._st ?? null);
    const { getSuperAuthEmail } = await import("@/lib/super-auth.server");
    const email = await getSuperAuthEmail(data._st ?? null);
    if (!email) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("special_access_grants")
      .select("id", { count: "exact", head: true })
      .eq("granted_by", email)
      .is("revoked_at", null);

    return { email, grantCount: count ?? 0 };
  });

export const adminSuspendUser = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "suspended", notes: data.notes ?? "Suspenso manualmente pelo admin" })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "suspend_user", data.userId, data.userEmail ?? "", { notes: data.notes });
  });

export const adminResetToTrial = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const trialEndsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id:            "trial",
        status:             "trial",
        trial_ends_at:      trialEndsAt,
        current_period_end: null,
        cancelled_at:       null,
        notes:              data.notes ?? "Trial reiniciado pelo admin",
      })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "reset_to_trial", data.userId, data.userEmail ?? "", { notes: data.notes, trialEndsAt });
  });

export const adminCancelSubscription = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "cancel_subscription", data.userId, data.userEmail ?? "");
  });

// ─── Billing Events ───────────────────────────────────────────────────────────

export type BillingEvent = {
  id:              string;
  userId:          string;
  userName:        string;
  userEmail:       string;
  eventType:       string;
  amountCents:     number;
  statusBefore:    string | null;
  statusAfter:     string | null;
  asaasPaymentId:  string | null;
  createdAt:       string;
};

export const getBillingEvents = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      _st:      _st,
      from:     z.string().optional(),
      to:       z.string().optional(),
      eventType: z.string().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<BillingEvent[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = (supabaseAdmin as any)
      .from("billing_events")
      .select("id, user_id, event_type, amount_cents, status_before, status_after, asaas_payment_id, created_at, profiles!inner(display_name)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.from) q = q.gte("created_at", data.from);
    if (data.to)   q = q.lte("created_at", data.to + "T23:59:59Z");
    if (data.eventType && data.eventType !== "todos") q = q.eq("event_type", data.eventType);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Busca emails em batch
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (rows ?? []).map((r: any) => ({
      id:             r.id,
      userId:         r.user_id,
      userName:       r.profiles?.display_name ?? "—",
      userEmail:      emailMap.get(r.user_id) ?? "—",
      eventType:      r.event_type,
      amountCents:    r.amount_cents ?? 0,
      statusBefore:   r.status_before ?? null,
      statusAfter:    r.status_after ?? null,
      asaasPaymentId: r.asaas_payment_id ?? null,
      createdAt:      r.created_at,
    }));
  });

// ─── Session & Password Management ───────────────────────────────────────────

export const adminForceSessionEnd = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ active_session_nonce: crypto.randomUUID() })
      .eq("id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "force_session_end", data.userId, data.userEmail ?? "", {});
    return { ok: true };
  });

export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      userId:    z.string().uuid(),
      userEmail: z.string().email(),
      appOrigin: z.string().url(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const token     = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        force_password_change:           true,
        password_reset_token:            token,
        password_reset_token_expires_at: expiresAt,
        active_session_nonce:            crypto.randomUUID(),
      })
      .eq("id", data.userId);

    if (error) throw new Error(error.message);

    const { getServerEnv } = await import("@/lib/server-env");
    const apiKey = getServerEnv("RESEND_API_KEY");
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend    = new Resend(apiKey);
      const from      = getServerEnv("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
      const resetLink = `${data.appOrigin}/redefinir-senha?token=${token}`;
      const expiryFmt = new Date(expiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

      await resend.emails.send({
        from,
        to:      data.userEmail,
        subject: "Defina uma nova senha — SuaAgenda.Pro",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px"><h2 style="color:#ec4899;margin:0 0 16px;font-size:20px">Troca de senha necessária</h2><p style="color:#374151;margin:0 0 16px;line-height:1.6">O administrador solicitou que você cadastre uma <strong>nova senha</strong> para continuar acessando o <strong>SuaAgenda.Pro</strong>.</p><p style="color:#374151;margin:0 0 24px;line-height:1.6">Clique no botão abaixo para definir sua nova senha. O link é válido por <strong>4 horas</strong>.</p><a href="${resetLink}" style="display:inline-block;background:#ec4899;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Definir nova senha</a><p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.5">Você também pode fazer login normalmente e será solicitado a criar uma nova senha diretamente no app.</p><p style="color:#d1d5db;font-size:12px;margin:8px 0 0">Link válido até: ${expiryFmt}</p></div>`,
      });
    }

    await auditLog(supabaseAdmin, "force_password_reset", data.userId, data.userEmail, { expiresAt });
    return { ok: true };
  });
