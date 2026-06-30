import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

const DAY = 86_400_000;
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

// ─── Visão geral de cobrança (quem vai bloquear) ──────────────────────────────

export type BillingRow = {
  userId:           string;
  name:             string;
  email:            string;
  phone:            string;
  planId:           string;
  planName:         string;
  priceCents:       number;
  status:           string;
  trialEndsAt:      string | null;
  currentPeriodEnd: string | null;
  graceEndsAt:      string | null;
  cancelledAt:      string | null;
  nextEventAt:      string | null;   // data relevante (fim do trial ou vencimento)
  nextEventLabel:   string;          // "Fim do Acesso Livre" | "Vencimento" | "—"
  daysToBlock:      number | null;   // dias até bloquear (negativo = já passou)
  isBlocked:        boolean;
  notes:            string | null;
};

export const getBillingOverview = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<BillingRow[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        user_id, plan_id, status, trial_ends_at, current_period_end,
        grace_period_ends_at, cancelled_at, notes,
        plans!inner(display_name, price_cents),
        profiles!inner(display_name, phone)
      `);
    if (error) throw new Error(error.message);

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    const list: BillingRow[] = (rows ?? []).map((r: any) => {
      const p = r.profiles ?? {};
      const plan = r.plans ?? {};

      // Define a data relevante e o rótulo conforme o status
      let nextEventAt: string | null = null;
      let nextEventLabel = "—";
      if (r.status === "trial") {
        nextEventAt = r.trial_ends_at;
        nextEventLabel = "Fim do Acesso Livre";
      } else if (r.status === "active") {
        nextEventAt = r.current_period_end;
        nextEventLabel = "Vencimento";
      }

      const daysToBlock = daysUntil(nextEventAt);
      const isBlocked =
        r.status === "suspended" || r.status === "cancelled" || r.status === "overdue" ||
        (r.status === "trial" && r.trial_ends_at && new Date(r.trial_ends_at) < new Date());

      return {
        userId:           r.user_id,
        name:             p.display_name ?? "—",
        email:            emailMap.get(r.user_id) ?? "—",
        phone:            p.phone ?? "",
        planId:           r.plan_id,
        planName:         plan.display_name ?? r.plan_id,
        priceCents:       plan.price_cents ?? 0,
        status:           r.status,
        trialEndsAt:      r.trial_ends_at,
        currentPeriodEnd: r.current_period_end,
        graceEndsAt:      r.grace_period_ends_at,
        cancelledAt:      r.cancelled_at,
        nextEventAt,
        nextEventLabel,
        daysToBlock,
        isBlocked: !!isBlocked,
        notes:            r.notes,
      };
    });

    // Ordena por urgência: bloqueados/vencidos no topo; depois por dias restantes
    // crescente; especial/sem data por último.
    const sortKey = (b: BillingRow) => {
      if (b.status === "especial") return 1e9;
      if (b.isBlocked) return -1e9 + new Date(b.cancelledAt ?? b.nextEventAt ?? 0).getTime() / 1e9;
      if (b.daysToBlock === null) return 9e8;
      return b.daysToBlock;
    };
    return list.sort((a, b) => sortKey(a) - sortKey(b));
  });

// ─── Detalhe de um usuário: timeline (pagamentos + notificações) ──────────────

export type TimelineItem =
  | {
      kind: "payment";
      id: string;
      at: string;
      eventType: string;
      amountCents: number;
      statusBefore: string | null;
      statusAfter: string | null;
    }
  | {
      kind: "notification";
      id: string;
      at: string;
      notifKind: string;     // trial_3d, billing_1d, ...
      channel: string;       // email | whatsapp
      status: string;        // sent | failed
      target: string | null;
      error: string | null;
    };

export const getUserBillingDetail = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ _st, userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ timeline: TimelineItem[] }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [payments, notifs] = await Promise.all([
      (supabaseAdmin as any)
        .from("billing_events")
        .select("id, event_type, amount_cents, status_before, status_after, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(200)
        .then(({ data: d }: any) => d ?? []),
      (supabaseAdmin as any)
        .from("subscription_notifications")
        .select("id, kind, channel, status, target, error, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(200)
        .then(({ data: d }: any) => d ?? []),
    ]);

    const timeline: TimelineItem[] = [
      ...payments.map((p: any) => ({
        kind: "payment" as const,
        id: p.id,
        at: p.created_at,
        eventType: p.event_type,
        amountCents: p.amount_cents ?? 0,
        statusBefore: p.status_before ?? null,
        statusAfter: p.status_after ?? null,
      })),
      ...notifs.map((n: any) => ({
        kind: "notification" as const,
        id: n.id,
        at: n.created_at,
        notifKind: n.kind,
        channel: n.channel,
        status: n.status,
        target: n.target ?? null,
        error: n.error ?? null,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return { timeline };
  });

// ─── Renovar manualmente (+30 dias) ───────────────────────────────────────────

export const adminRenewSubscription = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      userId:    z.string().uuid(),
      userEmail: z.string().optional(),
      days:      z.number().int().min(1).max(365).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const days = data.days ?? 30;

    // Estende a partir do vencimento atual (se futuro) ou de agora
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", data.userId)
      .maybeSingle();

    const base = sub?.current_period_end && new Date(sub.current_period_end) > new Date()
      ? new Date(sub.current_period_end)
      : new Date();
    const newEnd = new Date(base.getTime() + days * DAY).toISOString();

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: newEnd,
        cancelled_at: null,
        notes: `Renovado manualmente (+${days}d) pelo admin`,
      })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("admin_audit_log").insert({
      action: "renew_subscription",
      target_user_id: data.userId,
      target_user_email: data.userEmail ?? "",
      details: { days, newEnd },
    });

    return { ok: true, newEnd };
  });

// ─── Health do cron ───────────────────────────────────────────────────────────

export type CronRun = {
  id: string;
  job: string;
  notified: number;
  suspended: number;
  errors: number;
  durationMs: number | null;
  createdAt: string;
};

export const getCronRuns = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<CronRun[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await (supabaseAdmin as any)
      .from("cron_runs")
      .select("id, job, notified, suspended, errors, duration_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    return (rows ?? []).map((r: any) => ({
      id: r.id,
      job: r.job,
      notified: r.notified ?? 0,
      suspended: r.suspended ?? 0,
      errors: r.errors ?? 0,
      durationMs: r.duration_ms ?? null,
      createdAt: r.created_at,
    }));
  });
