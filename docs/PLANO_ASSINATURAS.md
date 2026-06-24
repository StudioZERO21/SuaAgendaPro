# Plano de Assinaturas — suaAgendaPro

## Visão Geral

Sistema de assinaturas com cobrança automática via Asaas (PIX + cartão).
Profissionais que não estiverem em dia são bloqueados automaticamente.

---

## Três Partes Distintas do Sistema

```
suaagendapro.com          → Site (responsivo, qualquer dispositivo)
app.suaagendapro.com      → App (mobile-only após produção)
admin.suaagendapro.com    → Dashboard super admin (desktop/tablet)
```

### 1. Site Público
- Rotas: `/`, `/precos`, `/recursos`, `/contato`, `/login`, `/cadastro`, `/agendar/*`
- Totalmente responsivo (mobile, tablet, desktop)
- SEO-friendly, público

### 2. App (Mobile-Only)
- Rotas: `/dashboard`, `/agenda`, `/clientes`, `/servicos`, `/pagamentos`, `/personalizacao`, etc.
- **Durante testes:** acesso aberto normalmente
- **Em produção:** Nginx redireciona desktop → página "use no celular"
- Detectado via User-Agent no Nginx

### 3. Super Admin Dashboard
- Rotas: `/super/*`
- Desktop/tablet preferencial
- **Máxima segurança:**
  - IP whitelist no Nginx
  - Rate limiting agressivo
  - Headers de segurança reforçados
  - Audit log de todas as ações
  - Session timeout curto

---

## Planos

| ID | Nome Exibido | Preço | Status | Notas |
|----|---|---|---|---|
| `trial` | Acesso Livre | Grátis / 7 dias | Ativo | Mesmas funções do Premium |
| `premium` | Premium | R$ 49,90/mês | Ativo | PIX ou cartão |
| `premium_ia` | Premium IA | R$ 79,90/mês | **Inativo** | Fase 2 — não lançar agora |
| `especial` | Especial | Grátis / sem expiração | Ativo | Por convite, colaboradores |

---

## Fluxo de Status da Assinatura

```
Cadastro ──► trial (7 dias) ──► [paga] ──► active
                    │                          │
                    │ [não paga]               │ [vence / não renova]
                    ▼                          ▼
               suspended ◄─────────────── overdue
                    │
                    │ [paga pendência]
                    ▼
                  active
                    │
                    │ [cancela]
                    ▼
                cancelled

especial ──► nunca expira / nunca cobra
```

---

## Notificações de Cobrança

| Quando | Canal | Mensagem |
|---|---|---|
| 3 dias antes do fim do trial | Email | "Seu Acesso Livre termina em 3 dias" |
| 1 dia antes do fim do trial | WhatsApp | "Último dia! Garanta seu acesso" |
| Trial expirou (bloqueio) | WhatsApp | "Acesso encerrado — como reativar" |
| 3 dias antes do vencimento | Email | "Sua fatura vence em 3 dias" |
| 1 dia antes do vencimento | WhatsApp | "Fatura vence amanhã — pague via PIX" |
| Pagamento atrasado / bloqueio | WhatsApp | "Acesso suspenso — regularize" |
| Pagamento confirmado | Automático | Desbloqueia sem intervenção humana |

---

## Comportamento de Bloqueio

Quando `status = suspended | cancelled` ou `trial expirado`:
- Usuário **consegue fazer login**
- Imediatamente redirecionado para `/plano`
- `/plano` mostra: status atual, planos disponíveis, botão de pagamento
- **Nenhuma outra rota é acessível**

---

## Infraestrutura VPS / Docker

```
VPS
└── Docker
    ├── nginx (reverse proxy + SSL + segurança)
    │   ├── suaagendapro.com → app container (site)
    │   ├── app.suaagendapro.com → app container (mobile check)
    │   └── admin.suaagendapro.com → app container (IP whitelist)
    └── app (Node.js TanStack Start)
```

