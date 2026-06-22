# ETAPA 07 — Integração WhatsApp (Evolution Go)

**Status:** 🔴 Não iniciado  
**Prioridade:** Alta  
**Estimativa:** 2–3 dias  
**Dependências:** Etapas 01, 02, 04, 05

---

## Contexto

O WhatsApp é o canal principal de comunicação com clientes no Brasil. A integração usa Evolution Go (self-hosted), que já está mencionado nas specs. Mensagens automáticas de confirmação, lembrete (24h antes) e cancelamento são essenciais para reduzir no-shows.

---

## Objetivo

Enviar mensagens automáticas via WhatsApp para clientes em eventos-chave: confirmação de agendamento, lembrete 24h antes, e cancelamento. Também permitir que o profissional configure os textos das mensagens.

---

## Eventos Automáticos

| Evento | Quando | Para quem |
|--------|--------|-----------|
| Confirmação | Agendamento criado | Cliente |
| Confirmação profissional | Agendamento criado | Profissional |
| Lembrete | 24h antes do horário | Cliente |
| Cancelamento | Ao cancelar | Cliente |
| Avaliação | 2h após conclusão | Cliente |

---

## Checklist de Execução

### Configuração da Integração (`/whatsapp`)
- [ ] Form de conexão:
  - [ ] URL da instância Evolution Go
  - [ ] API Key
  - [ ] Nome da instância
- [ ] Botão "Testar conexão" → enviar mensagem de teste para o próprio número
- [ ] Status: Conectado / Desconectado
- [ ] QR Code para escanear (se usar sessão WhatsApp pessoal)
- [ ] Salvar config em `profiles` ou tabela dedicada

### Templates de Mensagens (UI)
- [ ] Seção de templates customizáveis:
  - [ ] Confirmação de agendamento
  - [ ] Lembrete 24h antes
  - [ ] Cancelamento
  - [ ] Avaliação pós-serviço
- [ ] Variáveis disponíveis: `{{cliente_nome}}`, `{{servico}}`, `{{data}}`, `{{hora}}`, `{{profissional}}`
- [ ] Preview da mensagem com variáveis substituídas
- [ ] Botão "Restaurar padrão"
- [ ] Salvar templates no banco

### Client de Evolution Go (`src/integrations/whatsapp.ts`)
- [ ] Criar cliente HTTP para Evolution Go API
- [ ] Método `sendTextMessage(phone, message)`:
  - [ ] Formatar número: `55{DDD}{numero}@s.whatsapp.net`
  - [ ] POST para `/message/sendText/{instance}`
  - [ ] Retry em caso de falha (1 tentativa)
- [ ] Método `sendTemplateMessage(phone, template, variables)`:
  - [ ] Substituir variáveis no template
  - [ ] Chamar `sendTextMessage`
- [ ] Método `checkConnection()`:
  - [ ] GET `/instance/connectionState/{instance}`
  - [ ] Retornar true/false
- [ ] Tratamento de erros sem lançar exceção (não quebrar o agendamento)

### Disparadores de Mensagens

**Confirmação de Agendamento:**
- [ ] Chamar após `appointments` INSERT bem-sucedido
- [ ] Criar server function `sendConfirmationMessage(appointmentId)`
- [ ] Mensagem padrão:
  ```
  Olá {{cliente_nome}}! 👋
  Seu agendamento foi confirmado! ✅
  
  📅 {{data}} às {{hora}}
  💅 {{servico}}
  💰 Valor: R$ {{preco}}
  📍 {{profissional_nome}}
  
  Até logo!
  ```

**Lembrete 24h Antes:**
- [ ] Criar cron job ou Edge Function no Supabase
- [ ] Rodar diariamente às 10h
- [ ] Buscar agendamentos de amanhã com status `confirmed`
- [ ] Enviar mensagem de lembrete para cada cliente
- [ ] Mensagem padrão:
  ```
  Olá {{cliente_nome}}! 😊
  Lembrete do seu agendamento amanhã:
  
  🕐 {{hora}}
  💅 {{servico}}
  📍 {{profissional_nome}}
  
  Se precisar cancelar, entre em contato.
  ```

**Cancelamento:**
- [ ] Chamar quando status muda para `cancelled`
- [ ] Incluir motivo se disponível

**Avaliação Pós-Serviço:**
- [ ] Chamar 2h após horário quando status é `completed`
- [ ] Link para avaliação (futura: página de avaliação)

### Histórico de Mensagens
- [ ] Criar tabela `whatsapp_messages` (migration):
  - [ ] `appointment_id`, `phone`, `type`, `message`, `sent_at`, `status`
- [ ] Registrar cada mensagem enviada
- [ ] Exibir histórico na página `/whatsapp`

### Tratamento de Erros
- [ ] Evolution Go offline → log de erro, não quebrar fluxo
- [ ] Número inválido → marcar como falha, continuar
- [ ] Rate limit → implementar fila simples

---

## Variáveis de Ambiente

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=suaagendapro
```

---

## Arquivos a Criar/Editar

```
src/integrations/whatsapp.ts              ← CRIAR/EDITAR
src/lib/whatsapp-templates.ts             ← CRIAR
src/routes/whatsapp.tsx                   ← EDITAR (configuração real)
supabase/migrations/etapa07_whatsapp.sql  ← CRIAR (tabela mensagens)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Profissional conecta instância Evolution Go
- Mensagem de confirmação é enviada ao agendar
- Lembrete 24h funciona (testar manualmente)
- Cancelamento envia mensagem
- Histórico de mensagens é registrado
