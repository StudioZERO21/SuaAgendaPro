// ETAPA 7 — Server functions do Super Admin
// Métricas reais e ações de gestão de assinaturas

import { createServerFn } from "@tanstack/react-start";

// TODO (Etapa 7): adicionar middleware de autenticação super admin

export const getSuperAdminMetrics = createServerFn({ method: "GET" }).handler(
  async () => {
    // TODO: implementar queries reais
    // - MRR: SUM(price_cents) WHERE status = 'active'
    // - Ativos: COUNT WHERE status = 'active'
    // - Trial: COUNT WHERE status = 'trial'
    // - Suspensos: COUNT WHERE status = 'suspended'
    // - Churn do mês: COUNT WHERE cancelled_at > início do mês
    throw new Error("Etapa 7 — não implementado");
  },
);

export const getSuperAdminUsers = createServerFn({ method: "GET" }).handler(
  async () => {
    // TODO: JOIN subscriptions + profiles + plans
    // Retornar: id, name, email, plan, status, trial_ends_at, current_period_end
    throw new Error("Etapa 7 — não implementado");
  },
);

export const adminChangePlan = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string; planId: string; notes?: string } }) => {
    // TODO: UPDATE subscriptions SET plan_id, notes
    throw new Error("Etapa 7 — não implementado");
  },
);

export const adminUnblockUser = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string; notes?: string } }) => {
    // TODO: UPDATE subscriptions SET status='active', notes
    throw new Error("Etapa 7 — não implementado");
  },
);

export const adminGrantSpecial = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string; notes?: string } }) => {
    // TODO: UPDATE subscriptions SET plan_id='especial', status='especial', notes
    throw new Error("Etapa 7 — não implementado");
  },
);

export const adminCancelSubscription = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string } }) => {
    // TODO: cancelar no Asaas + UPDATE subscriptions SET status='cancelled'
    throw new Error("Etapa 7 — não implementado");
  },
);
