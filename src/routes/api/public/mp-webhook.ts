import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifyMpSignature(
  secret: string,
  body: string,
  xSignature: string,
  xRequestId: string,
  ts: string,
): boolean {
  try {
    // MP signature format: "ts=...,v1=..."
    const parts = Object.fromEntries(
      xSignature.split(",").map((p) => {
        const [k, ...v] = p.split("=");
        return [k.trim(), v.join("=")];
      }),
    );
    const v1 = parts["v1"];
    if (!v1) return false;

    // Signed template: "id:{x-request-id};ts:{ts};body:{body}"
    const template = `id:${xRequestId};ts:${ts};body:${body}`;
    const expected = createHmac("sha256", secret).update(template).digest("hex");

    const a = Buffer.from(v1);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.MP_WEBHOOK_SECRET;
        if (!webhookSecret) {
          console.error("[mp-webhook] MP_WEBHOOK_SECRET não configurado — rejeitando requisição");
          return new Response("Internal Server Error", { status: 500 });
        }

        const body = await request.text();

        const xSignature = request.headers.get("x-signature") ?? "";
        const xRequestId = request.headers.get("x-request-id") ?? "";
        const ts = xSignature.match(/ts=([^,]+)/)?.[1] ?? "";
        if (!verifyMpSignature(webhookSecret, body, xSignature, xRequestId, ts)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: { type?: string; data?: { id?: string | number } };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        // Only handle payment notifications
        if (payload.type !== "payment" || !payload.data?.id) {
          return new Response("OK", { status: 200 });
        }

        const paymentId = String(payload.data.id);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Lookup direto via external_reference quando possível
          let appointmentId: string | null = null;

          // Primeiro: buscar transação existente pelo payment id
          const { data: existingTx } = await supabaseAdmin
            .from("payment_transactions")
            .select("user_id, appointment_id, mercado_pago_payment_id")
            .eq("mercado_pago_payment_id", paymentId)
            .maybeSingle();

          let secretUserId = existingTx?.user_id ?? null;
          appointmentId = existingTx?.appointment_id ?? null;

          if (!secretUserId) {
            // Buscar agendamento pelo external_reference (appointment id)
            const { data: secrets } = await supabaseAdmin
              .from("mercado_pago_account_secrets")
              .select("user_id, access_token");

            if (!secrets?.length) return new Response("OK", { status: 200 });

            for (const secret of secrets) {
              const res = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                { headers: { Authorization: `Bearer ${secret.access_token}` } },
              );
              if (!res.ok) continue;

              const payment = (await res.json()) as {
                status?: string;
                transaction_amount?: number;
                description?: string;
                date_approved?: string;
                payer?: { email?: string; first_name?: string; last_name?: string };
                external_reference?: string;
              };

              if (payment.external_reference) {
                appointmentId = payment.external_reference;
                const { data: appt } = await supabaseAdmin
                  .from("appointments")
                  .select("professional_id")
                  .eq("id", payment.external_reference)
                  .maybeSingle();
                if (appt?.professional_id === secret.user_id) {
                  secretUserId = secret.user_id;
                  await processMpPayment(
                    supabaseAdmin,
                    secret.user_id,
                    paymentId,
                    payment,
                    appointmentId,
                  );
                  break;
                }
              }
            }
          } else {
            const { data: secret } = await supabaseAdmin
              .from("mercado_pago_account_secrets")
              .select("access_token")
              .eq("user_id", secretUserId)
              .maybeSingle();

            if (secret?.access_token) {
              const res = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                { headers: { Authorization: `Bearer ${secret.access_token}` } },
              );
              if (res.ok) {
                const payment = await res.json();
                await processMpPayment(
                  supabaseAdmin,
                  secretUserId,
                  paymentId,
                  payment,
                  appointmentId,
                );
              }
            }
          }
        } catch (err) {
          console.error("[mp-webhook] processing error:", err);
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});

async function processMpPayment(
  supabaseAdmin: Awaited<
    ReturnType<typeof import("@/integrations/supabase/client.server")>
  >["supabaseAdmin"],
  userId: string,
  paymentId: string,
  payment: {
    status?: string;
    transaction_amount?: number;
    description?: string;
    date_approved?: string;
    payer?: { email?: string; first_name?: string; last_name?: string };
    external_reference?: string;
  },
  appointmentId: string | null,
) {
  const status =
    payment.status === "approved"
      ? "paid"
      : payment.status === "cancelled"
        ? "cancelled"
        : payment.status === "refunded" || payment.status === "charged_back"
          ? "refunded"
          : payment.status === "rejected"
            ? "failed"
            : "pending";

  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const clientName =
    [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(" ") ||
    payment.payer?.email ||
    "Cliente Mercado Pago";

  const { data: tx } = await supabaseAdmin
    .from("payment_transactions")
    .upsert(
      {
        user_id: userId,
        client_name: clientName,
        service_name: payment.description || "Pagamento Mercado Pago",
        amount_cents: amountCents,
        method: "mercado_pago",
        status,
        external_reference: payment.external_reference || null,
        mercado_pago_payment_id: paymentId,
        paid_at: payment.date_approved || null,
        appointment_id: appointmentId,
      },
      { onConflict: "user_id,mercado_pago_payment_id" },
    )
    .select("appointment_id")
    .maybeSingle();

  const apptId = tx?.appointment_id ?? appointmentId;
  if (apptId && status === "paid") {
    await supabaseAdmin
      .from("appointments")
      .update({ deposit_paid: true, status: "confirmed" })
      .eq("id", apptId)
      .eq("professional_id", userId);

    try {
      const { pushAppointmentToGoogle } = await import("@/lib/google-calendar.functions");
      await pushAppointmentToGoogle(userId, apptId, "create");
    } catch {}
  }
}
