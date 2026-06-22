# ETAPA 01 — Fundação do Banco de Dados

**Status:** 🟢 Concluído (2026-06-21)  
**Prioridade:** CRÍTICA — todas as etapas dependem desta  
**Estimativa:** 2–3 dias  
**Dependências:** Supabase local rodando (já OK)

---

## Contexto

As migrations existentes cobrem apenas pagamentos (`professional_payment_settings`, `payment_transactions`, `mercado_pago_*`). O núcleo da aplicação — perfis, serviços, agendamentos, clientes — não tem tabelas ainda. Sem este banco, nenhuma tela funciona com dados reais.

---

## Objetivo

Criar o schema completo do banco de dados com RLS (Row Level Security) em todas as tabelas, triggers de `updated_at`, índices de performance e seed de dados para desenvolvimento.

---

## Tabelas a Criar

### 1. `profiles` — Perfil do profissional
```sql
- id (uuid, FK → auth.users)
- slug (text, único — URL pública)
- display_name (text)
- bio (text)
- phone (text)
- avatar_url (text)
- cover_url (text)
- city, state (text)
- specialty (text)
- is_active (boolean)
- onboarding_completed (boolean)
- created_at, updated_at (timestamptz)
```

### 2. `services` — Serviços oferecidos
```sql
- id (uuid)
- professional_id (uuid, FK → profiles)
- name (text)
- description (text)
- duration_minutes (integer)
- price_cents (integer)
- deposit_percent (integer, 0–100)
- is_active (boolean)
- created_at, updated_at
```

### 3. `working_hours` — Horários de funcionamento
```sql
- id (uuid)
- professional_id (uuid, FK → profiles)
- day_of_week (0–6, domingo=0)
- start_time (time)
- end_time (time)
- is_open (boolean)
- break_start (time, nullable)
- break_end (time, nullable)
```

### 4. `blocked_dates` — Datas bloqueadas / feriados
```sql
- id (uuid)
- professional_id (uuid)
- blocked_date (date)
- reason (text, nullable)
```

### 5. `clients` — Clientes do profissional (CRM)
```sql
- id (uuid)
- professional_id (uuid, FK → profiles)
- name (text)
- email (text, nullable)
- phone (text)
- notes (text, nullable)
- total_appointments (integer, default 0)
- total_spent_cents (integer, default 0)
- last_appointment_at (timestamptz, nullable)
- created_at, updated_at
```

### 6. `appointments` — Agendamentos (tabela central)
```sql
- id (uuid)
- professional_id (uuid, FK → profiles)
- client_id (uuid, FK → clients)
- service_id (uuid, FK → services)
- scheduled_at (timestamptz)
- duration_minutes (integer)
- status (enum: pending, confirmed, completed, cancelled, no_show)
- price_cents (integer)
- deposit_cents (integer)
- deposit_paid (boolean)
- notes (text, nullable)
- cancelled_at (timestamptz, nullable)
- cancel_reason (text, nullable)
- created_at, updated_at
```

### 7. `notifications` — Notificações do sistema
```sql
- id (uuid)
- user_id (uuid)
- type (text: new_appointment, reminder, cancellation, payment)
- title (text)
- body (text)
- is_read (boolean, default false)
- appointment_id (uuid, nullable)
- created_at
```

### 8. `portfolio_items` — Galeria de trabalhos
```sql
- id (uuid)
- professional_id (uuid)
- image_url (text)
- title (text, nullable)
- description (text, nullable)
- service_id (uuid, nullable)
- order_index (integer)
- created_at
```

---

## Checklist de Execução

### Banco de Dados
- [ ] Criar migration `etapa01_profiles.sql`
- [ ] Criar migration `etapa01_services.sql`
- [ ] Criar migration `etapa01_working_hours.sql`
- [ ] Criar migration `etapa01_blocked_dates.sql`
- [ ] Criar migration `etapa01_clients.sql`
- [ ] Criar migration `etapa01_appointments.sql`
- [ ] Criar migration `etapa01_notifications.sql`
- [ ] Criar migration `etapa01_portfolio.sql`
- [ ] Aplicar todas as migrations: `supabase db push`
- [ ] Verificar tabelas no Studio: `http://localhost:54323`

### RLS (Row Level Security)
- [ ] RLS em `profiles` — profissional vê/edita só o seu
- [ ] RLS em `services` — profissional vê/edita só os seus
- [ ] RLS em `working_hours` — profissional edita, público lê (para booking)
- [ ] RLS em `clients` — profissional vê só os seus clientes
- [ ] RLS em `appointments` — profissional vê os seus; cliente vê os dele
- [ ] RLS em `notifications` — usuário vê só as suas
- [ ] RLS em `portfolio_items` — profissional edita, público lê

### Triggers & Funções
- [ ] Trigger `updated_at` em todas as tabelas
- [ ] Trigger para atualizar `clients.total_appointments` após inserção em `appointments`
- [ ] Trigger para criar `profile` automático após `auth.users` insert
- [ ] Função `get_available_slots(professional_id, date)` para cálculo de horários livres

### Índices de Performance
- [ ] `appointments (professional_id, scheduled_at)`
- [ ] `appointments (professional_id, status)`
- [ ] `clients (professional_id, name)`
- [ ] `profiles (slug)` UNIQUE
- [ ] `services (professional_id, is_active)`

### Seed de Dados (Dev)
- [ ] Criar usuário profissional de teste
- [ ] Criar perfil com slug `joana-beleza`
- [ ] Criar 5 serviços (manicure, pedicure, sobrancelha, etc.)
- [ ] Criar horários de funcionamento (seg–sáb, 9h–18h)
- [ ] Criar 10 clientes de exemplo
- [ ] Criar 20 agendamentos nos próximos 30 dias

### Tipos TypeScript
- [ ] Atualizar `src/integrations/supabase/types.ts` com novos tipos
- [ ] Verificar se `supabase gen types` está gerando corretamente

### Validação Final
- [ ] `npm run type-check` sem erros
- [ ] Verificar todas as tabelas no Supabase Studio
- [ ] Testar RLS: usuário A não vê dados do usuário B
- [ ] Testar trigger de profile automático

---

## Comandos Úteis

```bash
# Aplicar migrations
supabase db push

# Gerar types TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Verificar status
supabase status

# Resetar banco (CUIDADO em prod!)
supabase db reset

# Abrir Studio
start http://localhost:54323
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Todas as 8 tabelas existem no banco local
- RLS ativo e testado em todas as tabelas
- Types TypeScript gerados e sem erros
- Seed de dados funcionando
- `npm run type-check` passa
