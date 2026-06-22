# 📁 GUIA: ONDE COLOCAR OS ARQUIVOS

Após converter telas do Lovable, aqui está exatamente aonde colocar cada arquivo.

---

## 🎯 RESUMO RÁPIDO

```
Arquivos convertidos do Lovable SEMPRE vão para:
src/routes/

Exemplo:
- dashboard-novo.tsx  → src/routes/dashboard-novo.tsx
- login.tsx           → src/routes/login.tsx
- clientes.tsx        → src/routes/clientes.tsx
```

---

## 📂 ESTRUTURA COMPLETA

### Raiz do Projeto

```
suaagenda-pro/
├── .github/                    # GitHub (CI/CD futura)
├── .gitignore                  # Git ignore
├── Dockerfile                  # Produção
├── Dockerfile.dev              # Desenvolvimento
├── docker-compose.yml          # Orquestração
├── eslint.config.js            # Linter
├── package.json                # Dependências
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── tailwind.config.ts          # Tailwind config
├── components.json             # Radix UI config
│
├── src/                        # CÓDIGO FONTE
├── public/                     # Assets estáticos
├── docs/                       # Documentação
│
└── node_modules/               # Dependências (não editar)
```

---

## 📁 PASTA: src/

### Estrutura Completa

```
src/
├── components/                 # Componentes React
│   ├── ui/                     # 25+ componentes base
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── sidebar.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── switch.tsx
│   │   ├── textarea.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── carousel.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── progress.tsx
│   │   ├── pagination.tsx
│   │   ├── accordion.tsx
│   │   ├── collapsible.tsx
│   │   ├── tooltip.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── toggle.tsx
│   │   └── index.ts            # IMPORTANTE: Barrel export
│   │
│   ├── layout/                 # Layouts estruturais
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── main-layout.tsx
│   │   ├── auth-layout.tsx
│   │   ├── public-layout.tsx
│   │   └── index.ts
│   │
│   └── index.ts                # Barrel export de tudo
│
├── routes/                     # 28 PÁGINAS - AQUI!
│   ├── __root.tsx              # Root layout (não editar)
│   ├── index.tsx               # Landing page
│   ├── login.tsx               # Login
│   ├── cadastro.tsx            # Registro
│   ├── dashboard.tsx           # Dashboard
│   ├── app.tsx                 # Agenda
│   ├── clientes.tsx            # Clientes
│   ├── servicos.tsx            # Serviços
│   ├── horarios.tsx            # Horários
│   ├── pagamentos.tsx          # Pagamentos
│   ├── notificacoes.tsx        # Notificações
│   ├── notificacoes-todas.tsx  # Todas notificações
│   ├── perfil-publico.tsx      # Perfil público
│   ├── perfil-profissional.tsx # Editar perfil
│   ├── personalizacao.tsx      # Temas
│   ├── portfolio.tsx           # Gallery
│   ├── precos.tsx              # Preços
│   ├── contato.tsx             # Contato
│   ├── recursos.tsx            # Features
│   ├── google-calendar.tsx     # Google Calendar
│   ├── whatsapp.tsx            # WhatsApp
│   ├── transacoes.tsx          # Transações
│   ├── saudacao.tsx            # Saudação
│   ├── onboarding.tsx          # Tutorial
│   ├── agendar.$slug.tsx       # Agendamento público
│   ├── servico.$id.tsx         # Detalhe serviço
│   ├── servico.novo.tsx        # Novo serviço
│   ├── mais.tsx                # Menu mais
│   └── api/ (pasta para APIs)
│       └── ...
│
├── lib/                        # Utilitários
│   ├── utils.ts                # cn(), helpers
│   ├── api.ts                  # Chamadas API
│   ├── auth.ts                 # Autenticação
│   ├── validators.ts           # Validações Zod
│   └── constants.ts            # Constantes
│
├── hooks/                      # Custom Hooks
│   ├── useAuth.ts              # Autenticação
│   ├── useAgendamentos.ts      # Agendamentos
│   ├── useClientes.ts          # Clientes
│   ├── useServicos.ts          # Serviços
│   ├── usePagamentos.ts        # Pagamentos
│   └── index.ts                # Barrel export
│
├── integrations/               # APIs Externas
│   ├── supabase.ts             # Database
│   ├── mercado-pago.ts         # Pagamentos
│   ├── google-calendar.ts      # Google Calendar
│   ├── whatsapp.ts             # WhatsApp
│   └── index.ts
│
├── styles/                     # Estilos CSS
│   ├── globals.css             # Estilos globais
│   ├── variables.css           # CSS custom properties
│   ├── animations.css          # Animações
│   └── index.css               # Índice
│
├── types/                      # TypeScript Types
│   ├── index.ts                # Export de tipos
│   ├── components.ts           # Types de componentes
│   ├── pages.ts                # Types de páginas
│   ├── api.ts                  # Types de API
│   └── database.ts             # Types de database
│
├── main.tsx                    # Entrada da app
├── App.tsx                     # App root
└── vite-env.d.ts               # Vite types
```

---

## 🎨 ARQUIVOS DO LOVABLE

### Onde Colocar

