# 🧠 MEMÓRIA DO PROJETO - SuaAgenda.Pro

## Contexto Geral

**SuaAgenda.Pro** é um sistema de agendamento para profissionais autônomos da beleza (manicure, cabelo, estética, etc.) no Brasil.

- **Stack:** React 19 + TypeScript + Tailwind CSS + TanStack Start
- **Deployment:** Docker + VPS
- **Tipo:** PWA (Web App Instalável)
- **28 páginas** já implementadas
- **Componentes:** 25+ reutilizáveis (Radix UI + Tailwind)

---

## 👨‍💼 Sobre o Desenvolvedor

- **Experiência:** PHP/Laravel
- **Novo em:** React, TypeScript, Frontend
- **Aprendendo:** React, TanStack, Tailwind
- **Necessidade:** Documentação clara e passo-a-passo

---

## 🎯 Projeto

### Objetivo

Criar plataforma de agendamento premium que permita:
- Profissionais criar perfil e receber agendamentos
- Clientes agendar serviços via link público
- Pagamentos via Mercado Pago
- Integração WhatsApp (confirmações automáticas)
- Integração Google Calendar (sincronização)

### Status

✅ **Pronto:**
- React setup completo
- Design system finalizado
- 28 páginas criadas
- Componentes reutilizáveis
- Docker pronto
- PWA configurado

🚧 **Em desenvolvimento:**
- Lógica de negócio
- Integrações (APIs)
- Testes

### Tamanho

- **28 páginas**
- **25+ componentes**
- **4000+ linhas de código**

---

## 🏗️ Arquitetura Decidida

### Frontend

```
React 19 (latest)
├── TypeScript (strict mode OBRIGATÓRIO)
├── TanStack Start (meta-framework)
├── Tailwind CSS 4.2
├── Radix UI (15+ componentes base)
├── Framer Motion (animações)
├── React Hook Form + Zod (formulários)
└── Vite (build)
```

### Backend

```
Nitro (Node.js server)
├── Supabase (PostgreSQL)
├── Auth (Supabase)
├── Database (Supabase RLS)
└── Real-time (Supabase subscriptions)
```

### Deployment

```
Docker Multi-stage
├── Dev: Dockerfile.dev (hot reload)
├── Prod: Dockerfile (otimizado)
└── Docker Compose (orquestração)
```

### PWA

```
Manifest.json
├── Install prompt
├── Icons 192x512
├── Service Worker (offline)
├── Push notifications
└── Background sync
```

---

## 🎨 Design System (Locked)

### Cores

```
Primária:    #ec4899 (Rosa)
Secundária:  #9b5b9f (Roxo)
Success:     #10b981 (Verde)
Warning:     #f59e0b (Laranja)
Destructive: #ef4444 (Vermelho)

Fundo:       #ffffff
Texto:       #1f1230
Border:      #f3e8ee
Muted:       #f7f4f8
```

### Tipografia

```
Display: Playfair Display (headings)
Corpo:   Inter (text, UI)
```

### Spacing (8px grid)

```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px
```

---

## 📱 Páginas (28)

### Públicas
- `/` (landing)
- `/login` (login)
- `/cadastro` (register)
- `/perfil-publico/:slug` (profile)
- `/agendar/:slug` (booking)
- `/precos` (prices)
- `/contato` (contact)
- `/recursos` (features)

### Autenticadas (20)
- `/dashboard` (KPIs)
- `/app` (agenda)
- `/clientes` (CRM)
- `/servicos` (services)
- `/horarios` (hours)
- `/pagamentos` (payments)
- `/notificacoes` (notifications)
- `/portfolio` (gallery)
- `/perfil-profissional` (profile edit)
- `/personalizacao` (themes)
- `/google-calendar` (integration)
- `/whatsapp` (integration)
- `/transacoes` (transactions)
- `/onboarding` (tutorial)
- ... (6 mais)

