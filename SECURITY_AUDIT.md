# Relatório de Segurança — suaAgendaPro

**Data:** 24/06/2026  
**Escopo:** Análise completa do código-fonte (frontend, backend, infraestrutura, banco de dados)  
**Total de vulnerabilidades:** 45  

---

## Índice

- [Resumo por Severidade](#resumo-por-severidade)
- [Nota sobre SQL Injection](#nota-sobre-sql-injection)
- [CRITICO — 6 vulnerabilidades](#critico--6-vulnerabilidades)
- [ALTO — 11 vulnerabilidades](#alto--11-vulnerabilidades)
- [MEDIO — 15 vulnerabilidades](#medio--15-vulnerabilidades)
- [BAIXO — 10 vulnerabilidades](#baixo--10-vulnerabilidades)
- [Plano de Ação — Top 10 Prioridades](#plano-de-ação--top-10-prioridades)
- [Pontos Positivos](#pontos-positivos)

---

## Resumo por Severidade

| Severidade | Quantidade | Categorias Principais |
|---|:---:|---|
| CRITICO | 6 | Broken Auth, IDOR, Business Logic Bypass |
| ALTO | 11 | Token Exposure, Stored XSS, Missing Rate Limiting |
| MEDIO | 15 | CSS Injection, Open Redirect, Info Disclosure |
| BAIXO | 10 | Supply Chain, Secret Management, Security Headers |
| **TOTAL** | **45** | |

---

## Nota sobre SQL Injection

> **Nenhuma vulnerabilidade de SQL Injection foi encontrada.**
>
> O projeto usa o cliente Supabase com queries parametrizadas em todos os arquivos auditados. Não há interpolação de strings em queries SQL. Este vetor de ataque clássico está bem protegido pela arquitetura.

---

## CRITICO — 6 vulnerabilidades

> Requerem ação imediata. 3 delas podem resultar em fraude financeira direta.

---

### C1 — Webhook Mercado Pago sem validação obrigatória de assinatura

- **Arquivo:** `src/routes/api/public/mp-webhook.ts` (linhas 38-49)
- **Categoria:** Broken Authentication / Webhook Spoofing
- **Status:** [ ] Corrigido

**Problema:**  
O webhook só valida a assinatura HMAC quando `MP_WEBHOOK_SECRET` está configurado. Se a variável de ambiente estiver ausente, **qualquer pessoa pode enviar POST com payload forjado** e confirmar pagamentos, manipular o fluxo financeiro, e confirmar agendamentos indevidamente.

```typescript
// VULNERÁVEL — autenticação condicional (fail-open)
if (webhookSecret) {
  // só valida SE a variável existir
  if (!verifyMpSignature(...)) return new Response("Unauthorized", { status: 401 });
}
// sem a variável, passa direto!
```

**Recomendação:**  
Fail-closed: se o segredo não estiver configurado, rejeitar TODAS as requisições com 500. Nunca tornar a autenticação opcional.

```typescript
// CORRETO — fail-closed
const webhookSecret = process.env.MP_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error("[mp-webhook] MP_WEBHOOK_SECRET não configurado");
  return new Response("Internal Server Error", { status: 500 });
}
```

---

### C2 — Webhook Asaas sem validação obrigatória do token

- **Arquivo:** `src/routes/api/webhooks/asaas.ts` (linhas 36-44)
- **Categoria:** Broken Authentication / Webhook Spoofing
- **Status:** [ ] Corrigido

**Problema:**  
Mesmo padrão do C1. A verificação de `ASAAS_WEBHOOK_TOKEN` só ocorre quando a variável está presente. Sem ela, qualquer POST pode acionar mudanças de status de assinatura (`active`, `suspended`, `cancelled`).

```typescript
// VULNERÁVEL
if (
  process.env.ASAAS_WEBHOOK_TOKEN &&  // ← se não existir, bypassa
  token !== process.env.ASAAS_WEBHOOK_TOKEN
) {
  return new Response("Unauthorized", { status: 401 });
}
```

**Recomendação:**  
Fail-closed idêntico ao C1.

---

### C3 — Agendamentos públicos sem validação de propriedade (IDOR)

- **Arquivo:** `src/lib/public-booking.functions.ts` (linhas 172-230, 306-364)
- **Categoria:** IDOR / Broken Access Control
- **Status:** [ ] Corrigido

**Problema:**  
`createPublicBooking` e `createMpPreferenceAndBooking` aceitam `professionalId`, `serviceId`, `priceCents` e `depositCents` fornecidos pelo cliente e usam `supabaseAdmin` (bypass de RLS) para inserir. Não há validação de:
- Se o serviço pertence ao profissional
- Se `accept_online` está habilitado  
- Se o slot está realmente disponível
- Se o preço corresponde ao cadastrado no banco

**Recomendação:**  
Antes de inserir, buscar o serviço do banco e verificar tudo server-side:

```typescript
// Buscar o serviço real do banco — NUNCA confiar no cliente
const { data: svc } = await supabaseAdmin
  .from("services")
  .select("id, professional_id, price_cents, duration_minutes")
  .eq("id", data.serviceId)
  .eq("professional_id", data.professionalId)  // valida propriedade
  .single();

if (!svc) throw new Error("Serviço não encontrado para este profissional");

// Usar valores do banco, não do cliente
const priceCents = svc.price_cents;
const durationMinutes = svc.duration_minutes;
```

---

### C4 — PIX: agendamento confirmado sem prova de pagamento

- **Arquivo:** `src/components/public-page/public-booking-sheet.tsx` (linhas 1048-1050)
- **Categoria:** Business Logic Bypass
- **Status:** [ ] Corrigido

**Problema:**  
Clicar em "Já enviei o comprovante" executa um `setTimeout(600ms)` que cria um agendamento real com `deposit_cents: 0` — sem nenhuma verificação server-side de pagamento. **Qualquer pessoa pode agendar sem pagar.**

```typescript
// VULNERÁVEL — confirmação sem prova
function handleConfirm() {
  setProcessing(true);
  setTimeout(() => onConfirmed(), 600); // ← sem validação alguma
}
```

**Recomendação:**  
Criar o agendamento com `status: "pending_payment"`. O status só deve ser atualizado para `confirmed` via revisão manual do profissional ou via webhook de pagamento verificado.

---

### C5 — Iteração de todos os access_tokens do Mercado Pago em memória

- **Arquivo:** `src/routes/api/public/mp-webhook.ts` (linhas 68-82)
- **Categoria:** Sensitive Data Exposure
- **Status:** [ ] Corrigido

**Problema:**  
O webhook carrega TODOS os `access_token` de todos os usuários de `mercado_pago_account_secrets` e os testa um por um contra a API do MP. Vazamento de log ou erro pode expor os tokens de múltiplos usuários.

**Recomendação:**  
Usar `external_reference` (appointment_id) para lookup direto do usuário, sem iterar todos os tokens.

```typescript
// Buscar o usuário pelo external_reference, não varredura de tokens
const appointmentId = payment.external_reference;
const { data: tx } = await supabaseAdmin
  .from("payment_transactions")
  .select("user_id")
  .eq("appointment_id", appointmentId)
  .single();
```

---

### C6 — SSR bypassa completamente a autenticação do super admin

- **Arquivo:** `src/routes/super/_app/route.tsx` (linhas 16-20)
- **Categoria:** Missing Authentication / SSR Auth Bypass
- **Status:** [ ] Corrigido

**Problema:**  
O `beforeLoad` faz `return` imediato quando `typeof window === "undefined"` (ambiente SSR), pulando toda verificação de token.

```typescript
// VULNERÁVEL
beforeLoad: () => {
  if (typeof window === "undefined") return; // ← pula auth no servidor!
  if (!getSuperAuth()) {
    throw redirect({ to: "/super/login" });
  }
},
```

**Recomendação:**  
Nunca pular a verificação de auth baseado no ambiente. Mover a guarda para o middleware de servidor.

---

## ALTO — 11 vulnerabilidades

---

### H1 — Token de super admin em localStorage + cookie sem HttpOnly/Secure

- **Arquivo:** `src/lib/super-auth.ts` (linhas 5-14)
- **Categoria:** Token Exposure / Broken Authentication
- **Status:** [ ] Corrigido

**Problema:**  
O token de super admin é armazenado em `localStorage` (acessível por qualquer script) e em cookie JavaScript sem flags `HttpOnly` ou `Secure`. Qualquer XSS no domínio permite roubo do token e escalação para privilégios de super admin.

**Recomendação:**  
Migrar para sessão server-side com cookie `HttpOnly; Secure; SameSite=Strict`. Remover armazenamento em localStorage.

---

### H2 — Stored XSS via preview de templates HTML no super admin

- **Arquivo:** `src/routes/super/_app/templates.tsx` (linhas 256-264)
- **Categoria:** Stored Cross-Site Scripting (XSS)
- **Status:** [ ] Corrigido

**Problema:**  
Preview de templates renderiza HTML arbitrário via `dangerouslySetInnerHTML` sem sanitização. Um template malicioso salvo no banco pode executar JavaScript no navegador do super admin, potencialmente roubando o token de super admin (combinado com H1).

**Recomendação:**  
Sanitizar HTML com DOMPurify antes de renderizar, ou usar iframe sandbox isolado.

```typescript
import DOMPurify from "dompurify";

// Antes de renderizar
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(template.html) }} />
```

---

### H3 — CSP permite 'unsafe-inline' para scripts e styles

- **Arquivo:** `nginx/sites/suaagendapro.conf` (linhas 7-9)
- **Categoria:** Security Misconfiguration / Weak CSP
- **Status:** [ ] Corrigido

**Problema:**  
`Content-Security-Policy` inclui `'unsafe-inline'`, anulando grande parte da proteção contra XSS.

**Recomendação:**  
Remover `'unsafe-inline'`; usar nonces ou hashes para scripts/estilos inline legítimos.

---

### H4 — Service Worker com cache indiscriminado de respostas GET

- **Arquivo:** `sw.js` (linhas 57-93)
- **Categoria:** Sensitive Data Caching
- **Status:** [ ] Corrigido

**Problema:**  
Service worker aplica cache-first em QUALQUER resposta GET do mesmo domínio. Dados de agendamentos, perfis e tokens podem ser cacheados e servidos offline, expondo informações privadas.

**Recomendação:**  
Restringir cache apenas a assets estáticos (CSS, JS, imagens). Nunca cachear respostas de API ou endpoints com `Authorization`.

---

### H5 — RLS permite INSERT/SELECT amplos por usuários anônimos em appointments

- **Arquivo:** `supabase/migrations/20260621150003_etapa01_clients_appointments.sql` (linhas 88-95)
- **Categoria:** Broken Access Control
- **Status:** [ ] Corrigido

**Problema:**  
- `appointments_insert_public` permite `anon` INSERT com `WITH CHECK (true)` — sem restrição alguma
- `appointments_select_availability` expõe `client_id`, `notes` e `price_cents` para anônimos

**Recomendação:**  
Remover grant `INSERT` para `anon` e forçar todo agendamento público pelas server functions. Restringir `SELECT` para anon apenas a `professional_id`, `scheduled_at`, `duration_minutes` e `status`.

---

### H6 — Cliente pode marcar transações como 'paid' sem prova de pagamento

- **Arquivo:** `src/lib/payments.functions.ts` (linhas 313-328)
- **Categoria:** Business Logic Bypass
- **Status:** [ ] Corrigido

**Problema:**  
`createPaymentTransaction` aceita `status: "paid"` diretamente do cliente, permitindo criar registros financeiros fraudulentos.

**Recomendação:**  
`status: "paid"` deve ser definido apenas via webhook validado (Asaas ou MP), nunca a partir de input do cliente. Remover `status` do schema de input.

---

### H7 — Auth guard é client-only (useEffect redirect), sem proteção SSR

- **Arquivo:** `src/routes/__root.tsx` (linhas 55-61)
- **Categoria:** Missing Authentication
- **Status:** [ ] Corrigido

**Problema:**  
Todas as rotas protegidas usam apenas `useEffect` para redirecionar. Componentes renderizam brevemente antes do redirect; não há proteção SSR.

**Recomendação:**  
Adicionar `beforeLoad` server-side no TanStack Router para rotas protegidas.

---

### H8 — Tokens de instância Evolution (WhatsApp) enviados ao cliente

- **Arquivo:** `src/lib/super-infra.functions.ts` (linhas 315-316)
- **Categoria:** Sensitive Data Exposure
- **Status:** [ ] Corrigido

**Problema:**  
`getEvolutionStats` retorna `instanceToken` para o browser do super admin. Token roubado (via XSS + H1) expõe credenciais de mensagens WhatsApp de todos os usuários.

**Recomendação:**  
Não retornar tokens de instância ao cliente. Usar o token apenas server-side nas server functions.

---

### H9 — sendEvolutionMessage permite spam massivo de WhatsApp

- **Arquivo:** `src/lib/super-infra.functions.ts` (linhas 388-408)
- **Categoria:** Missing Rate Limiting / Missing Input Validation
- **Status:** [ ] Corrigido

**Problema:**  
Sem rate limiting, validação de formato de telefone ou limite de tamanho de mensagem. Um token de super admin roubado permite envio massivo de WhatsApp a qualquer número.

**Recomendação:**  
Adicionar rate limiting, validar formato E.164 do número de destino, limitar tamanho da mensagem.

---

### H10 — connectMercadoPago aceita token MP arbitrário sem OAuth

- **Arquivo:** `src/lib/payments.functions.ts` (linhas 171-184)
- **Categoria:** Broken Authentication
- **Status:** [ ] Corrigido

**Problema:**  
Qualquer usuário autenticado pode associar qualquer `access_token` MP à sua conta, incluindo tokens roubados, contornando completamente o fluxo OAuth PKCE.

**Recomendação:**  
Remover o endpoint de conexão direta por token. Exigir exclusivamente o fluxo OAuth PKCE.

---

### H11 — Sem rate limiting em validação e envio de reviews

- **Arquivo:** `src/lib/review-tokens.functions.ts` (linhas 29-59)
- **Categoria:** Missing Rate Limiting
- **Status:** [ ] Corrigido

**Problema:**  
Tokens de review UUID podem ser testados por brute-force. Reviews podem ser enviadas sem limite ou CAPTCHA.

**Recomendação:**  
Adicionar rate limiting por IP (ex: 5 tentativas/minuto) e CAPTCHA para envio de reviews públicas.

---

## MEDIO — 15 vulnerabilidades

---

### M1 — theme_color do profissional injetado em CSS sem sanitização

- **Arquivo:** `src/routes/agendar.$slug.tsx` (linhas 126-135)
- **Categoria:** CSS Injection / XSS
- **Status:** [ ] Corrigido

**Problema:**  
`root.style.setProperty("--primary", color)` usa `theme_color` diretamente. Valor malicioso pode quebrar contexto CSS e potencialmente vazar dados via `url()`.

**Recomendação:**  
```typescript
const SAFE_COLOR = /^#[0-9a-fA-F]{6}$|^hsl\(\d+,\s*\d+%,\s*\d+%\)$/;
if (color && SAFE_COLOR.test(color)) {
  root.style.setProperty("--primary", color);
}
```

---

### M2 — socialUrl default retorna https://{handle} não validado

- **Arquivo:** `src/routes/agendar.$slug.tsx` (linhas 215-226)
- **Categoria:** Open Redirect
- **Status:** [ ] Corrigido

**Problema:**  
Redes sociais desconhecidas produzem links `https://<handle>`. Um `handle` como `evil.com` cria link de phishing na página pública do profissional.

**Recomendação:**  
Rejeitar `networks` não reconhecidas no `default` do `switch`.

---

### M3 — accept_online não verificado antes de exibir booking

- **Arquivo:** `src/routes/agendar.$slug.tsx` (linhas 931-946)
- **Categoria:** Missing Authorization
- **Status:** [ ] Corrigido

**Problema:**  
A flag `accept_online` é carregada mas nunca verificada antes de exibir o botão de agendamento.

**Recomendação:**  
Verificar `profile.accept_online` antes de renderizar `BookingSheet`.

---

### M4 — Sessão Supabase persistida em localStorage

- **Arquivo:** `src/integrations/supabase/client.ts` (linhas 8-21)
- **Categoria:** Session Theft Risk
- **Status:** [ ] Corrigido

**Problema:**  
Tokens JWT de usuários ficam em `localStorage`. XSS bem-sucedido pode roubar a sessão.

**Recomendação:**  
Considerar `cookieStorage` com `HttpOnly` para produção.

---

### M5 — Email padrão de super admin hardcoded na tela de login

- **Arquivo:** `src/routes/super/login.tsx` (linha 26)
- **Categoria:** Information Leakage
- **Status:** [ ] Corrigido

**Problema:**  
`useState("admin@suaagenda.pro")` pré-preenche o campo, revelando o email esperado do super admin a qualquer visitante.

**Recomendação:**  
Remover o valor padrão do email; usar campo vazio.

---

### M6 — Webhook Asaas ativa premium sem validar o valor do pagamento

- **Arquivo:** `src/routes/api/webhooks/asaas.ts` (linhas 127-136)
- **Categoria:** Business Logic
- **Status:** [ ] Corrigido

**Problema:**  
Qualquer `PAYMENT_RECEIVED` seta `plan_id = "premium"` sem verificar se o valor corresponde ao plano.

**Recomendação:**  
Verificar `payment.value` contra o valor esperado do plano antes de ativar.

---

### M7 — Ausência de rate limiting em nível de aplicação

- **Arquivo:** `src/server.ts`, `src/routes/api/`
- **Categoria:** Missing Rate Limiting
- **Status:** [ ] Corrigido

**Problema:**  
Nginx tem `limit_req` (burst=40), mas a aplicação não implementa throttling próprio em endpoints críticos.

**Recomendação:**  
Adicionar rate limiting por IP nas server functions de booking público e autenticação.

---

### M8 — Mensagens de erro de banco expostas ao cliente

- **Arquivo:** `src/lib/payments.functions.ts` e múltiplos outros
- **Categoria:** Information Disclosure
- **Status:** [ ] Corrigido

**Problema:**  
Múltiplos `throw new Error(error.message)` propagam detalhes internos do Supabase/Postgres para o browser.

**Recomendação:**  
Logar detalhes server-side; retornar ao cliente apenas mensagens genéricas.

---

### M9 — Funções SECURITY DEFINER sem audit logging

- **Arquivo:** `supabase/migrations/` (múltiplos arquivos)
- **Categoria:** Insufficient Logging
- **Status:** [ ] Corrigido

**Problema:**  
`get_infra_stats()`, `get_available_slots()` e `submit_review_with_token()` executam com privilégios elevados sem registrar quem chamou.

**Recomendação:**  
Adicionar `INSERT` na tabela de auditoria dentro das funções `SECURITY DEFINER`.

---

### M10 — planId não restrito a valores conhecidos em adminChangePlan

- **Arquivo:** `src/lib/super-admin.functions.ts` (linha 147)
- **Categoria:** Broken Access Control
- **Status:** [ ] Corrigido

**Problema:**  
Qualquer string pode ser escrita em `subscriptions.plan_id`, causando inconsistências de billing/entitlement.

**Recomendação:**  
Validar `planId` contra enum de valores permitidos com Zod.

---

### M11 — Audit log do super admin não registra identidade do ator

- **Arquivo:** `src/lib/super-admin.functions.ts` (linhas 137-142)
- **Categoria:** Insufficient Logging
- **Status:** [ ] Corrigido

**Problema:**  
Ações administrativas (suspend, cancel, changePlan) não registram qual super admin as executou. Forense pós-comprometimento prejudicada.

**Recomendação:**  
Incluir `super_admin_email` ou `session_id` no registro de auditoria.

---

### M12 — Containers Docker sem limites de recursos

- **Arquivo:** `docker-compose.yml`, `docker-compose-final.yml`
- **Categoria:** Resource Exhaustion / DoS
- **Status:** [ ] Corrigido

**Problema:**  
Nenhum limite de CPU ou memória definido. Containers podem consumir recursos ilimitados do host.

**Recomendação:**  
Adicionar `deploy.resources.limits` com limites de CPU e memória.

---

### M13 — Credenciais OAuth da Hostinger lidas do filesystem local

- **Arquivo:** `src/lib/super-infra.functions.ts` (linhas 180-194)
- **Categoria:** Sensitive Data Exposure
- **Status:** [ ] Corrigido

**Problema:**  
O código lê `credentials.json` de `APPDATA` ou `HOME` em runtime de produção, podendo usar tokens de ambiente de desenvolvimento errado.

**Recomendação:**  
Usar variáveis de ambiente para credenciais Hostinger em produção.

---

### M14 — back_url do Mercado Pago construída a partir do origin do cliente

- **Arquivo:** `src/lib/public-booking.functions.ts` (linha 367), `src/lib/mp-oauth.server.ts`
- **Categoria:** Open Redirect
- **Status:** [ ] Corrigido

**Problema:**  
O campo `origin` é fornecido pelo cliente e usado para construir URLs de retorno pós-pagamento e redirect URIs OAuth, sem allowlist no servidor.

**Recomendação:**  
Definir `back_urls` e redirect URIs a partir de variável de ambiente do servidor, nunca do cliente.

---

### M15 — PKCE pode ser desabilitado por variável de ambiente

- **Arquivo:** `src/lib/mp-oauth.server.ts` (linhas 87-89)
- **Categoria:** Security Misconfiguration
- **Status:** [ ] Corrigido

**Problema:**  
`MP_PKCE_ENABLED=false` enfraquece o fluxo OAuth contra interceptação de authorization code.

**Recomendação:**  
Remover a opção de desabilitar PKCE. PKCE deve ser obrigatório.

---

## BAIXO — 10 vulnerabilidades

---

### L1 — Telemetria 404 envia URL completa (com tokens) para serviço externo

- **Arquivo:** `src/routes/__root.tsx` (linhas 81-93)
- **Status:** [ ] Corrigido

**Problema:** Query strings com tokens (OAuth state, review tokens) são enviadas ao Lovable error reporting via 404.

**Recomendação:** Sanitizar `pathname`/`search` antes de enviar; remover tokens da URL.

---

### L2 — /avaliar/$token ausente da lista de rotas públicas

- **Arquivo:** `src/routes/__root.tsx` (linha 40)
- **Status:** [ ] Corrigido

**Problema:** Usuários não autenticados são redirecionados ao login ao acessar um link de review, quebrando o fluxo.

**Recomendação:** Adicionar `/avaliar/` ao `isPublicPath` em `__root.tsx`.

---

### L3 — Tags Docker flutuantes e npm@latest

- **Arquivo:** `Dockerfile`, `Dockerfile.dev`
- **Status:** [ ] Corrigido

**Problema:** `node:20-alpine` e `npm@latest` tornam builds não reproduzíveis e vulneráveis a supply chain attacks.

**Recomendação:** Fixar imagens por digest SHA256 e versões exatas.

---

### L4 — Porta 3000 exposta diretamente no host em produção

- **Arquivo:** `docker-compose-final.yml` (linhas 26-36)
- **Status:** [ ] Corrigido

**Problema:** Container de produção bypassa o nginx ao expor a porta diretamente.

**Recomendação:** Restringir bind a `127.0.0.1:3000:3000`.

---

### L5 — Segredos via arquivo .env no Docker Compose

- **Arquivo:** `docker-compose.yml` (linhas 15-18)
- **Status:** [ ] Corrigido

**Problema:** Arquivos `.env` são fáceis de vazar acidentalmente.

**Recomendação:** Usar Docker secrets ou gerenciador de segredos (Vault, Infisical).

---

### L6 — Ausência de headers Permissions-Policy e CORP/COOP

- **Arquivo:** `nginx/sites/suaagendapro.conf`
- **Status:** [ ] Corrigido

**Problema:** `Permissions-Policy`, `Cross-Origin-Embedder-Policy` e `Cross-Origin-Opener-Policy` não estão configurados.

**Recomendação:** Adicionar headers de segurança modernos no nginx.

---

### L7 — Containers Docker rodando como root

- **Arquivo:** `Dockerfile`, `Dockerfile.dev`
- **Status:** [ ] Corrigido

**Problema:** Nenhum Dockerfile cria usuário não-root, ampliando impacto em caso de comprometimento.

**Recomendação:** Adicionar `RUN addgroup -S app && adduser -S app -G app` e `USER app`.

---

### L8 — console.log com PII (emails, telefones) em produção

- **Arquivo:** `src/lib/subscription-notifications.ts` e múltiplos outros
- **Status:** [ ] Corrigido

**Problema:** Logs expõem dados pessoais e fluxos de usuário em produção.

**Recomendação:** Usar logger estruturado com nível configurável; desabilitar logs sensíveis em produção.

---

### L9 — Erro de configuração exposto a chamadores não autenticados

- **Arquivo:** `src/lib/super-auth.server.ts` (linhas 70-72)
- **Status:** [ ] Corrigido

**Problema:** `"Super admin não configurado no servidor."` revela estado interno a qualquer chamador da rota.

**Recomendação:** Retornar apenas `"Unauthorized"` sem detalhes de configuração.

---

### L10 — Sem lockout ou CAPTCHA na autenticação de super admin

- **Arquivo:** `src/routes/super/login.tsx`
- **Status:** [ ] Corrigido

**Problema:** Delay fixo de 800ms insuficiente. Brute force offline contra `SUPER_ADMIN_PASSWORD` é viável.

**Recomendação:** Adicionar lockout progressivo e/ou CAPTCHA no login de super admin.

---

## Plano de Ação — Top 10 Prioridades

| # | Ação | Arquivo | Esforço Estimado |
|:---:|---|---|:---:|
| 1 | Fail-closed nos dois webhooks (C1, C2) | `mp-webhook.ts`, `asaas.ts` | 1h |
| 2 | Remover confirmação PIX auto sem pagamento (C4) | `public-booking-sheet.tsx` | 2h |
| 3 | Validar service/slot/preço server-side em createPublicBooking (C3) | `public-booking.functions.ts` | 4h |
| 4 | Corrigir SSR bypass no super admin (C6) | `super/_app/route.tsx` | 1h |
| 5 | Migrar super token para cookie HttpOnly (H1) | `super-auth.ts` | 4h |
| 6 | Bloquear status 'paid' vindo do cliente (H6) | `payments.functions.ts` | 1h |
| 7 | Remover connectMercadoPago sem OAuth (H10) | `payments.functions.ts` | 2h |
| 8 | Sanitizar theme_color antes de injetar em CSS (M1) | `agendar.$slug.tsx` | 30min |
| 9 | Adicionar /avaliar/ às rotas públicas (L2) | `__root.tsx` | 5min |
| 10 | Remover email padrão no super login (M5) | `super/login.tsx` | 5min |

> **Esforço total estimado:** ~16h para as 10 prioridades

---

## Pontos Positivos

O projeto já implementa corretamente vários controles de segurança:

- `requireSupabaseAuth` com JWT Bearer-only em todos os server fns protegidos
- Comparações timing-safe (`timingSafeEqual`) no super admin e webhook MP
- PKCE implementado conforme RFC 7636 no fluxo OAuth Mercado Pago
- Idempotência no webhook Asaas via `billing_events.asaas_event_id`
- Zod validation em quase todos os server functions autenticados
- `supabaseAdmin` importado apenas em módulos `.server.ts` com warnings explícitos
- Webhook MP com verificação HMAC quando `MP_WEBHOOK_SECRET` está configurado
- Sem SQL Injection — uso consistente do cliente Supabase parametrizado

---

*Para marcar uma vulnerabilidade como corrigida, substitua `[ ]` por `[x]` na linha de Status de cada item.*