| Tipo | Arquivo | Destino | Exemplo |
|------|---------|---------|---------|
| **Página** | `dashboard-novo.tsx` | `src/routes/` | `src/routes/dashboard-novo.tsx` |
| **Componente reutilizável** | `card-custom.tsx` | `src/components/ui/` | `src/components/ui/card-custom.tsx` |
| **Layout** | `header.tsx` | `src/components/layout/` | `src/components/layout/header.tsx` |
| **Hook** | `useCustom.ts` | `src/hooks/` | `src/hooks/useCustom.ts` |
| **Tipo** | `types.ts` | `src/types/` | `src/types/custom.ts` |
| **Utilitário** | `formatter.ts` | `src/lib/` | `src/lib/formatter.ts` |

---

## 🚀 WORKFLOW: CONVERTER E COLOCAR

### Passo 1: Converter do Lovable

```bash
# Editar lovable-export.json
nano lovable-export.json

# Adicionar:
{
  "pageName": "sua-pagina-nova",
  "html": "<div>...HTML do Lovable...</div>"
}

# Converter
npm run convert:lovable
```

### Passo 2: Arquivo Criado

```
✅ Criado: src/routes/sua-pagina-nova.tsx
✅ Criado: docs/sua-pagina-nova.md
```

### Passo 3: Revisar e Customizar

```
1. Abrir: src/routes/sua-pagina-nova.tsx
2. Revisar TypeScript
3. Adicionar lógica
4. Testar: npm run dev
```

### Passo 4: Commit

```bash
git add .
git commit -m "feat: add sua-pagina-nova page"
git push
```

---

## 📁 MANTER ORGANIZAÇÃO

### Se Adicionar Novo Tipo

```
1. Crie arquivo NO LUGAR CORRETO
2. Adicione export em index.ts
3. Teste imports
4. Commit

Exemplo: Novo componente UI
├── src/components/ui/novo-componente.tsx  (criado aqui)
├── src/components/ui/index.ts              (adicione export)
└── git commit
```

### Nunca Criar Pastas Extras

```
❌ ERRADO:
src/
├── custom-components/      (não criar!)
├── my-utils/              (não criar!)
└── special-pages/         (não criar!)

✅ CORRETO:
src/
├── components/ui/         (todos aqui)
├── lib/                  (todos aqui)
├── routes/               (todos aqui)
```

---

## 📊 PADRÃO DE ARQUIVO

### Página (routes/)

```typescript
// src/routes/minha-pagina.tsx

import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button, Card, Input } from '@/components/ui';

export const Route = createFileRoute('/minha-pagina')({
  head: () => ({
    meta: [
      { title: 'Minha Página — SuaAgenda.Pro' },
      { name: 'description', content: 'Descrição da página' },
    ],
  }),
  component: MinhaPageComponent,
});

function MinhaPageComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Conteúdo aqui */}
    </motion.div>
  );
}
```

### Componente (components/ui/)

```typescript
// src/components/ui/novo-componente.tsx

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface NovoComponenteProps {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
  className?: string;
}

export function NovoComponente({
  variant = 'primary',
  children,
  className,
}: NovoComponenteProps) {
  return (
    <div className={cn('p-4 rounded-lg', className)}>
      {children}
    </div>
  );
}
```

### Hook (hooks/)

```typescript
// src/hooks/useCustom.ts

import { useState, useCallback } from 'react';

export function useCustom() {
  const [state, setState] = useState(false);

  const toggle = useCallback(() => {
    setState(prev => !prev);
  }, []);

  return { state, toggle };
}
```

---

## ✅ CHECKLIST: Depois de Adicionar Arquivo

- [ ] Arquivo está no lugar correto?
- [ ] index.ts foi atualizado?
- [ ] TypeScript passa?
- [ ] Imports funcionam?
- [ ] npm run dev não dá erro?
- [ ] Testou no navegador?
- [ ] Commit foi feito?

---

## 🆘 PROBLEMAS COMUNS

### Arquivo não encontrado

```
❌ Error: Cannot find module '@/routes/pagina'

SOLUÇÃO:
- Verificar se arquivo está em src/routes/
- Verificar nome do arquivo
- Fazer npm run dev novamente
```

### Import error

```
❌ Error: Cannot find module '@/components/ui/novo'

SOLUÇÃO:
- Verificar se arquivo está em src/components/ui/
- Verificar se tem export em index.ts
- npm run dev novamente
```

### TypeScript error

```
❌ Error TS2339: Property 'x' does not exist

SOLUÇÃO:
- Adicionar types ao componente/função
- npm run type-check
- Corrigir errors
```

---

## 📚 REFERÊNCIA RÁPIDA

```bash
# Verificar onde colocar arquivo X
# Regra: Se é uma PÁGINA → src/routes/
#        Se é componente reutilizável → src/components/ui/
#        Se é layout → src/components/layout/
#        Se é hook → src/hooks/
#        Se é tipo → src/types/
#        Se é utilitário → src/lib/
#        Se é integração → src/integrations/

# Depois de adicionar:
npm run type-check    # Validar TypeScript
npm run dev          # Testar
npm run build        # Build produção
```

---

**Guia de Arquivos | SuaAgenda.Pro**

*Sempre seguir esta estrutura para manter projeto organizado e escalável.*
