# 📋 ESPECIFICAÇÕES DO PROJETO - SuaAgenda.Pro

## 🎯 VISÃO GERAL

**SuaAgenda.Pro** é um sistema web de agendamento premium para profissionais autônomos da beleza e bem-estar (manicure, cabelo, estética, etc.).

- **Stack:** React 19 + TypeScript + Tailwind CSS + TanStack Start
- **Deployment:** Docker + VPS
- **Tipo:** PWA (Web App Instalável)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Pagamentos:** Mercado Pago
- **WhatsApp:** Evolution Go (self-hosted)

---

## 🏗️ ARQUITETURA

### Stack Técnico Confirmado

```
Frontend:
├── React 19.2.0
├── TypeScript 5.8.3 (strict mode obrigatório)
├── Tailwind CSS 4.2.1
├── TanStack Start (React Router v1)
├── Framer Motion 12.40.0
├── Radix UI (15+ componentes)
├── React Hook Form 7.71
├── Zod 3.24 (validação)
└── Vite 8.0 (build)

Backend:
├── Nitro 3.0
├── Supabase (PostgreSQL)
└── APIs externas

Deployment:
├── Docker (multi-stage)
├── Docker Compose
├── VPS (sua escolha)
└── CI/CD (GitHub Actions - futura)
```

### Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                  # 25+ componentes reutilizáveis
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   └── ... (20 mais)
│   ├── layout/             # Layouts estruturais
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── bottom-nav.tsx
│   │   └── main-layout.tsx
│   └── index.ts            # Barrel exports
│
├── routes/                 # 28 páginas (TanStack Router)
│   ├── __root.tsx         # Root layout
│   ├── index.tsx          # Landing page
│   ├── dashboard.tsx      # Dashboard profissional
│   ├── app.tsx            # Agenda principal
│   ├── login.tsx
│   ├── cadastro.tsx
│   ├── clientes.tsx
│   ├── servicos.tsx
│   ├── pagamentos.tsx
│   ├── perfil-publico.tsx # Link público para agendamento
│   ├── perfil-profissional.tsx
│   ├── agendar.$slug.tsx  # Página pública de agendamento
│   └── ... (18 mais)
│
├── lib/
│   ├── utils.ts           # Helpers (cn, formatters)
│   └── api.ts             # Chamadas API
│
├── hooks/
│   ├── useAuth.ts
│   ├── useAgendamentos.ts
│   ├── useClientes.ts
│   └── ... (custom hooks)
│
├── integrations/
│   ├── whatsapp.ts       # Evolution Go
│   ├── mercado-pago.ts   # Pagamentos
│   ├── google-calendar.ts # Google Calendar
│   └── supabase.ts       # Database
│
├── styles/
│   ├── globals.css       # Estilos globais
│   ├── variables.css     # CSS custom properties
│   ├── animations.css    # Animações
│   └── tailwind.config.ts
│
├── types/
│   ├── index.ts
│   ├── components.ts
│   ├── api.ts
│   └── database.ts
│
└── main.tsx              # Entrada da aplicação

public/
├── manifest.json         # PWA
├── sw.js                 # Service Worker
├── icon-192.png          # PWA icons
├── icon-512.png
└── favicon.svg

docs/
├── ESPECIFICACOES.md     # Este arquivo
├── MEMORIA.md            # Contexto do projeto
├── SETUP.md              # Setup inicial
├── ARQUITETURA.md        # Decisões arquiteturais
└── REGRAS.md             # Regras rígidas
```

---

## 🎨 DESIGN SYSTEM

### Cores (Tailwind + Custom Properties)

```css
/* Primária */
--primary: #ec4899              /* Rosa forte */
--primary-glow: #f472b6         /* Rosa clara */
--primary-light: #fdf2f8        /* Rosa muito clara */

/* Secundária */
--secondary: #9b5b9f            /* Roxo */

/* Funcionais */
--success: #10b981              /* Verde */
--warning: #f59e0b              /* Laranja */
--destructive: #ef4444          /* Vermelho */
--info: #3b82f6                 /* Azul */

/* Neutros */
--background: #ffffff
--foreground: #1f1230
--muted: #f7f4f8
--border: #f3e8ee

