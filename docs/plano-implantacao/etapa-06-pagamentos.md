# ETAPA 06 — Pagamentos (Mercado Pago + PIX)

**Status:** 🔴 Não iniciado  
**Prioridade:** Alta  
**Estimativa:** 4 dias  
**Dependências:** Etapas 01, 02, 05

---

## Contexto

As tabelas de pagamento já existem no banco (`professional_payment_settings`, `payment_transactions`, `mercado_pago_account_secrets`). A UI das páginas `/pagamentos` e `/transacoes` existe mockada. Esta etapa implementa o fluxo real de cobranças.

---

## Objetivo

Permitir que profissionais conectem sua conta Mercado Pago via OAuth e configurem PIX manual. Após agendamento, cliente pode pagar o depósito via PIX (QR Code gerado no sistema) ou via Mercado Pago (link de checkout).

---

## Fluxo de Pagamento

```
Agendamento confirmado
  ↓
Se serviço tem depósito configurado:
  ├── PIX Manual: gerar QR Code com valor do depósito
  │     → cliente paga → profissional confirma manualmente
  └── Mercado Pago: gerar link de checkout
        → cliente paga → webhook confirma automaticamente
  ↓
Agendamento marcado como "depósito pago"
```

---

## Checklist de Execução

### Conexão Mercado Pago OAuth (`/pagamentos`)
- [ ] Botão "Conectar Mercado Pago" → inicia OAuth flow
- [ ] Criar `src/routes/api/mp-oauth-start.ts`:
  - [ ] Gerar URL de autorização Mercado Pago
  - [ ] Criar registro em `mercado_pago_oauth_attempts`
  - [ ] Redirecionar para MP
- [ ] Criar callback em `src/routes/api/public/mercado-pago.callback.ts` (já existe, revisar):
  - [ ] Receber `code` do MP
  - [ ] Trocar por `access_token`
  - [ ] Salvar em `mercado_pago_account_secrets`
  - [ ] Atualizar `professional_payment_settings.mercado_pago_connected = true`
  - [ ] Redirecionar para `/pagamentos` com sucesso
- [ ] Exibir status de conexão na UI
- [ ] Botão "Desconectar Mercado Pago"
- [ ] Exibir email da conta conectada

### Configuração PIX (`/pagamentos`)
- [ ] Form de configuração PIX:
  - [ ] Tipo de chave: CPF, CNPJ, e-mail, telefone, aleatória
  - [ ] Chave PIX
  - [ ] Nome do beneficiário
  - [ ] Cidade (obrigatório para QR Code)
- [ ] Salvar em `professional_payment_settings`
- [ ] Preview do QR Code gerado

### Geração de QR Code PIX
- [ ] Criar `src/lib/pix.ts` (já existe, revisar e completar):
  - [ ] Gerar payload PIX (EMV)
  - [ ] Incluir: chave, valor, descrição, txid único
  - [ ] Gerar QR Code como `data:image/png;base64,...`
  - [ ] Usar biblioteca `qrcode` (já instalada)
- [ ] Exibir QR Code no agendamento quando depósito é necessário
- [ ] Botão "Copiar código PIX" (copia o payload)
- [ ] Botão "Pagar via PIX" (deep link em mobile)

### Checkout Mercado Pago
- [ ] Criar server function `src/lib/payments.functions.ts` (já existe, revisar):
  - [ ] `createPreference(appointmentId)` — criar preferência de pagamento MP
  - [ ] Retornar `init_point` (URL de checkout)
  - [ ] Configurar back_url, notification_url
- [ ] Botão "Pagar com Mercado Pago" na confirmação do agendamento
- [ ] Redirecionar para checkout MP
- [ ] Página de retorno (sucesso/falha/pendente)

### Webhook de Confirmação (Mercado Pago)
- [ ] Criar `src/routes/api/public/mp-webhook.ts`:
  - [ ] Verificar assinatura do webhook (segurança)
  - [ ] Receber notificação de pagamento
  - [ ] Atualizar `payment_transactions.status = 'paid'`
  - [ ] Atualizar `appointments.deposit_paid = true`
  - [ ] Disparar notificação para o profissional

### Página de Pagamentos (`/pagamentos`)
- [ ] Seção: status da conta MP (conectada/desconectada)
- [ ] Seção: configuração PIX
- [ ] Seção: configuração de depósito padrão (% ou valor fixo)
- [ ] Seção: configuração de política de cancelamento
- [ ] Preview: como o cliente vê a tela de pagamento

### Página de Transações (`/transacoes`)
- [ ] Listar `payment_transactions` do banco
- [ ] Filtros: período, status, método
- [ ] Cards de transação com: cliente, serviço, valor, método, status, data
- [ ] Resumo: total recebido no período
- [ ] Exportar para CSV (futuro)
- [ ] Paginação

### Confirmação Manual de PIX
- [ ] No card do agendamento: botão "Confirmar depósito PIX"
- [ ] Ao clicar: marcar `appointments.deposit_paid = true`
- [ ] Criar registro em `payment_transactions` com `method = 'pix_manual'`

---

## Variáveis de Ambiente Necessárias

```env
# .env.local
MP_CLIENT_ID=...
MP_CLIENT_SECRET=...
MP_REDIRECT_URI=http://localhost:3000/api/public/mercado-pago-callback
MP_WEBHOOK_SECRET=...
```

---

## Arquivos a Criar/Editar

```
src/lib/pix.ts                                    ← EDITAR (completar)
src/lib/payments.functions.ts                     ← EDITAR (completar)
src/lib/mp-oauth.server.ts                        ← EDITAR (completar)
src/routes/pagamentos.tsx                         ← EDITAR (conexão real)
src/routes/transacoes.tsx                         ← EDITAR (dados reais)
src/routes/api/public/mercado-pago.callback.ts    ← EDITAR (completar)
src/routes/api/public/mp-webhook.ts               ← CRIAR
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Profissional conecta conta Mercado Pago via OAuth
- PIX configurado e QR Code gerado corretamente
- Checkout MP funciona (sandbox do Mercado Pago)
- Webhook atualiza status automaticamente
- Histórico de transações exibe dados reais
