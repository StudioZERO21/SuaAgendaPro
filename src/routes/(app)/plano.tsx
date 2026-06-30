import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, Zap, Crown, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type SubscriptionInfo, getBlockReason, getDaysRemaining } from "@/lib/subscription-guard";
import { createCheckoutSession } from "@/lib/asaas-subscription.functions";

export const Route = createFileRoute("/(app)/plano")({
  head: () => ({
    meta: [{ title: "Escolha seu plano — suaAgendaPro" }],
  }),
  component: PlanoPage,
});

const PLAN_FEATURES = [
  "Agenda ilimitada",
  "Clientes ilimitados",
  "Agendamento online público",
  "Pagamentos PIX",
  "Notificações WhatsApp",
  "Portfólio profissional",
  "Relatórios avançados",
  "Personalização completa",
  "Suporte prioritário",
];

function BlockReasonBanner({ reason, daysLeft }: { reason: string; daysLeft: number | null }) {
  if (reason === "trial_expired") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Seu período de Acesso Livre encerrou
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Assine o plano Premium para continuar usando o suaAgendaPro.
        </p>
      </div>
    );
  }
  if (reason === "payment_overdue") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center dark:border-red-800 dark:bg-red-950/40">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
          Seu acesso foi suspenso por inadimplência
        </p>
        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
          Regularize o pagamento para reativar sua conta.
        </p>
      </div>
    );
  }
  if (reason === "cancelled") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">
          Sua assinatura foi cancelada
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Assine novamente para continuar usando o suaAgendaPro.
        </p>
      </div>
    );
  }
  // Trial ativo com dias restantes (acesso à página voluntário)
  if (daysLeft !== null && daysLeft > 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Você está no Acesso Livre — {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
        </p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          Assine agora e não perca nenhum agendamento.
        </p>
      </div>
    );
  }
  return null;
}

function PlanoPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("status, plan_id, trial_ends_at, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const endsAt = data.trial_ends_at ?? data.current_period_end;
        const diff = endsAt ? new Date(endsAt).getTime() - Date.now() : null;
        setSubscription({
          status: data.status as SubscriptionInfo["status"],
          planId: data.plan_id,
          trialEndsAt: data.trial_ends_at,
          currentPeriodEnd: data.current_period_end,
          daysRemaining: diff !== null ? Math.max(0, Math.ceil(diff / 86_400_000)) : null,
        });
      }
      setLoading(false);
    });
  }, [navigate]);

  const reason = getBlockReason(subscription);
  const daysLeft = getDaysRemaining(subscription?.trialEndsAt ?? subscription?.currentPeriodEnd);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleSubscribe() {
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckoutSession();
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error("Erro ao gerar link de pagamento. Tente novamente.");
      console.error(err);
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Logo / header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            suaAgendaPro
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Escolha seu plano
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tudo que você precisa para sua agenda profissional.
          </p>
        </div>

        {/* Banner de bloqueio */}
        {!loading && (
          <BlockReasonBanner reason={reason} daysLeft={daysLeft} />
        )}

        {/* Card Premium */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary bg-card p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Recomendado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plano</p>
              <p className="text-lg font-bold text-foreground">Premium</p>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-4xl font-bold text-foreground">R$ 49</span>
            <span className="text-lg font-semibold text-foreground">,90</span>
            <span className="ml-1 text-sm text-muted-foreground">/mês</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <button
            className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            onClick={handleSubscribe}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-1.5 inline h-4 w-4" />
            )}
            {checkoutLoading ? "Aguarde..." : "Assinar Premium — R$ 49,90/mês"}
          </button>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            PIX ou cartão de crédito · Cancele quando quiser
          </p>
        </div>

        {/* Card Premium IA — em breve */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/50 p-6 opacity-60">
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow">
              <Lock className="h-3.5 w-3.5" />
              Em breve
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plano</p>
              <p className="text-lg font-bold text-foreground">Premium IA</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold text-foreground">R$ 79</span>
            <span className="text-lg font-semibold text-foreground">,90</span>
            <span className="ml-1 text-sm text-muted-foreground">/mês</span>
          </div>
        </div>

        {/* Suporte */}
        <p className="text-center text-xs text-muted-foreground">
          Dúvidas?{" "}
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            Fale com o suporte via WhatsApp
          </a>
        </p>

      </div>
    </div>
  );
}
