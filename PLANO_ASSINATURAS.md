# Plano de Implementação — Sistema de Assinaturas (Asaas)

## Arquitetura geral

```
suaAgendaPro/
├── App          → celular (mobile-only, restrição após produção)
├── Dashboard    → /super/* — desktop/tablet — máxima segurança
└── Site         → / /precos /recursos — totalmente responsivo
```

Infraestrutura: **Docker container na VPS** + Nginx reverse proxy + SSL

---

## Planos

| ID           | Nome        | Preço        | Status         |
|-------------|-------------|--------------|----------------|
| `trial`      | Acesso Livre | Grátis 7d   | Ativo (interno)|
| `premium`    | Premium      | R$ 49,90/mês | Ativo          |
| `premium_ia` | Premium IA   | R$ 79,90/mês | INATIVO (fase 2)|
| `especial`   | Especial     | Grátis       | Por convite     |

Pagamento: **PIX + Cartão de crédito** via Asaas (sem boleto)

---

## Fluxo de status da assinatura

```
Cadastro → trial (7 dias)
         ↓ trial expirou sem pagar  → suspended (bloqueado)
         ↓ pagou dentro do trial    → active
active   → pagamento confirmado     → active (renova período)
         → pagamento vencido        → overdue (+3 dias grace)
         → grace expirou            → suspended
suspended → pagou                  → active
          → cancelou               → cancelled
especial  → nunca expira, nunca cobra
```

---

## Notificações

| Evento                       | Canal     |
|------------------------------|-----------|
| 3 dias antes do vencimento   | Email     |
| 1 dia antes do vencimento    | WhatsApp  |
| Assinatura bloqueada         | WhatsApp  |
| Trial expirando (1 dia)      | WhatsApp  |
| Pagamento confirmado         | Email     |

---

## Checklist de implementação

### ✅ Etapa 1 — Banco de dados (CONCLUÍDO)
- [x] `supabase/migrations/20260623000001_etapa12_plans.sql` — tabela `plans` + RLS
- [x] `supabase/migrations/20260623000002_etapa12_subscriptions.sql` — tabela `subscriptions` + trigger
- [x] `supabase/migrations/20260623000003_etapa12_asaas_customers.sql` — tabela `asaas_customers`
- [x] `supabase/migrations/20260623000004_etapa12_billing_events.sql` — tabela `billing_events` (log webhooks)
- [x] `supabase/migrations/20260623000005_etapa12_plans_seed.sql` — seed dos 4 planos
- [x] Migração aplicada no Supabase remoto ✓
- [x] Tipos TypeScript gerados/atualizados

---

### ⬜ Etapa 2 — Middleware de acesso (proteção de rotas)
**Objetivo:** Bloquear rotas protegidas para usuários sem assinatura ativa

Arquivos a criar/editar:
- [ ] `src/lib/subscription.ts` — função `getSubscriptionStatus(userId)` via supabaseAdmin
- [ ] `src/lib/subscription-guard.ts` — hook `useSubscription()` + componente `<SubscriptionGuard>`
- [ ] `src/routes/plano.tsx` — página de bloqueio/upgrade (rota pública)
- [ ] Editar `src/routes/__root.tsx` — integrar guard no AuthGuard existente

Regras:
- `trial` (dentro do prazo) → acesso total
- `active` → acesso total
- `especial` → acesso total
- `overdue` → acesso total por mais 3 dias (grace period)
- `suspended` / `cancelled` / trial expirado → redirecionar para `/plano`

---

### ⬜ Etapa 3 — Página `/plano` (upgrade/bloqueio)
**Objetivo:** Tela que o usuário vê quando está bloqueado, com opção de assinar

Arquivos a criar:
- [ ] `src/routes/plano.tsx` — layout explicando status + botões de pagamento
- [ ] `src/components/subscription/PlanCard.tsx` — card do plano Premium
- [ ] `src/components/subscription/PaymentOptions.tsx` — PIX ou cartão (link Asaas)

---

### ⬜ Etapa 4 — Serviço Asaas
**Objetivo:** Criar cliente Asaas, criar assinatura, gerar link de pagamento

Arquivos a criar:
- [ ] `src/lib/asaas/client.ts` — wrapper da API Asaas (fetch com ASAAS_API_KEY)
- [ ] `src/lib/asaas/customers.ts` — `createOrGetCustomer(user)`
- [ ] `src/lib/asaas/subscriptions.ts` — `createSubscription(customerId, planId)`
- [ ] `src/lib/asaas/payments.ts` — `getPaymentLink(subscriptionId)`
- [ ] `src/server/fns/asaas-checkout.ts` — server fn: inicia checkout, retorna link

