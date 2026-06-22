# ETAPA 04 — Agenda e Agendamentos (Core)

**Status:** 🔴 Não iniciado  
**Prioridade:** CRÍTICA  
**Estimativa:** 4–5 dias  
**Dependências:** Etapas 01, 02, 03

---

## Contexto

A página `/app` (agenda) é o coração da aplicação. Atualmente usa dados completamente mockados em `src/lib/mock-data.ts`. Esta etapa conecta a agenda ao banco real, implementa a criação/edição/cancelamento de agendamentos e o CRM de clientes.

---

## Objetivo

Agenda funcional com dados reais do Supabase, CRUD completo de agendamentos, CRM de clientes, e visualização em timeline/grade. Esta é a etapa mais complexa do projeto.

---

## Checklist de Execução

### Hook `useAgendamentos` (`src/hooks/useAgendamentos.ts`)
- [ ] `listAppointments(filters)` — listar agendamentos com filtros
  - [ ] Filtro por data (dia, semana, mês)
  - [ ] Filtro por status
  - [ ] Ordenação por `scheduled_at`
- [ ] `createAppointment(data)` — criar agendamento
- [ ] `updateAppointment(id, data)` — editar agendamento
- [ ] `updateStatus(id, status)` — mudar status rapidamente
- [ ] `cancelAppointment(id, reason)` — cancelar com motivo
- [ ] `completeAppointment(id)` — marcar como concluído
- [ ] Cache React Query com real-time Supabase subscriptions
- [ ] Invalidação automática após mutações

### Hook `useClientes` (`src/hooks/useClientes.ts`)
- [ ] `listClients(search?)` — listar clientes com busca
- [ ] `getClient(id)` — detalhe do cliente
- [ ] `createClient(data)` — criar cliente
- [ ] `updateClient(id, data)` — editar cliente
- [ ] `searchOrCreateClient(phone)` — buscar ou criar durante agendamento

### Página de Agenda (`/app`)
- [ ] Substituir mock data por dados reais do banco
- [ ] Toggle **Timeline / Grade** funcionando
- [ ] Navegador de data: Hoje, setas anterior/próximo
- [ ] Strip semanal (SEG–DOM) com indicador de agendamentos por dia
- [ ] Chips de status com contadores reais (Todos, Pendentes, Confirmados, Concluídos, Cancelados)
- [ ] Lista de agendamentos agrupada por horário
- [ ] Card de agendamento com:
  - [ ] Horário (ex: 10:00 – 11:30)
  - [ ] Avatar + nome do cliente
  - [ ] Nome do serviço
  - [ ] Valor formatado (R$)
  - [ ] Badge de status colorido
  - [ ] Botão WhatsApp (link direto para o número do cliente)
  - [ ] Menu de ações (confirmar, concluir, cancelar)
- [ ] Real-time updates via Supabase subscription

### Sheet de Novo Agendamento
- [ ] Fluxo em 4 etapas com indicador de progresso:
  - [ ] **Etapa 1 — Cliente:**
    - [ ] Busca por nome ou telefone (auto-complete)
    - [ ] Se não encontrado: botão "Novo cliente" (formulário inline)
    - [ ] Exibir histórico do cliente ao selecionar
  - [ ] **Etapa 2 — Serviço:**
    - [ ] Lista de serviços ativos (cards)
    - [ ] Exibir preço, duração e valor do depósito
  - [ ] **Etapa 3 — Data e Hora:**
    - [ ] Calendário (react-day-picker)
    - [ ] Bloquear dias sem horário configurado
    - [ ] Bloquear datas bloqueadas
    - [ ] Listar horários disponíveis como chips (ex: 9:00, 9:30, 10:00...)
    - [ ] Lógica de disponibilidade: `get_available_slots()`
  - [ ] **Etapa 4 — Confirmação:**
    - [ ] Resumo: cliente, serviço, data/hora, preço, depósito
    - [ ] Campo de observações (opcional)
    - [ ] Botão "Confirmar Agendamento"
- [ ] Ao confirmar: inserir no banco, toast de sucesso, atualizar lista
- [ ] Botão "Voltar" entre etapas
- [ ] Validação em cada etapa antes de avançar

### Ações no Card de Agendamento
- [ ] **Confirmar** (pending → confirmed): mudar status + notificação
- [ ] **Concluir** (confirmed → completed): mudar status + atualizar `clients.total_appointments`
- [ ] **Cancelar**: dialog com campo de motivo, mudar status para cancelled
- [ ] **No-show**: marcar como no_show

### Página de Clientes (`/clientes`)
- [ ] Listar clientes do banco (substituir mock)
- [ ] Busca por nome e telefone
- [ ] Card de cliente com: avatar, nome, telefone, total de agendamentos, total gasto
- [ ] Ordenar por: nome, mais recente, mais agendamentos
- [ ] Abrir detalhe do cliente (sheet/modal):
  - [ ] Dados de contato
  - [ ] Histórico de agendamentos (últimos 10)
  - [ ] Notas/observações
  - [ ] Botão editar dados
- [ ] Botão "Novo Cliente" com form
- [ ] Estado vazio (sem clientes ainda)
- [ ] Loading skeleton

### Visualização em Grade (Calendar View)
- [ ] Grade horária de 8h–20h
- [ ] Agendamentos como blocos coloridos por status
- [ ] Clique no bloco → abre detalhe
- [ ] Clique em horário vazio → abre sheet de novo agendamento

---

## Cálculo de Disponibilidade

```typescript
// Função a implementar: calcular slots disponíveis
// Entradas: professional_id, date, service_duration_minutes
// Saída: array de horários disponíveis (strings "HH:MM")

function getAvailableSlots(
  workingHours: WorkingHoursRow,
  existingAppointments: AppointmentRow[],
  serviceDuration: number,
  intervalMinutes: number = 30
): string[] {
  // 1. Verificar se o dia tem horário configurado
  // 2. Gerar todos os slots do dia (ex: de 9h até 18h, de 30 em 30 min)
  // 3. Remover slots já ocupados por agendamentos existentes
  // 4. Remover slots que colidiriam com o intervalo (pausa)
  // 5. Retornar slots disponíveis
}
```

---

## Arquivos a Criar/Editar

```
src/hooks/useAgendamentos.ts         ← CRIAR
src/hooks/useClientes.ts             ← CRIAR
src/lib/availability.ts              ← CRIAR (cálculo de slots)
src/routes/app.tsx                   ← EDITAR (dados reais)
src/routes/clientes.tsx              ← EDITAR (CRUD real)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Agenda exibe agendamentos reais do banco
- Novo agendamento é criado e aparece na lista
- Ações de status funcionam
- CRM de clientes funciona com CRUD
- Cálculo de disponibilidade bloqueia horários já ocupados
- Real-time: novo agendamento aparece sem reload
