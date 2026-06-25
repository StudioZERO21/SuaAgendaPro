# RELATÓRIO DE ANÁLISE DE SEGURANÇA — suaAgendaPro

**Data**: 24/06/2026
**Escopo**: Análise completa do código-fonte (frontend, backend, infraestrutura, banco de dados)
**Metodologia**: Revisão manual + análise automatizada de todos os arquivos do projeto

---

## 🔴 CRÍTICO (3 vulnerabilidades)

### C1. Webhook Mercado Pago sem validação obrigatória de assinatura
- **Arquivo**: `src/routes/api/public/mp-webhook.ts` (linhas 33-47)
- **Tipo**: Broken Authentication / Webhook Spoofing
- **Descrição**: O webhook só valida a assinatura HMAC quando `MP_WEBHOOK_SECRET` está configurada. Se a variável de ambiente estiver ausente, QUALQUER pessoa pode enviar POST com payload forjado e marcar pagamentos como "paid", confirmar agendamentos indevidamente e manipular o fluxo financeiro.
- **Recomendação**: Falhar fechado (fail-closed) — se o segredo não estiver configurado, rejeitar TODAS as requisições com 500. Exigir validação de assinatura em todos os ambientes.

### C2. Criação de agendamentos públicos sem validação de propriedade (IDOR)
- **Arquivo**: `src/lib/public-booking.functions.ts` (linhas 172-230, 306-364)
- **Tipo**: Broken Access Control / IDOR
- **Descrição**: As funções `createPublicBooking` e `createMpPreferenceAndBooking` aceitam `professionalId` e `serviceId` fornecidos pelo cliente e usam `supabaseAdmin` (service_role, bypass de RLS) para inserir agendamentos e clientes. NÃO validam se o serviço pertence ao profissional, se o profissional aceita booking online, ou se o slot está realmente disponível. Um atacante pode forjar agendamentos para qualquer profissional.
- **Recomendação**: Adicionar validação server-side: verificar se `service_id` pertence ao `professional_id`, se `accept_online = true`, e se o slot está disponível via `get_available_slots` ANTES de criar o agendamento.

### C3. Exposição de access_token do Mercado Pago via iteração de secrets
- **Arquivo**: `src/routes/api/public/mp-webhook.ts` (linhas 68-82)
- **Tipo**: Sensitive Data Exposure
- **Descrição**: O webhook itera sobre TODOS os registros de `mercado_pago_account_secrets` (incluindo `access_token`) e testa cada token contra a API do Mercado Pago para encontrar o dono do pagamento. Isso significa que o código carrega todos os tokens em memória e os utiliza em requisições externas. Um vazamento de log ou erro poderia expor múltiplos tokens.
- **Recomendação**: Indexar pagamentos por `user_id` ou usar o `external_reference` (appointment_id) para fazer lookup reverso sem precisar iterar todos os tokens.

---

## 🟠 ALTO (6 vulnerabilidades)

### H1. Token de super admin em localStorage + cookie não-HttpOnly
- **Arquivo**: `src/lib/super-auth.ts` (linhas 5-20)
- **Tipo**: Broken Authentication / Token Exposure
- **Descrição**: O token de super admin é armazenado em `localStorage` (acessível por qualquer script) e também em cookie JavaScript sem flags `HttpOnly` ou `Secure`. Qualquer XSS no domínio permite roubo do token e escalação para privilégios de super admin.
- **Recomendação**: Migrar para sessões server-side com cookies `HttpOnly; Secure; SameSite=Strict`. Remover armazenamento em localStorage.

### H2. Stored XSS via preview de templates HTML no super admin
- **Arquivo**: `src/routes/super/_app/templates.tsx` (linhas 256-264)
- **Tipo**: Stored Cross-Site Scripting (XSS)
- **Descrição**: O preview de templates renderiza HTML arbitrário via `dangerouslySetInnerHTML` sem sanitização. Um template malicioso salvo no banco pode executar JavaScript no navegador do super admin, potencialmente roubando o token de super admin.
- **Recomendação**: Sanitizar HTML com DOMPurify antes de renderizar no preview. Remover `dangerouslySetInnerHTML` ou usar um sandbox iframe.

### H3. CSP permite 'unsafe-inline' para scripts e styles
- **Arquivo**: `nginx/sites/suaagendapro.conf` (linhas 7-9)
- **Tipo**: Security Misconfiguration / Weak CSP
- **Descrição**: A política de Content-Security-Policy inclui `'unsafe-inline'` para scripts e styles, anulando grande parte da proteção contra XSS. Qualquer injeção de script terá permissão para executar.
- **Recomendação**: Remover `'unsafe-inline'`, usar nonces ou hashes para estilos/scripts inline legítimos, ou mover estilos para arquivos externos.

