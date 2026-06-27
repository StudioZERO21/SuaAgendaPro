import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ─── Registrar visita ao link (server — precisa de service_role para escrever) ─

export const recordReferralVisit = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ code: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { data: link } = await db
      .from("referral_links")
      .select("id, referrer_id, is_active, expires_at, max_uses, total_clicks")
      .eq("code", data.code)
      .maybeSingle();

    if (!link || !link.is_active) return { ok: false, reason: "invalid" };
    if (link.expires_at && new Date(link.expires_at) < new Date()) return { ok: false, reason: "expired" };
    if (link.max_uses && link.total_clicks >= link.max_uses) return { ok: false, reason: "max_uses" };

    await Promise.all([
      db.from("referral_links")
        .update({ total_clicks: link.total_clicks + 1 })
        .eq("id", link.id),
      db.from("referral_conversions").insert({
        link_id:     link.id,
        referrer_id: link.referrer_id,
        status:      "clicked",
      }),
    ]);

    return { ok: true };
  });

// ─── Vincular conversão ao novo usuário após cadastro ────────────────────────

export const linkReferralToUser = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      code:         z.string().min(1),
      refereeId:    z.string().uuid(),
      refereeEmail: z.string().email().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { data: link } = await db
      .from("referral_links")
      .select("id, referrer_id")
      .eq("code", data.code)
      .maybeSingle();

    if (!link) return { ok: false };

    // Pega a conversão mais recente deste link ainda sem referee_id
    const { data: conv } = await db
      .from("referral_conversions")
      .select("id")
      .eq("link_id", link.id)
      .is("referee_id", null)
      .eq("status", "clicked")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
      await db
        .from("referral_conversions")
        .update({
          referee_id:    data.refereeId,
          referee_email: data.refereeEmail ?? null,
          registered_at: new Date().toISOString(),
          status:        "registered",
        })
        .eq("id", conv.id);
    } else {
      // Cria diretamente se não há conversão prévia
      await db.from("referral_conversions").insert({
        link_id:       link.id,
        referrer_id:   link.referrer_id,
        referee_id:    data.refereeId,
        referee_email: data.refereeEmail ?? null,
        registered_at: new Date().toISOString(),
        status:        "registered",
      });
    }

    return { ok: true };
  });

// ─── Buscar stats do profissional logado (client-side com RLS) ───────────────

export type MyReferralStats = {
  code:            string;
  isActive:        boolean;
  expiresAt:       string | null;
  totalClicks:     number;
  totalRegistered: number;
  totalRewarded:   number;
  pendingReward:   number;
  recentConversions: Array<{
    id:              string;
    refereeEmail:    string | null;
    status:          string;
    clickedAt:       string;
    registeredAt:    string | null;
    firstPaidAt:     string | null;
    rewardGrantedAt: string | null;
  }>;
};

export async function getMyReferralStats(): Promise<MyReferralStats | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabase as any;

  const { data: link } = await db
    .from("referral_links")
    .select("id, code, is_active, expires_at, total_clicks")
    .eq("referrer_id", user.id)
    .maybeSingle();

  if (!link) return null;

  const { data: conversions } = await db
    .from("referral_conversions")
    .select("id, referee_email, status, clicked_at, registered_at, first_paid_at, reward_granted_at")
    .eq("link_id", link.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const all = (conversions ?? []) as any[];

  return {
    code:            link.code,
    isActive:        link.is_active,
    expiresAt:       link.expires_at,
    totalClicks:     link.total_clicks,
    totalRegistered: all.filter((c) => ["registered","paid","rewarded"].includes(c.status)).length,
    totalRewarded:   all.filter((c) => c.status === "rewarded").length,
    pendingReward:   all.filter((c) => c.status === "registered").length,
    recentConversions: all.map((c) => ({
      id:              c.id,
      refereeEmail:    c.referee_email,
      status:          c.status,
      clickedAt:       c.clicked_at,
      registeredAt:    c.registered_at,
      firstPaidAt:     c.first_paid_at,
      rewardGrantedAt: c.reward_granted_at,
    })),
  };
}
