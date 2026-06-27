import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

// ─── Métricas gerais ──────────────────────────────────────────────────────────

export type ReferralMetrics = {
  totalLinks:      number;
  activeLinks:     number;
  totalClicks:     number;
  totalRegistered: number;
  totalPaid:       number;
  totalRewarded:   number;
  pendingReward:   number;
  monthsGranted:   number;
};

export const getSuperReferralMetrics = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<ReferralMetrics> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const db = supabaseAdmin as any;
    const [{ data: links }, { data: convs }] = await Promise.all([
      db.from("referral_links").select("id, is_active, total_clicks"),
      db.from("referral_conversions").select("status, reward_granted_at"),
    ]);

    const allLinks = (links ?? []) as any[];
    const allConvs = (convs ?? []) as any[];

    return {
      totalLinks:      allLinks.length,
      activeLinks:     allLinks.filter((l: any) => l.is_active).length,
      totalClicks:     allLinks.reduce((s: number, l: any) => s + (l.total_clicks ?? 0), 0),
      totalRegistered: allConvs.filter((c: any) => ["registered","paid","rewarded"].includes(c.status)).length,
      totalPaid:       allConvs.filter((c: any) => ["paid","rewarded"].includes(c.status)).length,
      totalRewarded:   allConvs.filter((c: any) => c.status === "rewarded").length,
      pendingReward:   allConvs.filter((c: any) => c.status === "registered").length,
      monthsGranted:   allConvs.filter((c: any) => c.reward_granted_at !== null).length,
    };
  });

// ─── Lista de todos os links ──────────────────────────────────────────────────

export type ReferralLink = {
  id:           string;
  referrerId:   string;
  referrerName: string;
  referrerEmail: string;
  code:         string;
  isActive:     boolean;
  expiresAt:    string | null;
  maxUses:      number | null;
  totalClicks:  number;
  totalConverted: number;
  totalRewarded: number;
  createdAt:    string;
};

export const getSuperReferralLinks = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<ReferralLink[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const db = supabaseAdmin as any;
    const { data: links, error } = await db
      .from("referral_links")
      .select("id, referrer_id, code, is_active, expires_at, max_uses, total_clicks, created_at, profiles!inner(display_name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const { data: convs } = await db
      .from("referral_conversions")
      .select("link_id, status");

    const convMap: Record<string, { converted: number; rewarded: number }> = {};
    for (const c of (convs ?? []) as any[]) {
      if (!convMap[c.link_id]) convMap[c.link_id] = { converted: 0, rewarded: 0 };
      if (["registered","paid","rewarded"].includes(c.status)) convMap[c.link_id].converted++;
      if (c.status === "rewarded") convMap[c.link_id].rewarded++;
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (links ?? []).map((l: any) => ({
      id:             l.id,
      referrerId:     l.referrer_id,
      referrerName:   l.profiles?.display_name ?? "—",
      referrerEmail:  emailMap.get(l.referrer_id) ?? "—",
      code:           l.code,
      isActive:       l.is_active,
      expiresAt:      l.expires_at,
      maxUses:        l.max_uses,
      totalClicks:    l.total_clicks,
      totalConverted: convMap[l.id]?.converted ?? 0,
      totalRewarded:  convMap[l.id]?.rewarded ?? 0,
      createdAt:      l.created_at,
    }));
  });

// ─── Lista de todas as conversões ────────────────────────────────────────────

export type ReferralConversion = {
  id:               string;
  linkId:           string;
  referrerId:       string;
  referrerName:     string;
  referrerEmail:    string;
  refereeId:        string | null;
  refereeName:      string | null;
  refereeEmail:     string | null;
  status:           string;
  clickedAt:        string;
  registeredAt:     string | null;
  firstPaidAt:      string | null;
  rewardGrantedAt:  string | null;
};

export const getSuperReferralConversions = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      _st,
      status: z.string().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<ReferralConversion[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const db = supabaseAdmin as any;
    let q = db
      .from("referral_conversions")
      .select("id, link_id, referrer_id, referee_id, referee_email, status, clicked_at, registered_at, first_paid_at, reward_granted_at, profiles!referral_conversions_referrer_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status && data.status !== "todos") {
      q = q.eq("status", data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    const refereeIds = (rows ?? []).map((r: any) => r.referee_id).filter(Boolean) as string[];
    const refereeProfileMap: Record<string, string> = {};
    if (refereeIds.length > 0) {
      const { data: refProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", refereeIds);
      for (const p of refProfiles ?? []) refereeProfileMap[p.id] = p.display_name ?? "";
    }

    return (rows ?? []).map((r: any) => ({
      id:              r.id,
      linkId:          r.link_id,
      referrerId:      r.referrer_id,
      referrerName:    r.profiles?.display_name ?? "—",
      referrerEmail:   emailMap.get(r.referrer_id) ?? "—",
      refereeId:       r.referee_id,
      refereeName:     r.referee_id ? (refereeProfileMap[r.referee_id] ?? "—") : null,
      refereeEmail:    r.referee_email ?? (r.referee_id ? emailMap.get(r.referee_id) ?? null : null),
      status:          r.status,
      clickedAt:       r.clicked_at,
      registeredAt:    r.registered_at,
      firstPaidAt:     r.first_paid_at,
      rewardGrantedAt: r.reward_granted_at,
    }));
  });

// ─── Ações admin ──────────────────────────────────────────────────────────────

export const adminToggleReferralLink = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, linkId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any)
      .from("referral_links")
      .update({ is_active: data.isActive })
      .eq("id", data.linkId);

    if (error) throw new Error(error.message);
  });

