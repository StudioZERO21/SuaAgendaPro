// Etapa 5 — Webhook Asaas
// Recebe eventos de pagamento e atualiza status da assinatura automaticamente

import { createServerFileRoute } from "@tanstack/react-start/server";
import { timingSafeEqual } from "node:crypto";

type AsaasWebhookPayload = {
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    customer: string;
    status: string;
    value: number;
    netValue: number;
    billingType: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
  };
};

const EVENT_TO_STATUS: Record<string, "active" | "suspended" | "cancelled" | null> = {
  PAYMENT_RECEIVED:          "active",
  PAYMENT_CONFIRMED:         "active",
  PAYMENT_OVERDUE:           "suspended",
  PAYMENT_DELETED:           null,
  PAYMENT_REFUNDED:          null,
  SUBSCRIPTION_CANCELLED:    "cancelled",
  SUBSCRIPTION_INACTIVATED:  "suspended",
};

function safeTokenEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export const ServerRoute = createServerFileRoute("/api/webhooks/asaas").methods({
  POST: async ({ request }) => {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!expectedToken) {
      console.error("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado — rejeitando requisição");
      return new Response("Internal Server Error", { status: 500 });
    }
    const token = request.headers.get("asaas-access-token") ?? "";
    if (!safeTokenEqual(token, expectedToken)) {
      console.warn("[asaas-webhook] token inválido");
      return new Response("Unauthorized", { status: 401 });
    }

    let payload: AsaasWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const { event, payment, subscription } = payload;
    console.log("[asaas-webhook] evento:", event, payment?.id ?? subscription?.id);

    const newStatus = EVENT_TO_STATUS[event];
    if (newStatus === undefined) {
      // Evento não mapeado — apenas loga e responde 200
      console.log("[asaas-webhook] evento ignorado:", event);
      return new Response("ok", { status: 200 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 2. Idempotência — evitar processar o mesmo evento 2x
    const eventId = payment?.id ?? subscription?.id ?? event;
    const { data: existing } = await supabaseAdmin
      .from("billing_events")
      .select("id")
      .eq("asaas_event_id", eventId)
      .maybeSingle();

    if (existing) {
      console.log("[asaas-webhook] evento já processado:", eventId);
      return new Response("ok", { status: 200 });
    }

    // 3. Encontrar usuário pelo asaas_subscription_id ou asaas_customer_id
    const asaasSubId    = payment?.subscription ?? subscription?.id ?? null;
    const asaasCustId   = payment?.customer     ?? subscription?.customer ?? null;

    let userId: string | null = null;
    let subId:  string | null = null;

    if (asaasSubId) {
      const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("id, user_id")
        .eq("asaas_subscription_id", asaasSubId)
        .maybeSingle();
      userId = data?.user_id ?? null;
      subId  = data?.id      ?? null;
    }

    if (!userId && asaasCustId) {
      const { data } = await supabaseAdmin
        .from("asaas_customers")
        .select("user_id")
        .eq("asaas_customer_id", asaasCustId)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }

    if (!userId) {
      console.warn("[asaas-webhook] usuário não encontrado para evento:", event, asaasSubId, asaasCustId);
      // Loga mesmo sem encontrar usuário
      await supabaseAdmin.from("billing_events").insert({
        event_type:      event,
        asaas_payment_id: payment?.id ?? null,
        asaas_event_id:   eventId,
        amount_cents:     payment ? Math.round(payment.value * 100) : null,
        payload:          payload as any,
      });
      return new Response("ok", { status: 200 });
    }

    // 4. Buscar status atual antes da mudança
    const { data: currentSub } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    const statusBefore = currentSub?.status ?? null;

    // 5. Atualizar status da assinatura (se o evento mapeia para algum status)
    if (newStatus !== null) {
      const updatePayload: Record<string, unknown> = { status: newStatus };

      if (newStatus === "active") {
        // Período: hoje até 1 mês
        const now = new Date();
        updatePayload.current_period_start = now.toISOString();
        updatePayload.current_period_end   = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
        updatePayload.plan_id              = "premium";
      }

      if (newStatus === "cancelled") {
        updatePayload.cancelled_at = new Date().toISOString();
      }

      await supabaseAdmin
        .from("subscriptions")
        .update(updatePayload)
        .eq("user_id", userId);

      console.log(`[asaas-webhook] usuário ${userId}: ${statusBefore} → ${newStatus}`);
    }

    // 6. Registrar evento no log
    await supabaseAdmin.from("billing_events").insert({
      user_id:          userId,
      subscription_id:  subId,
      event_type:       event,
      asaas_payment_id: payment?.id ?? null,
      asaas_event_id:   eventId,
      amount_cents:     payment ? Math.round(payment.value * 100) : null,
      status_before:    statusBefore,
      status_after:     newStatus,
      payload:          payload as any,
    });

    // 7. Verificar e conceder recompensa de indicação no primeiro pagamento
    if ((event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") && newStatus === "active") {
      const { data: conversion } = await (supabaseAdmin as any)
        .from("referral_conversions")
        .select("id, referrer_id")
        .eq("referee_id", userId)
        .eq("status", "registered")
        .is("reward_granted_at", null)
        .maybeSingle();

      if (conversion) {
        const { grantReferralReward } = await import("@/lib/super-referral.functions");
        await grantReferralReward(supabaseAdmin, conversion.referrer_id, userId, conversion.id);
      }
    }

    return new Response("ok", { status: 200 });
  },
});
