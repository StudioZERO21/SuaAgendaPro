// Etapa 7 — Server functions do Super Admin com dados reais
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { verifySuperToken } from "@/lib/super-auth.server";

// ─── Middleware de autenticação super admin ───────────────────────────────────

async function requireSuperAuth() {
  const req = getRequest();
  const token = req?.headers.get("x-super-token") ?? null;
  const ok = await verifySuperToken(token);
  if (!ok) {
    throw new Error("Unauthorized: super admin token inválido ou expirado");
  }
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

export type SuperMetrics = {
  totalUsers:     number;
  activeUsers:    number;
  trialUsers:     number;
  suspendedUsers: number;
  cancelledUsers: number;
  specialUsers:   number;
  mrr:            number;  // em reais
  churnThisMonth: number;
};

export const getSuperAdminMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<SuperMetrics> => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status, plan_id, cancelled_at, plans!inner(price_cents)");

    if (error) throw new Error(error.message);
    const rows = data ?? [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const counts = rows.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mrr = rows
      .filter((r) => r.status === "active")
      .reduce((sum, r) => sum + ((r.plans as any)?.price_cents ?? 0), 0) / 100;

    const churnThisMonth = rows.filter(
      (r) => r.status === "cancelled" && r.cancelled_at && r.cancelled_at >= startOfMonth,
    ).length;

    return {
      totalUsers:     rows.length,
      activeUsers:    counts["active"]    ?? 0,
      trialUsers:     counts["trial"]     ?? 0,
      suspendedUsers: counts["suspended"] ?? 0,
      cancelledUsers: counts["cancelled"] ?? 0,
      specialUsers:   counts["especial"]  ?? 0,
      mrr,
      churnThisMonth,
    };
  },
);

// ─── Lista de usuários ────────────────────────────────────────────────────────

export type SuperUser = {
  id:               string;
  email:            string;
  name:             string;
  phone:            string;
  slug:             string;
  specialty:        string;
  planId:           string;
  planName:         string;
  status:           string;
  trialEndsAt:      string | null;
  currentPeriodEnd: string | null;
  cancelledAt:      string | null;
  createdAt:        string;
  notes:            string | null;
};

export const getSuperAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<SuperUser[]> => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        status, plan_id, trial_ends_at, current_period_end, cancelled_at, notes, created_at,
        plans!inner(display_name),
        profiles!inner(id, display_name, phone, slug, specialty)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = (data ?? []).map((r) => (r.profiles as any)?.id).filter(Boolean);

    // Buscar emails em lote via admin auth
    const emailMap: Record<string, string> = {};
    await Promise.all(
      userIds.map(async (uid: string) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (user) emailMap[uid] = user.email ?? "";
      }),
    );

    return (data ?? []).map((r) => {
      const p = r.profiles as any;
      return {
        id:               p?.id                     ?? "",
        email:            emailMap[p?.id]            ?? "",
        name:             p?.display_name            ?? "",
        phone:            p?.phone                   ?? "",
        slug:             p?.slug                    ?? "",
        specialty:        p?.specialty               ?? "",
        planId:           r.plan_id,
        planName:         (r.plans as any)?.display_name ?? r.plan_id,
        status:           r.status,
        trialEndsAt:      r.trial_ends_at,
        currentPeriodEnd: r.current_period_end,
        cancelledAt:      r.cancelled_at,
        createdAt:        r.created_at,
        notes:            r.notes,
      };
    });
  },
);

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
    z.object({ userId: z.string().uuid(), planId: z.string(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth();
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
    z.object({ userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth();
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
    z.object({ userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id:  "especial",
        status:   "especial",
        trial_ends_at: null,
        current_period_end: null,
        notes: data.notes ?? "Plano Especial concedido pelo admin",
      })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "grant_especial", data.userId, data.userEmail ?? "", { notes: data.notes });
  });

export const adminSuspendUser = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), notes: z.string().optional(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "suspended", notes: data.notes ?? "Suspenso manualmente pelo admin" })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "suspend_user", data.userId, data.userEmail ?? "", { notes: data.notes });
  });

export const adminCancelSubscription = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), userEmail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);
    await auditLog(supabaseAdmin, "cancel_subscription", data.userId, data.userEmail ?? "");
  });
