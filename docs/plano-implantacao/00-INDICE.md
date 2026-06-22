# PLANO DE IMPLANTAÇÃO — SuaAgenda.Pro
**Versão:** 1.0 | **Criado:** 2026-06-21 | **Status:** Em planejamento

---

## Situação Atual

| Item | Status |
|------|--------|
| UI / Design System | ✅ Completo (28 páginas mockadas) |
| Componentes (Radix UI) | ✅ Completo (25+ componentes) |
| TanStack Start + Vite | ✅ Rodando na porta 3000 |
| Supabase Local (Docker) | ✅ Rodando na porta 54321 |
| Banco de Dados (schema) | 🔴 Incompleto (só pagamentos) |
| Autenticação | 🔴 Mockada (sem guard de rotas) |
| Lógica de negócio | 🔴 Tudo com dados fictícios |
| Integrações externas | 🔴 Não implementadas |
| Deploy produção | 🔴 Não configurado |

---

## Mapa de Etapas

```
ETAPA 01 ──► ETAPA 02 ──► ETAPA 03 ──► ETAPA 04
(Banco DB)   (Auth)       (Serviços)   (Agenda)
    │                         │             │
    └──────────────────────── ▼ ────────────┘
                         ETAPA 05
                      (Booking Público)
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          ETAPA 06       ETAPA 07       ETAPA 08
        (Pagamentos)    (WhatsApp)   (Google Cal)
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                         ETAPA 09
                        (Dashboard)
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                ETAPA 10         ETAPA 11
               (PWA/Push)     (Personalização)
                    │                 │
                    └────────┬────────┘
                             ▼
                         ETAPA 12
                      (Deploy/CI/CD)
```

---

## Checklist Geral

### ETAPA 01 — Fundação do Banco de Dados
**Arquivo:** [etapa-01-banco-dados.md](etapa-01-banco-dados.md)
**Estimativa:** 2–3 dias | **Prioridade:** CRÍTICA

- [ ] Tabela `profiles` com RLS
- [ ] Tabela `services` com RLS
- [ ] Tabela `working_hours` com RLS
- [ ] Tabela `blocked_dates` com RLS
- [ ] Tabela `clients` com RLS
- [ ] Tabela `appointments` com RLS
- [ ] Tabela `notifications` com RLS
- [ ] Tabela `portfolio_items` com RLS
- [ ] Triggers `updated_at` em todas as tabelas
- [ ] Trigger auto-criação de profile após signup
- [ ] Função `get_available_slots()`
- [ ] Índices de performance criados
- [ ] Seed de dados para desenvolvimento
- [ ] Types TypeScript gerados via `supabase gen types`

**Conclusão:** 🟢 Concluído em 2026-06-21

---

### ETAPA 02 — Autenticação e Onboarding
**Arquivo:** [etapa-02-autenticacao.md](etapa-02-autenticacao.md)
**Estimativa:** 2–3 dias | **Prioridade:** CRÍTICA

- [x] Hook `useAuth()` implementado
- [x] Auth guards em rotas protegidas (AuthGuard global em __root.tsx)
- [x] Login conectado ao Supabase Auth
- [x] Cadastro conectado ao Supabase Auth (validação Zod)
- [x] Onboarding (3 passos) salvando no banco
- [x] Reset de senha funcional (/reset-password)
- [x] Redirecionar após login/cadastro

**Conclusão:** 🟢 Concluído em 2026-06-21

---

### ETAPA 03 — Serviços e Horários
**Arquivo:** [etapa-03-servicos-horarios.md](etapa-03-servicos-horarios.md)
**Estimativa:** 2 dias | **Prioridade:** Alta

- [ ] CRUD de serviços com dados reais
- [ ] Form de serviço com validação Zod
- [ ] Horários de funcionamento por dia da semana
- [ ] Dias e datas bloqueadas
- [ ] Hook `useServicos()` com React Query

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 04 — Agenda e Agendamentos
**Arquivo:** [etapa-04-agenda-agendamentos.md](etapa-04-agenda-agendamentos.md)
**Estimativa:** 4–5 dias | **Prioridade:** CRÍTICA

- [ ] Agenda substituindo dados mock por dados reais
- [ ] Sheet de novo agendamento (4 etapas)
- [ ] Cálculo de disponibilidade de horários
- [ ] Ações: confirmar, concluir, cancelar
- [ ] CRM de clientes (CRUD)
- [ ] Real-time via Supabase subscriptions
- [ ] Visualização em Grade (calendar view)

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 05 — Booking Público
**Arquivo:** [etapa-05-booking-publico.md](etapa-05-booking-publico.md)
**Estimativa:** 3 dias | **Prioridade:** Alta

- [ ] Perfil público por slug (`/perfil-publico`)
- [ ] Fluxo de agendamento público 6 passos (`/agendar/:slug`)
- [ ] API pública de disponibilidade de horários
- [ ] API pública de criação de agendamento
- [ ] SEO / meta tags dinâmicas
- [ ] SSR funcionando para crawlers

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 06 — Pagamentos
**Arquivo:** [etapa-06-pagamentos.md](etapa-06-pagamentos.md)
**Estimativa:** 4 dias | **Prioridade:** Alta

