import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createAsaasCustomer,
  findAsaasCustomerByEmail,
  createAsaasSubscription,
  getFirstPendingPayment,
  cancelAsaasSubscription,
  getAsaasSubscription,
} from "@/lib/asaas.service";

// ─── Cria sessão de checkout no Asaas ────────────────────────────────────────
// Retorna a URL de pagamento do Asaas onde o usuário escolhe PIX ou cartão

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ checkoutUrl: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Buscar email do usuário autenticado
    const { data: { user: authUser } } = await context.supabase.auth.getUser();
    const email = authUser?.email ?? "";
    if (!email) throw new Error("Email do usuário não encontrado");

    // 2. Buscar perfil para nome e telefone
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("id", context.userId)
      .maybeSingle();

    const name = profile?.display_name ?? "Cliente";
    const mobilePhone = profile?.phone ?? undefined;

    // 3. Buscar ou criar customer no Asaas
    let asaasCustomerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from("asaas_customers")
      .select("asaas_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existingCustomer) {
      asaasCustomerId = existingCustomer.asaas_customer_id;
    } else {
      // Tenta achar por email antes de criar (evita duplicatas)
      const byEmail = await findAsaasCustomerByEmail(email);
      if (byEmail) {
        asaasCustomerId = byEmail.id;
      } else {
        const newCustomer = await createAsaasCustomer({ name, email, mobilePhone });
        asaasCustomerId = newCustomer.id;
      }
      // Salva no banco
      await supabaseAdmin.from("asaas_customers").upsert({
        user_id:           context.userId,
        asaas_customer_id: asaasCustomerId,
      });
    }

    // 4. Verificar se já tem subscription ativa no Asaas
    const { data: localSub } = await supabaseAdmin
      .from("subscriptions")
      .select("asaas_subscription_id, status")
      .eq("user_id", context.userId)
      .maybeSingle();

    let asaasSubId = localSub?.asaas_subscription_id ?? null;

    if (asaasSubId) {
      // Valida se ainda existe e está ativa no Asaas
      try {
        const remote = await getAsaasSubscription(asaasSubId);
        if (remote.status !== "ACTIVE") asaasSubId = null;
      } catch {
        asaasSubId = null;
      }
    }

    if (!asaasSubId) {
      // Cria nova assinatura
      const today = new Date().toISOString().split("T")[0];
      const newSub = await createAsaasSubscription({
        customerId:  asaasCustomerId,
        value:       49.90,
        billingType: "UNDEFINED",  // usuário escolhe PIX ou cartão no checkout
        nextDueDate: today,
        description: "suaAgendaPro Premium",
      });
      asaasSubId = newSub.id;

      // Salva o ID da subscription Asaas no banco local
      await supabaseAdmin
        .from("subscriptions")
        .update({
          asaas_subscription_id: asaasSubId,
          asaas_customer_id:     asaasCustomerId,
        })
        .eq("user_id", context.userId);
    }

    // 5. Buscar link do pagamento pendente
    const payment = await getFirstPendingPayment(asaasSubId);
    if (!payment?.invoiceUrl) {
      throw new Error("Não foi possível gerar o link de pagamento. Tente novamente.");
    }

    return { checkoutUrl: payment.invoiceUrl };
  });

// ─── Cancela assinatura ───────────────────────────────────────────────────────

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<void> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("asaas_subscription_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (sub?.asaas_subscription_id) {
      try {
        await cancelAsaasSubscription(sub.asaas_subscription_id);
      } catch (e) {
        console.warn("[asaas] cancel error (ignorado):", e);
      }
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", context.userId);
  });

// ─── Retorna info da assinatura atual (para UI) ───────────────────────────────

export const getMySubscriptionInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select("status, plan_id, trial_ends_at, current_period_end, plans(display_name, price_cents)")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data) return null;

    const endsAt = data.trial_ends_at ?? data.current_period_end;
    const diff = endsAt ? new Date(endsAt).getTime() - Date.now() : null;

    return {
      status:           data.status,
      planId:           data.plan_id,
      planName:         (data.plans as any)?.display_name ?? data.plan_id,
      priceCents:       (data.plans as any)?.price_cents ?? 0,
      trialEndsAt:      data.trial_ends_at,
      currentPeriodEnd: data.current_period_end,
      daysRemaining:    diff !== null ? Math.max(0, Math.ceil(diff / 86_400_000)) : null,
    };
  });