### H4. Service Worker com cache indiscriminado de respostas GET
- **Arquivo**: `sw.js` (linhas 57-93)
- **Tipo**: Sensitive Data Caching / Cache Poisoning
- **Descrição**: O service worker faz cache-first de QUALQUER resposta GET bem-sucedida do mesmo domínio, sem filtrar endpoints de API, dados autenticados ou informações sensíveis. Dados de agendamentos, perfis e tokens podem ser cacheados e servidos offline, expondo informações privadas.
- **Recomendação**: Restringir cache a assets estáticos (CSS, JS, imagens, fontes). NÃO cachear respostas de API, endpoints autenticados, ou requisições com cookies/Authorization headers.

### H5. RLS policy permite inserção pública irrestrita em appointments
- **Arquivo**: `supabase/migrations/20260621150003_etapa01_clients_appointments.sql` (linhas 88-90)
- **Tipo**: Broken Access Control
- **Descrição**: A policy `appointments_insert_public` permite que usuários anônimos insiram em `appointments` com `WITH CHECK (true)` — sem restrição alguma. Embora o fluxo principal use server functions, um atacante que obtenha a chave anon/public do Supabase pode inserir agendamentos diretamente.
- **Recomendação**: Restringir a policy com condições adequadas ou remover o grant `INSERT` para `anon` e forçar todo agendamento público a passar pelas server functions.

### H6. Captura silenciosa de erros no webhook MP
- **Arquivo**: `src/routes/api/public/mp-webhook.ts` (linha 33)
- **Tipo**: Security Misconfiguration / Error Handling
- **Descrição**: O bloco `try {} catch {}` vazio no final do handler do webhook suprime todos os erros silenciosamente. Falhas de segurança, tentativas de ataque e erros de processamento são descartados sem logging ou alerta.
- **Recomendação**: Adicionar logging de erro estruturado no catch e alertas para falhas repetidas.

---

## 🟡 MÉDIO (8 vulnerabilidades)

### M1. Sessão Supabase em localStorage (acessível via XSS)
- **Arquivo**: `src/integrations/supabase/client.ts` (linhas 8-21)
- **Tipo**: Session Theft via XSS
- **Descrição**: O cliente Supabase persiste tokens de autenticação em `localStorage`. Um XSS bem-sucedido pode roubar o token JWT e impersonar o usuário.
- **Recomendação**: Considerar server-side sessions ou cookies HttpOnly para produção.

### M2. Containers Docker rodando como root
- **Arquivos**: `Dockerfile`, `Dockerfile-final`, `Dockerfile.dev`, `Dockerfile.dev-final`
- **Tipo**: Privilege Escalation / Weak Container Isolation
- **Descrição**: Nenhum Dockerfile cria usuário não-root. Em caso de comprometimento da aplicação, o atacante obtém root dentro do container.
- **Recomendação**: Adicionar `RUN addgroup -S app && adduser -S app -G app`, `USER app` e `COPY --chown=app:app`.

### M3. Ausência de rate limiting na aplicação
- **Arquivos**: `src/server.ts`, `src/routes/api/`
- **Tipo**: Missing Rate Limiting
- **Descrição**: Não há rate limiting em nível de aplicação para endpoints críticos como booking público, webhooks, ou autenticação. O nginx tem `limit_req zone=global burst=40`, mas a aplicação em si não implementa throttling.
- **Recomendação**: Adicionar rate limiting nas server functions de booking (máx. 5 agendamentos/minuto por IP) e nos endpoints de autenticação.

### M4. Exposição de erros detalhados no cliente
- **Arquivo**: `src/lib/public-booking.functions.ts` (linha 13)
- **Tipo**: Information Disclosure
- **Descrição**: `console.error("[getPublicProfile]", error.message)` no lado do cliente pode expor detalhes do banco de dados em produção. Múltiplos `console.error` e `console.warn` espalhados pelo código podem vazar informações sensíveis.
- **Recomendação**: Substituir `console.*` em produção por logger estruturado com níveis configuráveis. Nunca logar mensagens de erro do banco no cliente.

### M5. SECURITY DEFINER functions sem audit logging
- **Arquivos**: `supabase/migrations/20260621150003_etapa01_clients_appointments.sql` (linha 127), `20260621150005_etapa01_available_slots.sql` (linha 77), `20260624000001_super_infra_stats_fn.sql`
- **Tipo**: Insufficient Logging & Monitoring
- **Descrição**: Funções com `SECURITY DEFINER` executam com privilégios elevados mas não possuem logging de auditoria. A função `get_infra_stats()` acessa `auth.users` e `pg_stat_*` com SECURITY DEFINER mas sem registro de quem chamou.
- **Recomendação**: Adicionar logging de auditoria nas funções SECURITY DEFINER (quem chamou, quando, com quais parâmetros).