- [ ] Mercado Pago OAuth conectado
- [ ] PIX configurado e QR Code gerado
- [ ] Checkout Mercado Pago integrado
- [ ] Webhook de confirmação de pagamento
- [ ] Histórico de transações real
- [ ] Confirmação manual de PIX

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 07 — WhatsApp
**Arquivo:** [etapa-07-whatsapp.md](etapa-07-whatsapp.md)
**Estimativa:** 2–3 dias | **Prioridade:** Alta

- [ ] Conexão Evolution Go configurada
- [ ] Mensagem automática ao criar agendamento
- [ ] Lembrete 24h antes (cron)
- [ ] Mensagem ao cancelar
- [ ] Templates personalizáveis pelo profissional

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 08 — Google Calendar
**Arquivo:** [etapa-08-google-calendar.md](etapa-08-google-calendar.md)
**Estimativa:** 2 dias | **Prioridade:** Média

- [ ] OAuth2 Google conectado
- [ ] Agendamentos criados no Google Calendar
- [ ] Cancelamentos removidos do Google Calendar
- [ ] Bloqueio de compromissos externos no app

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 09 — Dashboard e Analytics
**Arquivo:** [etapa-09-dashboard-analytics.md](etapa-09-dashboard-analytics.md)
**Estimativa:** 2 dias | **Prioridade:** Média

- [ ] KPIs com dados reais (faturamento, agendamentos, clientes)
- [ ] Gráfico de faturamento (Recharts)
- [ ] Agendamentos do dia em tempo real
- [ ] Serviços mais populares

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 10 — PWA e Notificações Push
**Arquivo:** [etapa-10-pwa-notificacoes.md](etapa-10-pwa-notificacoes.md)
**Estimativa:** 2 dias | **Prioridade:** Média

- [ ] Service Worker com cache offline
- [ ] Manifest.json completo e validado
- [ ] App instalável no celular
- [ ] Notificações push para novo agendamento
- [ ] Centro de notificações com dados reais

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 11 — Personalização e Portfólio
**Arquivo:** [etapa-11-personalizacao.md](etapa-11-personalizacao.md)
**Estimativa:** 2 dias | **Prioridade:** Baixa-Média

- [ ] Upload de avatar e capa (Supabase Storage)
- [ ] Galeria de trabalhos (CRUD com drag & drop)
- [ ] Personalização de cores do perfil público
- [ ] Configurações de visibilidade do perfil

**Conclusão:** ⬜ Não iniciado

---

### ETAPA 12 — Deploy e CI/CD
**Arquivo:** [etapa-12-deploy.md](etapa-12-deploy.md)
**Estimativa:** 3–4 dias | **Prioridade:** Alta (produção)

- [ ] Supabase Cloud configurado e migrations aplicadas
- [ ] Dockerfile de produção otimizado
- [ ] VPS configurada com Nginx + SSL
- [ ] Domínio apontado e HTTPS ativo
- [ ] GitHub Actions deploy automático
- [ ] Monitoramento com UptimeRobot
- [ ] Backups automáticos

**Conclusão:** ⬜ Não iniciado

---

## Estimativa Total

| Etapa | Estimativa | Prioridade |
|-------|-----------|------------|
| 01 — Banco de Dados | 2–3 dias | 🔴 CRÍTICA |
| 02 — Autenticação | 2–3 dias | 🔴 CRÍTICA |
| 03 — Serviços e Horários | 2 dias | 🟠 Alta |
| 04 — Agenda e Agendamentos | 4–5 dias | 🔴 CRÍTICA |
| 05 — Booking Público | 3 dias | 🟠 Alta |
| 06 — Pagamentos | 4 dias | 🟠 Alta |
| 07 — WhatsApp | 2–3 dias | 🟠 Alta |
| 08 — Google Calendar | 2 dias | 🟡 Média |
| 09 — Dashboard Analytics | 2 dias | 🟡 Média |
| 10 — PWA e Push | 2 dias | 🟡 Média |
| 11 — Personalização | 2 dias | 🟡 Média |
| 12 — Deploy e CI/CD | 3–4 dias | 🟠 Alta |
| **TOTAL** | **~30–35 dias úteis** | |

---

## MVP Mínimo (Etapas 1–5)

Para ter um produto funcional que um profissional pode usar:

```
Etapa 01 + 02 + 03 + 04 + 05 = ~13–14 dias úteis
```

Com o MVP: profissional cria conta, configura serviços e horários, e clientes já conseguem agendar pelo link público.

---

## Regras Obrigatórias Durante o Desenvolvimento

1. ✅ `npm run type-check` deve passar antes de cada commit
2. ✅ Nunca usar `any` no TypeScript
3. ✅ RLS ativo e testado em cada nova tabela
4. ✅ Componentes de `src/components/ui/` — nunca duplicar
5. ✅ Tailwind classes — nunca inline styles
6. ✅ Commits semânticos: `feat:`, `fix:`, `chore:`
7. ✅ Testar no mobile (responsivo) a cada feature

---

## Legenda de Status

| Ícone | Significado |
|-------|-------------|
| 🔴 | Não iniciado / Crítico |
| 🟠 | Em planejamento / Alta prioridade |
| 🟡 | Em andamento / Prioridade média |
| 🟢 | Concluído |
| ⬜ | Pendente de revisão |
