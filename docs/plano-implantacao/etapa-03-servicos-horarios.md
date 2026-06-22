# ETAPA 03 — Gerenciamento de Serviços e Horários

**Status:** 🔴 Não iniciado  
**Prioridade:** Alta  
**Estimativa:** 2 dias  
**Dependências:** Etapa 01 (banco), Etapa 02 (auth)

---

## Contexto

As páginas `/servicos` e `/horarios` existem com UI mockada. Os dados precisam ser conectados ao banco real com CRUD completo. Esta etapa é pré-requisito para o booking público (Etapa 05).

---

## Objetivo

CRUD completo de serviços e configuração real de horários de funcionamento, com dados persistidos no Supabase. Tudo deve refletir imediatamente na página pública de agendamento.

---

## Checklist de Execução

### Hook `useServicos` (`src/hooks/useServicos.ts`)
- [ ] `listServices()` — listar serviços ativos do profissional autenticado
- [ ] `createService(data)` — criar novo serviço
- [ ] `updateService(id, data)` — editar serviço
- [ ] `deleteService(id)` — desativar serviço (soft delete via `is_active = false`)
- [ ] Cache com React Query + invalidação automática
- [ ] Tipos TypeScript completos

### Página de Serviços (`/servicos`)
- [ ] Listar serviços do banco (substituir mock)
- [ ] Botão "Novo Serviço" → modal/sheet de criação
- [ ] Card de serviço com: nome, preço, duração, depósito, status ativo/inativo
- [ ] Botão editar → sheet com form preenchido
- [ ] Botão ativar/desativar (toggle `is_active`)
- [ ] Botão excluir com confirmação (AlertDialog)
- [ ] Loading state (skeleton)
- [ ] Estado vazio (quando não há serviços)
- [ ] Toasts de sucesso/erro em cada ação

### Form de Serviço (modal/sheet)
- [ ] Nome do serviço (obrigatório, máx 100 chars)
- [ ] Descrição (opcional, máx 300 chars)
- [ ] Preço em R$ (input formatado como moeda)
- [ ] Duração (select: 15min, 30min, 45min, 1h, 1h30, 2h, 2h30, 3h)
- [ ] Depósito: tipo (percentual ou valor fixo) + valor
- [ ] Validação Zod completa
- [ ] Preview do valor do depósito em tempo real

### Página de Horários (`/horarios`)
- [ ] Carregar horários atuais do banco
- [ ] Toggle por dia da semana (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
- [ ] Para cada dia ativo: campo de hora início e fim
- [ ] Configurar intervalo (almoço/pausa): hora início e fim
- [ ] Botão "Salvar" — atualiza `working_hours` no banco
- [ ] Botão "Aplicar a todos os dias" (copiar configuração de um dia)
- [ ] Loading state durante salvamento
- [ ] Toast de confirmação

### Dias Bloqueados (subseção em `/horarios`)
- [ ] Calendário para selecionar datas bloqueadas
- [ ] Listar datas bloqueadas com motivo
- [ ] Adicionar data bloqueada (data + motivo opcional)
- [ ] Remover data bloqueada
- [ ] Integração com `blocked_dates`

### Validações
- [ ] Hora de fim maior que hora de início
- [ ] Intervalo (pausa) dentro do horário de funcionamento
- [ ] Ao menos um dia da semana ativo
- [ ] Preço maior que zero
- [ ] Duração mínima de 15 minutos

### Tipos TypeScript
- [ ] `ServiceInsert`, `ServiceUpdate`, `ServiceRow` do banco
- [ ] `WorkingHoursRow`, `WorkingHoursInsert`
- [ ] `BlockedDateRow`

---

## Arquivos a Criar/Editar

```
src/hooks/useServicos.ts             ← CRIAR
src/hooks/useHorarios.ts             ← CRIAR
src/routes/servicos.tsx              ← EDITAR (CRUD real)
src/routes/horarios.tsx              ← EDITAR (horários reais)
src/routes/servico.novo.tsx          ← EDITAR (form real)
src/routes/servico.$id.tsx           ← EDITAR (edição real)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- CRUD de serviços funciona e persiste no banco
- Horários de funcionamento são salvos e recuperados
- Dias bloqueados funcionam
- Todas as validações passam
- `npm run type-check` sem erros