---

## 🔧 Componentes Disponíveis

Todos em `src/components/ui/`:

```
button.tsx            - 6 variantes
input.tsx             - Com validação
textarea.tsx          - Multi-line
select.tsx            - Dropdown
form.tsx              - React Hook Form
card.tsx              - Container
dialog.tsx            - Modal
tabs.tsx              - Tab navigation
checkbox.tsx          - Checkbox
radio-group.tsx       - Radio
badge.tsx             - Status
avatar.tsx            - Profile pics
... (13 mais)
```

### Padrão

```typescript
// Todos os componentes:
- Têm TypeScript types
- Usam Tailwind (sem inline styles)
- Suportam className customizado
- Exportados via index.ts (barrel)
- Exemplo em storybook (futura)
```

---

## 📂 Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── ui/           # 25+ componentes base (Radix UI + Tailwind)
│   └── layout/       # Layouts estruturais
├── routes/           # 28 páginas (TanStack Router)
├── lib/              # Utilitários
├── hooks/            # Custom hooks
├── integrations/     # APIs externas
├── styles/           # CSS global
├── types/            # TypeScript types
└── main.tsx          # Entrada

public/
├── manifest.json     # PWA
├── sw.js            # Service Worker
└── icons/           # PWA icons

docs/
├── ESPECIFICACOES.md # Specs completas
├── MEMORIA.md        # Este arquivo
├── REGRAS.md         # Regras rígidas
└── SETUP.md          # Como começar
```

---

## 🚀 Stack de Desenvolvimento

### Ferramentas

```
Node 20+
npm (ou bun)
Git
Docker (recomendado)
VS Code (com Cursor)
```

### Scripts Principais

```bash
npm run dev              # Desenvolvimento
npm run build            # Build produção
npm run preview          # Preview build
npm run type-check       # TypeScript
npm run lint             # ESLint
npm run format           # Prettier

# Docker
npm run docker:dev       # Docker dev
npm run docker:prod      # Docker prod
npm run docker:build     # Docker build

