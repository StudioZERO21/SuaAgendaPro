# ETAPA 05 — Página Pública e Booking de Clientes

**Status:** 🔴 Não iniciado  
**Prioridade:** Alta  
**Estimativa:** 3 dias  
**Dependências:** Etapas 01, 03, 04

---

## Contexto

A página `/agendar/:slug` é onde o cliente final agenda o serviço. Atualmente é mockada. Esta página não requer autenticação — é o produto principal visível ao mundo externo.

---

## Objetivo

Implementar a jornada completa de agendamento do cliente final: ver perfil do profissional, selecionar serviço, escolher data/hora disponível, informar dados pessoais e confirmar. O booking deve criar o agendamento no banco e notificar o profissional.

---

## Fluxo do Cliente

```
1. Cliente acessa: suaagenda.pro/agendar/joana-beleza
2. Vê perfil: foto, bio, especialidade, cidade
3. Vê serviços disponíveis (cards com preço e duração)
4. Clica em um serviço
5. Seleciona a data no calendário
6. Seleciona o horário disponível
7. Preenche dados: nome, telefone, email (opcional)
8. Revisa o resumo
9. Confirma
10. Vê tela de confirmação com resumo e opção de adicionar ao Google Calendar
```

---

## Checklist de Execução

### Página de Perfil Público (`/perfil-publico`)
- [ ] Buscar dados do profissional pelo slug (sem auth)
- [ ] Exibir foto de capa + avatar
- [ ] Nome, especialidade, cidade
- [ ] Bio/descrição
- [ ] Galeria de trabalhos (portfolio_items)
- [ ] Lista de serviços com preço e duração
- [ ] Botão "Agendar" → navega para `/agendar/:slug`
- [ ] Link para compartilhar perfil (copiar URL)
- [ ] Meta tags para SEO (og:title, og:image, description)
- [ ] Tratar slug inválido → 404

### Página de Agendamento Público (`/agendar/:slug`)

**Passo 1 — Seleção de Serviço:**
- [ ] Carregar serviços ativos do profissional (sem auth)
- [ ] Cards de serviço: nome, duração, preço, valor do depósito
- [ ] Seleção visual destacada
- [ ] Se profissional não encontrado → 404

**Passo 2 — Seleção de Data:**
- [ ] Calendário (react-day-picker)
- [ ] Bloquear dias anteriores a hoje
- [ ] Bloquear dias que não têm horário configurado (baseado em `working_hours`)
- [ ] Bloquear `blocked_dates`
- [ ] Indicador visual de disponibilidade (dias com slots livres)

**Passo 3 — Seleção de Horário:**
- [ ] Carregar slots disponíveis para a data selecionada e o serviço escolhido
- [ ] Chips de horário: disponível (clicável) / ocupado (desabilitado)
- [ ] Loading enquanto carrega
- [ ] Mensagem se não há horários disponíveis naquele dia

**Passo 4 — Dados do Cliente:**
- [ ] Nome completo (obrigatório)
- [ ] Telefone/WhatsApp (obrigatório, validação de formato BR)
- [ ] E-mail (opcional)
- [ ] Campo de observações (opcional, ex: "quero unhas curtas")
- [ ] Checkbox: aceitar política de cancelamento

**Passo 5 — Revisão e Confirmação:**
- [ ] Resumo completo: serviço, data, hora, profissional
- [ ] Preço total + valor do depósito destacado
- [ ] Política de cancelamento
- [ ] Botão "Confirmar Agendamento"

**Passo 6 — Sucesso:**
- [ ] Tela de confirmação com ícone de check
- [ ] Resumo do agendamento confirmado
- [ ] Botão "Adicionar ao Google Calendar" (link universal `.ics`)
- [ ] Botão "Compartilhar via WhatsApp" (link `wa.me`)
- [ ] Informar sobre o depósito (se houver)

### API de Disponibilidade (Server Route)
- [ ] Criar `src/routes/api/public/availability.ts`
  - [ ] Parâmetros: `professional_id`, `date`, `service_duration`
  - [ ] Retornar slots disponíveis
  - [ ] Sem autenticação (público)
  - [ ] Cache de 1 minuto

### API de Criação de Agendamento (Server Route)
- [ ] Criar `src/routes/api/public/appointments.ts`
  - [ ] Recebe dados do cliente + agendamento
  - [ ] Criar ou buscar cliente na tabela `clients`
  - [ ] Criar agendamento com status `pending`
  - [ ] Verificar disponibilidade antes de confirmar (race condition safe)
  - [ ] Retornar ID do agendamento criado

### SEO e Performance
- [ ] Meta tags dinâmicas por profissional
- [ ] `og:title`, `og:description`, `og:image` (foto do profissional)
- [ ] Tempo de carregamento < 2 segundos
- [ ] Funcionar sem JavaScript (SSR via TanStack Start)

### Estados de Erro
- [ ] Slug não encontrado → página 404 personalizada
- [ ] Profissional sem serviços cadastrados → mensagem
- [ ] Sem horários disponíveis na semana → mostrar próxima data disponível
- [ ] Erro ao criar agendamento → mensagem clara

---

## Arquivos a Criar/Editar

```
src/routes/agendar.$slug.tsx                    ← EDITAR (fluxo real)
src/routes/perfil-publico.tsx                   ← EDITAR (dados reais)
src/routes/api/public/availability.ts           ← CRIAR
src/routes/api/public/appointments.ts           ← CRIAR
src/lib/availability.ts                         ← USAR (da Etapa 04)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Cliente consegue acessar a página pública por slug
- Fluxo completo de 6 passos funciona
- Agendamento é criado no banco
- Calendário bloqueia dias/horários sem disponibilidade
- Tela de confirmação exibe os dados corretos
- SSR funciona (testar com JavaScript desabilitado)