export const adminSetReferralExpiry = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      linkId:    z.string().uuid(),
      expiresAt: z.string().nullable(),
      maxUses:   z.number().nullable(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any)
      .from("referral_links")
      .update({ expires_at: data.expiresAt, max_uses: data.maxUses })
      .eq("id", data.linkId);

    if (error) throw new Error(error.message);
  });

export const adminGrantReferralReward = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, conversionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: conv } = await (supabaseAdmin as any)
      .from("referral_conversions")
      .select("id, referrer_id, referee_id, status, reward_granted_at")
      .eq("id", data.conversionId)
      .maybeSingle();

    if (!conv) throw new Error("Conversão não encontrada");
    if (conv.reward_granted_at) throw new Error("Recompensa já concedida");

    await grantReferralReward(supabaseAdmin, conv.referrer_id, conv.referee_id ?? "", conv.id);
  });

// ─── Lógica de concessão da recompensa (compartilhada com webhook) ────────────

export async function grantReferralReward(
  supabaseAdmin: any,
  referrerId: string,
  refereeId: string,
  conversionId: string,
) {
  const now = new Date();

  // Busca assinatura atual do referrer
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", referrerId)
    .maybeSingle();

  if (!sub) return;

  const base = sub.current_period_end ? new Date(sub.current_period_end) : now;
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + 1);

  const newStatus = sub.status === "trial" ? "active" : sub.status;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status:              newStatus,
      current_period_end:  newEnd.toISOString(),
      current_period_start: sub.status === "trial" ? now.toISOString() : undefined,
      notes: `+1 mês bônus por indicação em ${now.toLocaleDateString("pt-BR")}`,
    })
    .eq("user_id", referrerId);

  await supabaseAdmin
    .from("referral_conversions")
    .update({
      first_paid_at:     now.toISOString(),
      reward_granted_at: now.toISOString(),
      status:            "rewarded",
    })
    .eq("id", conversionId);

  await supabaseAdmin.from("billing_events").insert({
    user_id:      referrerId,
    event_type:   "REFERRAL_BONUS_GRANTED",
    amount_cents: 0,
    status_before: sub.status,
    status_after:  newStatus,
    payload:       { referee_id: refereeId, conversion_id: conversionId, new_period_end: newEnd.toISOString() },
  });

  console.log(`[referral] Recompensa concedida: referrer=${referrerId} referee=${refereeId}`);
}
