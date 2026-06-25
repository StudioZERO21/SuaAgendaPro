import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = {
  id: string;
  display_name: string;
  price_cents: number;
  billing_cycle: string;
  trial_days: number;
  is_active: boolean;
  is_visible: boolean;
  features: string[];
  sort_order: number;
  created_at: string;
};

export type PlanPromotion = {
  id: string;
  plan_id: string;
  plan_name: string;
  name: string;
  discount_pct: number;
  type: "duration" | "deadline" | "permanent";
  duration_months: number | null;
  deadline_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type PlanWithStats = Plan & {
  sub_active: number;
  sub_trial: number;
  sub_suspended: number;
  sub_cancelled: number;
  sub_total: number;
  revenue_cents: number;
  promotions: PlanPromotion[];
};

export type PlansOverview = {
  plans: PlanWithStats[];
  mrr_cents: number;
  total_active: number;
  total_trial: number;
  churn_this_month: number;
  conversion_pct: number;
};

// ─── Read ──────────────────────────────────────────────────────────────────────

export const getPlansOverview = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ _st }).parse(i ?? {}))
  .handler(async ({ data }): Promise<PlansOverview> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: plans }, { data: subs }, { data: promos }] = await Promise.all([
      supabaseAdmin.from("plans").select("*").order("sort_order"),
      supabaseAdmin.from("subscriptions").select("plan_id, status, cancelled_at, current_period_start"),
      (supabaseAdmin as any).from("plan_promotions").select("*").order("created_at", { ascending: false }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Agrupa subscriptions por plano
    const byPlan: Record<string, { active: number; trial: number; suspended: number; cancelled: number }> = {};
    for (const s of subs ?? []) {
      if (!byPlan[s.plan_id]) byPlan[s.plan_id] = { active: 0, trial: 0, suspended: 0, cancelled: 0 };
      const key = s.status as "active" | "trial" | "suspended" | "cancelled";
      if (key in byPlan[s.plan_id]) byPlan[s.plan_id][key]++;
    }

    // Agrupa promoções por plano
    const promosByPlan: Record<string, PlanPromotion[]> = {};
    for (const p of promos ?? []) {
      if (!promosByPlan[p.plan_id]) promosByPlan[p.plan_id] = [];
      promosByPlan[p.plan_id].push({
        id: p.id,
        plan_id: p.plan_id,
        plan_name: (plans ?? []).find((pl) => pl.id === p.plan_id)?.display_name ?? p.plan_id,
        name: p.name,
        discount_pct: Number(p.discount_pct),
        type: p.type,
        duration_months: p.duration_months ?? null,
        deadline_at: p.deadline_at ?? null,
        is_active: p.is_active,
        created_at: p.created_at,
      });
    }

    const plansWithStats: PlanWithStats[] = (plans ?? []).map((pl) => {
      const c = byPlan[pl.id] ?? { active: 0, trial: 0, suspended: 0, cancelled: 0 };
      return {
        ...pl,
        features: (pl.features ?? []) as string[],
        sub_active:    c.active,
        sub_trial:     c.trial,
        sub_suspended: c.suspended,
        sub_cancelled: c.cancelled,
        sub_total:     c.active + c.trial + c.suspended + c.cancelled,
        revenue_cents: c.active * pl.price_cents,
        promotions:    promosByPlan[pl.id] ?? [],
      };
    });

    const mrr_cents     = plansWithStats.reduce((s, p) => s + p.revenue_cents, 0);
    const total_active  = plansWithStats.reduce((s, p) => s + p.sub_active, 0);
    const total_trial   = plansWithStats.reduce((s, p) => s + p.sub_trial, 0);
    const churn_this_month = (subs ?? []).filter(
      (s) => s.status === "cancelled" && s.cancelled_at && s.cancelled_at >= startOfMonth,
    ).length;
    const total_all = (subs ?? []).length;
    const conversion_pct = total_all > 0 ? Math.round((total_active / total_all) * 100) : 0;

    return { plans: plansWithStats, mrr_cents, total_active, total_trial, churn_this_month, conversion_pct };
  });

// ─── Upsert Plan ──────────────────────────────────────────────────────────────

const planSchema = z.object({
  _st,
  id:            z.string().optional(),
  display_name:  z.string().min(1),
  price_cents:   z.number().int().min(0),
  billing_cycle: z.enum(["monthly", "quarterly", "yearly", "none"]),
  trial_days:    z.number().int().min(0),
  is_active:     z.boolean(),
  is_visible:    z.boolean(),
  features:      z.array(z.string()),
  sort_order:    z.number().int().min(0),
});

export const upsertPlan = createServerFn({ method: "POST" })
  .validator((i: unknown) => planSchema.parse(i))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { _st: _, ...payload } = data;

    if (payload.id) {
      const { error } = await supabaseAdmin.from("plans").update(payload).eq("id", payload.id);
      if (error) throw new Error(error.message);
      return { id: payload.id };
    } else {
      const id = payload.display_name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const { error } = await (supabaseAdmin as any).from("plans").insert({ ...payload, id });
      if (error) throw new Error(error.message);
      return { id };
    }
  });

// ─── Toggle field (is_active / is_visible) ────────────────────────────────────

export const togglePlanField = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ _st, id: z.string(), field: z.enum(["is_active", "is_visible"]), value: z.boolean() }).parse(i),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("plans").update({ [data.field]: data.value }).eq("id", data.id);
    if (error) throw new Error(error.message);
  });

// ─── Upsert Promotion ─────────────────────────────────────────────────────────

const promoSchema = z.object({
  _st,
  id:              z.string().uuid().optional(),
  plan_id:         z.string(),
  name:            z.string().min(1),
  discount_pct:    z.number().min(0.01).max(100),
  type:            z.enum(["duration", "deadline", "permanent"]),
  duration_months: z.number().int().min(1).nullable(),
  deadline_at:     z.string().nullable(),
  is_active:       z.boolean(),
});

export const upsertPromotion = createServerFn({ method: "POST" })
  .validator((i: unknown) => promoSchema.parse(i))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { _st: _, ...payload } = data;
    const db = supabaseAdmin as any;

    if (payload.id) {
      const { error } = await db.from("plan_promotions").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", payload.id);
      if (error) throw new Error(error.message);
      return { id: payload.id };
    } else {
      const { data: row, error } = await db.from("plan_promotions").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

// ─── Delete Promotion ─────────────────────────────────────────────────────────

export const deletePromotion = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("plan_promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });
