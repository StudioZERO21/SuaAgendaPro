// ETAPA 2 — Middleware de acesso por assinatura
// Verifica se o usuário tem assinatura ativa.
// Status bloqueantes: 'suspended' | 'cancelled' | trial expirado

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "overdue"
  | "suspended"
  | "cancelled"
  | "especial";

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  planId: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
};

export function isBlocked(info: SubscriptionInfo | null): boolean {
  // TODO: implementar na Etapa 2
  return false;
}

export function getDaysRemaining(endsAt: string | null): number | null {
  // TODO: implementar na Etapa 2
  return null;
}

// TODO (Etapa 2):
// - createServerFn getMySubscription()
// - lógica de bloqueio no __root.tsx
// - redirect para /plano se isBlocked()
