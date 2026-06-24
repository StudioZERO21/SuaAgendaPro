// ETAPA 3 — Página de bloqueio / upgrade de plano
// Exibida quando status = suspended | cancelled | trial expirado
// TODO: implementar na Etapa 3

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plano")({
  head: () => ({
    meta: [{ title: "Escolha seu plano — suaAgendaPro" }],
  }),
  component: PlanoPage,
});

function PlanoPage() {
  // TODO (Etapa 3):
  // - Buscar subscription do usuário (status, trial_ends_at, etc.)
  // - Exibir motivo do bloqueio (trial expirado / inadimplente)
  // - Cards de planos (Premium / Especial por convite)
  // - Premium IA: card desabilitado "Em breve"
  // - Botão "Assinar Premium" → chama Asaas → redireciona para checkout
  // - Mensagem de suporte / WhatsApp

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-lg w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Escolha seu plano
        </h1>
        <p className="text-muted-foreground text-sm">
          Para continuar usando o suaAgendaPro, escolha um plano abaixo.
        </p>
        {/* TODO: cards de planos */}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground text-xs">
            Etapa 3 — em implementação
          </p>
        </div>
      </div>
    </div>
  );
}