### M6. Política RLS permissiva para leitura de appointments por anon
- **Arquivo**: `supabase/migrations/20260621150003_etapa01_clients_appointments.sql` (linhas 93-95)
- **Tipo**: Information Disclosure
- **Descrição**: A policy `appointments_select_availability` permite que anônimos leiam TODOS os campos de appointments (exceto cancelados/no_show). Isso inclui `client_id`, `notes`, `price_cents` e outros campos que não deveriam ser públicos.
- **Recomendação**: Restringir SELECT para anon apenas a `professional_id`, `scheduled_at`, `duration_minutes` e `status` — campos estritamente necessários para verificar disponibilidade.

### M7. Falta de validação de origem no webhook Asaas
- **Arquivo**: `src/routes/api/webhooks/asaas.ts` (linhas 38-44)
- **Tipo**: Insufficient Origin Validation
- **Descrição**: O webhook do Asaas valida apenas um token estático (`ASAAS_WEBHOOK_TOKEN`). Se o token for vazado, não há validação adicional como IP whitelist ou verificação de origem.
- **Recomendação**: Adicionar IP whitelist para os IPs do Asaas e/ou validação de assinatura HMAC se disponível na API.

### M8. Ausência de limites de recursos nos containers Docker Compose
- **Arquivos**: `docker-compose.yml`, `docker-compose-final.yml`
- **Tipo**: Resource Exhaustion / DoS
- **Descrição**: Nenhum limite de CPU ou memória definido. Containers podem consumir recursos ilimitados do host.
- **Recomendação**: Adicionar `deploy.resources.limits` com limites de CPU e memória para cada serviço.

---

## 🟢 BAIXO (5 vulnerabilidades)

### L1. Tags de imagem Docker flutuantes
- **Arquivos**: `Dockerfile`, `Dockerfile-final`, `Dockerfile.dev`, `Dockerfile.dev-final`
- **Tipo**: Supply Chain / Image Drift
- **Descrição**: Uso de tags como `node:20-alpine` e `npm@latest` tornam builds não reproduzíveis.
- **Recomendação**: Fixar imagens por digest SHA256 e versões exatas de pacotes.

### L2. Produção expõe porta 3000 diretamente
- **Arquivo**: `docker-compose-final.yml` (linhas 26-36)
- **Tipo**: Insecure Service Exposure
- **Descrição**: Container de produção mapeia porta 3000 diretamente no host, bypassando o reverse proxy nginx.
- **Recomendação**: Remover exposição direta de porta ou restringir bind a `127.0.0.1:3000:3000`.

### L3. Segredos via arquivo .env no Docker Compose
- **Arquivos**: `docker-compose.yml` (linhas 15-18)
- **Tipo**: Secret Management Weakness
- **Descrição**: Uso de `env_file: .env.production` — arquivos .env são fáceis de vazar acidentalmente.
- **Recomendação**: Usar Docker secrets ou um gerenciador de segredos (Vault, Infisical).

### L4. Ausência de headers de segurança adicionais
- **Arquivo**: `nginx/sites/suaagendapro.conf`
- **Tipo**: Missing Security Headers
- **Descrição**: Headers como `Permissions-Policy` e `Cross-Origin-Embedder-Policy` não estão configurados.
- **Recomendação**: Adicionar headers de segurança adicionais: `Permissions-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`.

### L5. console.log de dados de usuário em produção
- **Arquivos**: `src/lib/subscription-notifications.ts` (linhas 15-36), múltiplos arquivos
- **Tipo**: Information Disclosure
- **Descrição**: Diversos `console.log` expõem emails, telefones e ações de usuários nos logs de produção.
- **Recomendação**: Remover ou colocar atrás de flag de debug; usar logger estruturado com níveis.

---

## 📊 RESUMO POR CATEGORIA

| Categoria | Crítico | Alto | Médio | Baixo | Total |
|-----------|:------:|:----:|:-----:|:-----:|:-----:|
| Broken Access Control | 1 | 1 | 2 | 0 | 4 |
| Broken Authentication | 1 | 1 | 0 | 0 | 2 |
| Sensitive Data Exposure | 1 | 1 | 2 | 1 | 5 |
| XSS / Injection | 0 | 2 | 0 | 0 | 2 |
| Security Misconfiguration | 0 | 2 | 3 | 3 | 8 |
| Insufficient Logging | 0 | 0 | 1 | 1 | 2 |
| **TOTAL** | **3** | **7** | **8** | **5** | **23** |

