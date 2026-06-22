# ETAPA 02 — Autenticação e Onboarding

**Status:** 🟢 Concluído (2026-06-21)  
**Prioridade:** CRÍTICA  
**Estimativa:** 2–3 dias  
**Dependências:** Etapa 01 (banco de dados)

---

## Contexto

As páginas `/login`, `/cadastro` e `/onboarding` existem com UI mockada. A lógica de autenticação está conectada ao Supabase Auth mas sem guards de rota, redirecionamentos corretos, ou persistência de perfil. O onboarding não salva nada no banco.

---

## Objetivo

Implementar autenticação completa com Supabase Auth, proteger rotas autenticadas, criar o fluxo de onboarding que salva perfil + serviços + horários no banco, e garantir que o profissional chegue ao dashboard após o cadastro.

---

## Fluxo Completo a Implementar

```
/cadastro
  → Supabase signUp (email + senha)
  → Trigger cria profile automaticamente
  → Redireciona para /onboarding

/onboarding (3 passos)
  Passo 1: Dados do studio (nome, cidade, especialidade, telefone, slug)
  Passo 2: Tipo de serviço (nicho)
  Passo 3: Primeiro serviço (nome, preço, duração)
  → Salva profile, service e working_hours padrão
  → Redireciona para /dashboard

/login
  → Supabase signInWithPassword
  → Se onboarding não completo → /onboarding
  → Se onboarding completo → /dashboard

/dashboard, /app, etc.
  → Guard: se não autenticado → /login
```

---

## Checklist de Execução

### Auth Guards (Middleware de Rotas)
- [ ] Criar `src/lib/auth.ts` com helpers de auth
- [ ] Criar hook `useAuth()` em `src/hooks/useAuth.ts`
  - [ ] `user`, `session`, `isLoading`
  - [ ] `signIn(email, password)`
  - [ ] `signUp(email, password, name)`
  - [ ] `signOut()`
- [ ] Criar `src/integrations/supabase/auth-middleware.ts` (já existe, revisar)
- [ ] Adicionar loader em `__root.tsx` para verificar sessão
- [ ] Rota protegida: redirecionar `/dashboard` → `/login` se não autenticado
- [ ] Rota pública: redirecionar `/login` → `/dashboard` se já autenticado

### Página de Login (`/login`)
- [ ] Conectar form ao `supabase.auth.signInWithPassword()`
- [ ] Exibir erro se credenciais inválidas
- [ ] Loading state durante autenticação
- [ ] Link "Esqueci minha senha" → modal de reset
- [ ] Redirecionar para `/dashboard` após login
- [ ] Persistir sessão via localStorage

### Página de Cadastro (`/cadastro`)
- [ ] Validação Zod: email válido, senha mín. 8 chars, nome obrigatório
- [ ] Conectar ao `supabase.auth.signUp()`
- [ ] Tratamento de email já cadastrado
- [ ] Loading state
- [ ] Após cadastro → redirecionar para `/onboarding`

### Fluxo de Onboarding (`/onboarding`)
- [ ] Passo 1 — Dados do Studio:
  - [ ] Nome do studio/profissional
  - [ ] Telefone (WhatsApp)
  - [ ] Cidade + Estado
  - [ ] Especialidade (Select: cabelo, unhas, estética, etc.)
  - [ ] Slug (gerado automaticamente, editável, validado como único no banco)
  - [ ] Salvar em `profiles`
- [ ] Passo 2 — Nicho:
  - [ ] Cards visuais de nicho (manicure, cabeleireiro, esteticista, etc.)
  - [ ] Salvar em `profiles.specialty`
- [ ] Passo 3 — Primeiro Serviço:
  - [ ] Nome do serviço
  - [ ] Preço (R$)
  - [ ] Duração (30min, 45min, 1h, 1h30, 2h)
  - [ ] Valor do depósito (50%, 100%, ou valor fixo)
  - [ ] Salvar em `services`
  - [ ] Salvar horários padrão em `working_hours` (seg–sex 9h–18h)
- [ ] Marcar `profiles.onboarding_completed = true`
- [ ] Redirecionar para `/dashboard`
- [ ] Barra de progresso visual (1/3, 2/3, 3/3)
- [ ] Botão "Voltar" entre passos

### Reset de Senha
- [ ] Modal de "Esqueci minha senha"
- [ ] Chamar `supabase.auth.resetPasswordForEmail()`
- [ ] Página `/reset-password` para confirmar nova senha
- [ ] Verificar token de reset via URL params

### Validações
- [ ] Slug único: checar na tabela `profiles` antes de salvar
- [ ] Slug formato: apenas letras minúsculas, números e hífens
- [ ] Email: formato válido
- [ ] Senha: mínimo 8 caracteres, 1 maiúscula, 1 número

### UX / Estado
- [ ] Toast de sucesso após login
- [ ] Toast de sucesso após onboarding concluído
- [ ] Spinner durante carregamentos
- [ ] Mensagens de erro claras em português

### Testes Manuais
- [ ] Cadastrar novo usuário
- [ ] Confirmar que profile foi criado automaticamente
- [ ] Completar onboarding (3 passos)
- [ ] Verificar dados no Supabase Studio
- [ ] Fazer logout e login novamente
- [ ] Verificar que rota protegida redireciona para login
- [ ] Testar reset de senha

---

## Arquivos a Criar/Editar

```
src/hooks/useAuth.ts                    ← CRIAR
src/lib/auth.ts                         ← CRIAR
src/routes/login.tsx                    ← EDITAR (conectar ao Supabase)
src/routes/cadastro.tsx                 ← EDITAR (conectar ao Supabase)
src/routes/onboarding.tsx               ← EDITAR (implementar 3 passos reais)
src/routes/__root.tsx                   ← EDITAR (loader de sessão + guards)
src/routes/reset-password.tsx           ← CRIAR
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Cadastro cria usuário + profile no banco
- Onboarding salva todos os dados nos 3 passos
- Login funciona e redireciona corretamente
- Rotas protegidas bloqueiam acesso sem auth
- Reset de senha funciona via email
