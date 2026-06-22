# ETAPA 08 — Integração Google Calendar

**Status:** 🔴 Não iniciado  
**Prioridade:** Média  
**Estimativa:** 2 dias  
**Dependências:** Etapas 01, 02, 04

---

## Contexto

A página `/google-calendar` existe com UI mockada. A integração Google Calendar é opcional para o profissional, mas agrega muito valor: agendamentos aparecem no Google Calendar e bloqueiam automaticamente horários ocupados por compromissos externos.

---

## Objetivo

OAuth2 com Google Calendar. Sincronização de duas vias: agendamentos criados no app aparecem no Google Calendar do profissional e compromissos no Google Calendar bloqueiam horários no app.

---

## Checklist de Execução

### Configuração OAuth2 Google
- [ ] Criar projeto no Google Cloud Console
- [ ] Ativar Google Calendar API
- [ ] Criar credenciais OAuth2 (Client ID + Secret)
- [ ] Configurar redirect URI: `http://localhost:3000/api/google-calendar-callback`
- [ ] Escopos necessários: `https://www.googleapis.com/auth/calendar`

### Fluxo de Conexão (`/google-calendar`)
- [ ] Botão "Conectar Google Calendar"
- [ ] Redirecionar para OAuth Google
- [ ] Receber callback com authorization code
- [ ] Trocar por `access_token` + `refresh_token`
- [ ] Salvar tokens em tabela `google_calendar_tokens` (migration)
- [ ] Exibir status: Conectado / Desconectado
- [ ] Mostrar calendários disponíveis (dropdown para escolher qual sincronizar)
- [ ] Botão "Desconectar"

### Tabela de Tokens (Migration)
```sql
CREATE TABLE public.google_calendar_tokens (
  user_id UUID PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  calendar_id TEXT DEFAULT 'primary',
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- [ ] Criar migration
- [ ] RLS: usuário vê apenas o próprio token

### Client Google Calendar (`src/integrations/google-calendar.ts`)
- [ ] `getAuthUrl()` — gerar URL de autorização
- [ ] `exchangeCode(code)` — trocar code por tokens
- [ ] `refreshAccessToken(refreshToken)` — renovar token expirado
- [ ] `createEvent(token, appointment)` — criar evento no Google Calendar
- [ ] `deleteEvent(token, eventId)` — remover evento
- [ ] `listEvents(token, dateRange)` — listar eventos do período
- [ ] Wrapper com auto-refresh de token quando expirado

### Sincronização App → Google Calendar
- [ ] Ao criar agendamento → criar evento no Google Calendar
  - [ ] Título: `[SuaAgenda] {{servico}} - {{cliente_nome}}`
  - [ ] Horário: `scheduled_at` + `duration_minutes`
  - [ ] Descrição: nome do serviço, valor, notas
  - [ ] Salvar `google_event_id` no agendamento
- [ ] Ao cancelar agendamento → deletar evento no Google Calendar
- [ ] Ao atualizar horário → atualizar evento

### Sincronização Google Calendar → App (Bloqueio)
- [ ] Cron job diário: buscar eventos do Google Calendar do dia seguinte
- [ ] Para cada evento no período de funcionamento:
  - [ ] Criar entrada em `blocked_slots` (nova tabela ou flag nos slots)
  - [ ] Esses horários não aparecem disponíveis no booking público
- [ ] Distinguir: eventos criados pelo app (ignorar) vs eventos externos (bloquear)

### Configurações na UI (`/google-calendar`)
- [ ] Toggle: habilitar/desabilitar sincronização
- [ ] Dropdown: escolher qual calendário Google sincronizar
- [ ] Toggle: "Bloquear compromissos do Google no app"
- [ ] Botão: "Sincronizar agora" (forçar sync imediato)
- [ ] Histórico de sincronização (último sync)

---

## Variáveis de Ambiente

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar-callback
```

---

## Arquivos a Criar/Editar

```
src/integrations/google-calendar.ts             ← CRIAR/EDITAR
src/routes/google-calendar.tsx                  ← EDITAR (OAuth real)
src/routes/api/google-calendar-callback.ts      ← CRIAR
supabase/migrations/etapa08_google_tokens.sql   ← CRIAR
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- OAuth com Google funciona
- Agendamento criado aparece no Google Calendar
- Cancelamento remove evento do Google Calendar
- Bloqueio de compromissos externos funciona