Variáveis de ambiente necessárias:
```
ASAAS_API_KEY=        # chave da API Asaas (sandbox/prod)
ASAAS_WEBHOOK_TOKEN=  # token para validar webhooks
ASAAS_ENV=sandbox     # 'sandbox' | 'production'
```

---

### ⬜ Etapa 5 — Webhook Asaas (`POST /api/webhooks/asaas`)
**Objetivo:** Receber eventos de pagamento e atualizar status das assinaturas

Arquivos a criar:
- [ ] `src/routes/api/webhooks/asaas.ts` — handler POST (verifica token, idempotência)
- [ ] `src/lib/asaas/webhook-handler.ts` — lógica por tipo de evento:
  - `PAYMENT_CONFIRMED` → status = `active`, atualiza `current_period_end`
  - `PAYMENT_OVERDUE` → status = `overdue`, define `grace_period_ends_at`
  - `PAYMENT_DELETED` / `SUBSCRIPTION_DELETED` → status = `cancelled`
  - Registra tudo em `billing_events`

---

### ⬜ Etapa 6 — Cron de notificações e bloqueio automático
**Objetivo:** Jobs agendados para notificar e bloquear automaticamente

Arquivos a criar:
- [ ] `src/routes/api/cron/billing.ts` — endpoint chamado por cron (token protegido)
- [ ] `src/lib/cron/trial-expiry.ts` — verifica trials que vencem em 1 dia → WhatsApp
- [ ] `src/lib/cron/payment-reminder.ts` — vence em 3 dias → Email; 1 dia → WhatsApp
- [ ] `src/lib/cron/auto-suspend.ts` — grace expirou → status = `suspended`

Infra (VPS/Docker):
- Cron no container: `0 8 * * * curl -H "X-Cron-Token: ..." http://localhost:3000/api/cron/billing`

---

### ⬜ Etapa 7 — Super Admin com dados reais
**Objetivo:** Dashboard `/super/*` exibindo métricas reais do banco

Arquivos a editar:
- [ ] `src/routes/super/_app/index.tsx` — substituir mock por server fn real
- [ ] `src/routes/super/_app/planos.tsx` — substituir mock por dados reais
- [ ] `src/routes/super/_app/usuarios.tsx` — lista real de usuários + ações admin
- [ ] `src/server/fns/super-metrics.ts` — queries agregadas (MRR, churn, trial count, etc.)
- [ ] `src/server/fns/super-users.ts` — listagem paginada + ações (bloquear, conceder especial)

Segurança adicional:
- [ ] Middleware verificando `super_admin` role na tabela `profiles`
- [ ] Audit log de ações admin em `billing_events` (event_type = 'ADMIN_ACTION')

---

### ⬜ Etapa 8 — Onboarding automático (trial ao cadastrar)
**Objetivo:** Criar assinatura trial automaticamente no cadastro do usuário

Arquivos a criar/editar:
- [ ] Supabase Function (edge function) ou database trigger — cria row em `subscriptions`
  ao inserir em `auth.users`
- [ ] `src/routes/cadastro.tsx` — após cadastro, redirecionar para onboarding (já existe)

Arquivo a criar:
- [ ] `supabase/functions/on-user-created/index.ts` — edge function trigger

---

## Segurança do Dashboard (`/super/*`)

### Implementar (fase VPS/Docker):
- Nginx: `allow` apenas IPs específicos para `/super/*`
- Rate limiting: máx 10 req/s por IP nessa rota
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- Session timeout: 2h (vs 24h no app)

### Já implementado:
- `noindex,nofollow` em todas as rotas `/super/*`
- Rota de login separada em `/super/login`
- Classe CSS `super-scope` aplicada no `<html>` para isolar estilos

---

## Variáveis de ambiente pendentes

```bash
# Asaas
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_ENV=sandbox

# Notificações
WHATSAPP_API_URL=      # Evolution API ou similar
WHATSAPP_API_KEY=
EMAIL_FROM=            # Resend ou SMTP
RESEND_API_KEY=

# Segurança cron
CRON_SECRET=           # token para autenticar chamadas de cron
```

---

## Ordem de execução sugerida

```
1 (DB) → 8 (Onboarding) → 2 (Middleware) → 3 (Página /plano)
→ 4 (Asaas) → 5 (Webhook) → 6 (Cron) → 7 (Super Admin real)
```

Razão: usuários que se cadastrarem já terão trial; o middleware bloqueia
antes da integração Asaas estar completa; o super admin real fica por último
pois depende de todas as outras tabelas terem dados.