### Nginx — Segurança
- HTTPS obrigatório (Let's Encrypt)
- HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- Rate limiting: 10 req/s global, 2 req/s no `/super/*`
- IP whitelist para `/super/*`
- User-Agent redirect para `/dashboard/*` (após produção)

---

## Métodos de Pagamento (Asaas)

- PIX (preferencial)
- Cartão de crédito
- ~~Boleto~~ (não aceitar)

---

## Arquivos por Etapa

```
ETAPA 1 — Banco de Dados
  supabase/migrations/20260623000001_etapa12_plans.sql
  supabase/migrations/20260623000002_etapa12_subscriptions.sql
  supabase/migrations/20260623000003_etapa12_asaas_customers.sql
  supabase/migrations/20260623000004_etapa12_billing_events.sql
  supabase/migrations/20260623000005_etapa12_seed_plans.sql
  supabase/migrations/20260623000006_etapa12_trial_trigger.sql

ETAPA 2 — Middleware de Acesso
  src/lib/subscription-guard.ts
  (modificar) src/routes/__root.tsx

ETAPA 3 — Página de Bloqueio
  src/routes/plano.tsx

ETAPA 4 — Asaas Service
  src/lib/asaas.service.ts
  src/lib/asaas-subscription.functions.ts

ETAPA 5 — Webhook Asaas
  src/routes/api/webhooks/asaas.ts

ETAPA 6 — Notificações / Cron
  src/lib/subscription-notifications.ts
  supabase/functions/subscription-cron/index.ts

ETAPA 7 — Super Admin Real
  (modificar) src/routes/super/_app/index.tsx
  (modificar) src/routes/super/_app/planos.tsx
  (modificar) src/routes/super/_app/usuarios.tsx
  src/lib/super-admin.functions.ts

ETAPA 8 — Onboarding
  (modificar) src/routes/cadastro.tsx

ETAPA 9 — Docker / VPS
  Dockerfile
  docker-compose.yml
  nginx/nginx.conf
  nginx/sites/suaagendapro.conf
  .env.production.example

ETAPA 10 — Três Partes Distintas
  nginx/sites/suaagendapro.conf (mobile redirect)
  nginx/sites/admin.conf (IP whitelist)
  src/lib/device-guard.ts
```

---

## Checklist de Implementação

### ETAPA 1 — Banco de Dados
- [ ] Tabela `plans` criada e populada com 4 planos
- [ ] Tabela `subscriptions` com status, datas, foreign keys
- [ ] Tabela `asaas_customers` (user_id ↔ asaas_customer_id)
- [ ] Tabela `billing_events` (log de webhooks)
- [ ] Trigger: criar `subscription` trial ao criar novo usuário
- [ ] RLS em todas as tabelas

### ETAPA 2 — Middleware de Acesso
- [ ] `subscription-guard.ts`: verifica status da assinatura
- [ ] Integrado no `__root.tsx`: redireciona para `/plano` se bloqueado
- [ ] Rotas públicas e `/plano` excluídas do guard

### ETAPA 3 — Página `/plano`
- [ ] Layout: status do trial/inadimplência
- [ ] Cards com planos disponíveis (Premium / Especial)
- [ ] Botão "Assinar" → gera link Asaas
- [ ] Premium IA exibido como "Em breve" (desabilitado)

### ETAPA 4 — Asaas Service
- [ ] `asaas.service.ts`: cliente HTTP (sandbox + produção)
- [ ] `createCustomer()`: cria cliente no Asaas
- [ ] `createSubscription()`: cria assinatura (PIX + cartão)
- [ ] `getPaymentLink()`: gera link de checkout
- [ ] `cancelSubscription()`
- [ ] Variáveis de ambiente: `ASAAS_API_KEY`, `ASAAS_ENV`

### ETAPA 5 — Webhook Asaas
- [ ] Rota `POST /api/webhooks/asaas`
- [ ] Validação HMAC da assinatura do webhook
- [ ] `PAYMENT_CONFIRMED` → `status: active`
- [ ] `PAYMENT_OVERDUE` → `status: suspended`
- [ ] `SUBSCRIPTION_CANCELLED` → `status: cancelled`
- [ ] Inserir em `billing_events` (log)
- [ ] Notificação WhatsApp ao desbloquear

### ETAPA 6 — Notificações / Cron
- [ ] Edge Function `subscription-cron` no Supabase (roda 1x/dia)
- [ ] Identificar trials expirando em 3 dias → Email
- [ ] Identificar trials expirando em 1 dia → WhatsApp
- [ ] Suspender trials expirados → WhatsApp de bloqueio
- [ ] Identificar vencimentos em 3 dias → Email
- [ ] Identificar vencimentos em 1 dia → WhatsApp
- [ ] pg_cron schedule no Supabase

### ETAPA 7 — Super Admin Real
- [ ] Métricas reais: MRR, ativos, trials, suspensos, churn
- [ ] Lista de usuários com plano, status, próximo vencimento
- [ ] Ação: mudar plano manualmente
- [ ] Ação: desbloquear usuário (reset status para active)
- [ ] Ação: conceder plano Especial
- [ ] Ação: cancelar assinatura
- [ ] Histórico de billing_events por usuário

### ETAPA 8 — Onboarding
- [ ] Ao criar conta: insert em `subscriptions` (status: trial)
- [ ] Criar customer no Asaas no momento do cadastro
- [ ] Tela de boas-vindas mostrando dias restantes do trial

### ETAPA 9 — Docker / VPS
- [ ] `Dockerfile` multi-stage (build + runtime)
- [ ] `docker-compose.yml` (app + nginx)
- [ ] Nginx com SSL Let's Encrypt (certbot)
- [ ] Security headers em todas as respostas
- [ ] Rate limiting configurado
- [ ] `.env.production.example` documentado
- [ ] Health check endpoint

### ETAPA 10 — Três Partes (Mobile/Desktop/Admin)
- [ ] Nginx: redirecionar desktop de `app.*` → página "use no celular" (pós-produção)
- [ ] Nginx: IP whitelist para `admin.*`
- [ ] Super admin: bloqueio por User-Agent em desktop
- [ ] Site público: responsivo em todas as rotas de marketing
- [ ] `device-guard.ts`: hook para detecção client-side

---

## Variáveis de Ambiente Necessárias

```env
# Asaas
ASAAS_API_KEY=          # chave da API Asaas
ASAAS_ENV=sandbox       # sandbox | production
ASAAS_WEBHOOK_TOKEN=    # token para validar webhooks

# Já existentes
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MP_CLIENT_ID=
MP_CLIENT_SECRET=
```