# Automação
npm run maestro:all      # Sync 28 páginas
npm run extract:pages    # Extrair pages
npm run replicate:pages  # Replicar pages
```

---

## 🔐 Dados Importantes

### Cores Exatas (NUNCA MUDAR)

```
Primária:  #ec4899
Rosa luz:  #f472b6
Rosa claro: #fdf2f8
Secundária: #9b5b9f
```

### Fontes

```
Display: Playfair Display (Google Fonts)
Corpo: Inter (Google Fonts)
```

### Breakpoints Tailwind

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 📋 Regras OBRIGATÓRIAS

Veja `REGRAS.md` para lista completa.

### Top 10

1. ✅ **TypeScript strict** - Nunca `any`
2. ✅ **Componentes reutilizáveis** - Sempre
3. ✅ **Tailwind classes** - Nunca inline styles
4. ✅ **Imports do index.ts** - Barrel exports
5. ✅ **Nomes claros** - Sem abreviações
6. ✅ **PWA sempre funcional** - Sem quebra
7. ✅ **Types em tudo** - Props, returns
8. ✅ **Sem console.log** - Em produção
9. ✅ **Commits semânticos** - feat, fix, chore
10. ✅ **Testes before push** - npm run build

---

## 🔄 Fluxos Principais

### Onboarding (Profissional)

```
1. Abre /cadastro
2. Preenche formulário
3. Valida email
4. Vai para /onboarding
5. Cria serviços em /servicos
6. Configura horários em /horarios
7. Seta depósito/preços em /personalizacao
8. (Opcional) Integra Google Calendar
9. (Opcional) Configura WhatsApp
10. Ativado! Pode receber agendamentos
```

### Agendamento (Cliente)

```
1. Acessa /agendar/seu-slug
2. Vê perfil e serviços
3. Escolhe serviço
4. Marca data/hora
5. Preenche dados (nome, email, telefone)
6. Paga via Mercado Pago
7. Recebe confirmação WhatsApp
8. Profissional vê em /dashboard
```

---

## 🌐 APIs Integradas

### Supabase (Database + Auth)

```typescript
- Autenticação via email/senha
- Database PostgreSQL
- RLS (segurança)
- Real-time subscriptions
```

### Mercado Pago (Pagamentos)

```typescript
- Crédito/débito
- Pix
- Boleto
- Webhook para confirmações
```

### Google Calendar (Opcional)

```typescript
- OAuth2 integration
- Sincronização duas vias
- Calendário de disponibilidade
```

### WhatsApp (Evolution Go)

```typescript
- Confirmações automáticas
- Lembretes
- Mensagens personalizadas
- Instalado em VPS própria
```

---

## 📊 Banco de Dados

### Tabelas Principais (Supabase)

```
users              - Profissionais + Clientes
profiles           - Dados adicionais
services           - Serviços oferecidos
appointments       - Agendamentos
transactions       - Pagamentos
notifications      - Notificações
```

### RLS (Row Level Security)

```
- Usuários veem só seus dados
- Profissionais veem seus clientes
- Clientes veem agendamentos deles
```

---

## 🐳 Docker

### Ambiente Dev

```bash
docker-compose up dev
# Porta 8080
# Hot reload ativo
# Volume compartilhado
```

### Ambiente Prod

```bash
docker-compose up prod
# Porta 3000
# Otimizado
# Serve estático
```

### Build

```bash
docker build -t suaagenda:latest .
docker run -p 3000:3000 suaagenda:latest
```

---

## 🔗 Referências Importantes

- **Repo Git:** https://github.com/StudioZERO21/rose-schedule-chic
- **Design ref:** GlowBook Agenda
- **Docs:** /docs/ (no projeto)
- **Regras:** REGRAS.md
- **Specs:** ESPECIFICACOES.md

---

## 📝 Anotações

### Decisões Tomadas

- ✅ React (não Vue/Angular) - Comunidade grande
- ✅ Tailwind (não CSS Modules) - Velocidade
- ✅ Supabase (não Firebase) - Mais controle
- ✅ Docker (não VM) - Leveza
- ✅ PWA (não Electron) - Web-first

### Problemas Conhecidos

- Nenhum crítico no momento
- TypeScript strict pode ser desafiador (mas é bom!)
- Evolution Go precisa VPS própria

### Melhorias Futuras

- Admin portal (monitorar profissionais)
- Analytics dashboard
- A/B testing
- Mobile app nativa (React Native)
- Inteligência artificial (recomendações)

---

## 🎓 Para Quem Vem de Laravel

### Comparações

```
Laravel                     React/TS
├── Rotas em routes/       → Rotas em src/routes/
├── Blade templates        → JSX components
├── Migrations             → Supabase migrations
├── Eloquent ORM           → Supabase client
├── Controller actions     → React components
├── Validation rules       → Zod schemas
├── Middleware             → React context
├── .env file              → .env.local
└── Artisan commands       → npm scripts
```

### Mentalidade

```
Laravel:                React:
Model → View → Controller    Component → State → Render

Stateless                 Stateful (useState)
Sync requests             Async (fetch/API)
Template rendering        Dynamic rendering
Backend validation        Frontend + Backend
```

---

## 🎯 Checklist Desenvolvedor

Antes de fazer qualquer código:

- [ ] Leu REGRAS.md?
- [ ] Leu ESPECIFICACOES.md?
- [ ] Entendeu a estrutura?
- [ ] Testou npm run dev?
- [ ] Viu as 28 páginas?
- [ ] Explorou src/components/?
- [ ] Rodou npm run maestro:all?

---

**Memória do Projeto | SuaAgenda.Pro**

*Última atualização: June 2026*

*Este arquivo deve ser atualizado com cada decisão importante.*