/* Gradientes */
--gradient-primary: linear-gradient(135deg, #ec4899 0%, #d946ef 100%)
--gradient-soft: linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #fae8ff 100%)
```

### Tipografia

- **Display:** Playfair Display (headings)
- **Corpo:** Inter (text, UI)
- **Weights:** 400, 500, 600, 700

### Espaçamento (8px grid)

```
xs: 4px   | sm: 8px  | md: 16px  | lg: 24px
xl: 32px  | 2xl: 48px | 3xl: 64px
```

### Componentes Principais

Todos os componentes estão em `src/components/ui/`:
- Button (6 variantes: default, secondary, destructive, outline, ghost, link)
- Input (com validação)
- Card (com hover states)
- Form + FormField (validação Zod)
- Dialog/Modal
- Tabs
- Sidebar
- Select
- Checkbox
- RadioGroup
- Badge
- Avatar
- ... (15+ mais)

---

## 📱 PWA (Web App Instalável)

### Configuração Obrigatória

1. **manifest.json** - Metadados da app
2. **Service Worker** (public/sw.js) - Funciona offline
3. **Icons** - 192x192 e 512x512
4. **Meta tags** - Em index.html

### Funcionalidades

- ✅ Instalável (Chrome, Firefox, Edge, Safari)
- ✅ Funciona offline
- ✅ Push notifications prontas
- ✅ Background sync
- ✅ Tela de splash

### Teste

```bash
npm run dev
# Chrome DevTools → Application → Manifest
# Deve mostrar "Install app" button
```

---

## 🔐 SEGURANÇA & AUTENTICAÇÃO

### Supabase Auth

```typescript
// Login
const { user, session } = await supabaseClient.auth.signInWithPassword({
  email,
  password
});

// Register
const { user } = await supabaseClient.auth.signUp({
  email,
  password,
  options: { data: { role: 'professional' } }
});

// JWT automático em headers
```

### TypeScript Strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 📊 PÁGINAS (28 no total)

### Públicas (Sem login)

| Página | Rota | Descrição |
|--------|------|-----------|
| Landing | `/` | Homepage |
| Login | `/login` | Autenticação |
| Cadastro | `/cadastro` | Registro profissional |
| Perfil Público | `/perfil-publico/:slug` | Perfil do profissional |
| Agendamento | `/agendar/:slug` | Booking público |
| Preços | `/precos` | Tabela de preços |
| Contato | `/contato` | Formulário contato |
| Recursos | `/recursos` | Features |

### Autenticadas (Com login)

| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs principais |
| Agenda | `/app` | Calendário agendamentos |
| Clientes | `/clientes` | CRM |
| Serviços | `/servicos` | Gerenciador serviços |
| Horários | `/horarios` | Horários funcionamento |
| Pagamentos | `/pagamentos` | Faturamento |
| Notificações | `/notificacoes` | Centro de notificações |
| Portfolio | `/portfolio` | Galeria de trabalhos |
| Perfil Prof | `/perfil-profissional` | Editar perfil |
| Personalização | `/personalizacao` | Temas/cores |
| Google Calendar | `/google-calendar` | Integração |
| WhatsApp | `/whatsapp` | Configurações |
| Transações | `/transacoes` | Histórico |
| Onboarding | `/onboarding` | Tutorial inicial |
| ... (mais 14) |

---

## 🔄 FLUXOS PRINCIPAIS

### Onboarding (Novo Profissional)

```
1. Cadastro → 2. Perfil → 3. Serviços → 4. Horários → 5. Depósito → 6. Google Calendar (opt) → 7. WhatsApp (opt)
```

### Agendamento (Cliente)

```
1. Abrir link público → 2. Selecionar serviço → 3. Escolher data/hora → 4. Dados cliente → 5. Confirmar → 6. Pagamento → 7. WhatsApp confirmação
```

### Após Agendamento

```
- Cliente recebe confirmação via WhatsApp
- 24h antes: Lembrete automático
- Profissional vê em Dashboard/Agenda
- Pode cancelar (política de cancelamento)
- Depósito (sinal) é bloqueado até confirmação
```

---

## 💳 MODELO DE RECEITA

### Depósito (Sinal)

- Configurável por profissional: 50%, 100%, ou valor fixo
- Não reembolsável se no-show
- Bloqueado até confirmação do serviço

### Pagamento

- Via Mercado Pago
- Profissional recebe após 48h
- Taxas: 2,99% + R$ 0,30

### Comissão SuaAgenda

- 15% do valor do serviço (futura, para viabilidade)

---

## 🔌 INTEGRAÇÕES OBRIGATÓRIAS

### WhatsApp (Evolution Go)

```typescript
// Automático
- Confirmação de agendamento
- Lembrete 24h antes
- Cancelamento
- Avaliação pós-serviço

// Manual
- Mensagens personalizadas
- Bulk messages
```

### Google Calendar (Opcional)

```typescript
// Sincronização
- Duas vias (app ↔ Google)
- Respeita fuso horário
```

### Mercado Pago (Obrigatório)

```typescript
// Checkout
- Crédito/débito
- Pix
- Boleto
```

### Supabase (Obrigatório)

```typescript
// Database + Auth
- PostgreSQL
- RLS (Row Level Security)
- Real-time updates
```

---

## 🚀 DEPLOYMENT

### Local

```bash
npm run dev
```

### Docker (Dev)

```bash
docker-compose up dev
```

### Docker (Prod)

```bash
docker-compose up prod
# ou
docker build -t suaagenda:latest .
docker run -p 3000:3000 suaagenda:latest
```

### VPS

```bash
# SSH na VPS
ssh usuario@seu-vps.com

# Clonar repo
git clone https://seu-repo.git
cd suaagenda-pro

# Rodar com Docker
docker-compose up -d prod

# Nginx/Apache reverse proxy para porta 3000
```

---

## ✅ REGRAS RÍGIDAS (OBRIGATÓRIAS)

Veja `REGRAS.md` para lista completa.

Resumo:
1. ✅ TypeScript strict sempre
2. ✅ Componentes reutilizáveis SEMPRE
3. ✅ Tailwind classes NUNCA inline styles
4. ✅ Sem console.log em produção
5. ✅ Testes before commit
6. ✅ Commits com mensagens claras
7. ✅ Não quebrar TypeScript
8. ✅ PWA sempre funcional

---

## 📚 PRÓXIMAS AÇÕES

1. ✅ Ler `REGRAS.md` (obrigatório)
2. ✅ Ler `MEMORIA.md` (contexto)
3. ✅ Setup Docker
4. ✅ `npm run maestro:all`
5. ✅ `npm run dev`
6. ✅ Começar desenvolvimento

---

**Documento de Especificações | SuaAgenda.Pro 2026**
