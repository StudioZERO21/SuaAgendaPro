// ETAPA 5 — Webhook Asaas
// Recebe eventos de pagamento e atualiza status da assinatura

import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute(
  "/api/webhooks/asaas",
).methods({
  POST: async ({ request }) => {
    // TODO (Etapa 5):
    // 1. Validar token do webhook (header access_token === ASAAS_WEBHOOK_TOKEN)
    // 2. Parsear payload
    // 3. Verificar idempotência em billing_events (asaas_event_id)
    // 4. Handler por event.event:
    //    - PAYMENT_CONFIRMED   → status: active
    //    - PAYMENT_RECEIVED    → status: active
    //    - PAYMENT_OVERDUE     → status: suspended
    //    - SUBSCRIPTION_CANCELLED → status: cancelled
    // 5. Inserir em billing_events
    // 6. Enviar WhatsApp de confirmação ou bloqueio

    const token = request.headers.get("asaas-access-token");
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = await request.json();
    console.log("[asaas-webhook] evento recebido:", payload?.event);

    // TODO: implementar handlers

    return new Response("ok", { status: 200 });
  },
});
