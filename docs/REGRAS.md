# ⚡ REGRAS DO PROJETO - OBRIGATÓRIAS

**IMPORTANTE:** Estas regras DEVEM ser seguidas fielmente. Não há exceções.

---

## 🔴 REGRA #1: TypeScript Strict - NUNCA QUEBRAR

### Obrigatório

```typescript
// ✅ CORRETO - Com tipos
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
  console.log(e.currentTarget.value);
};

const user: { name: string; age: number } = { name: 'João', age: 30 };

// ❌ ERRADO - Sem tipos
const handleClick = (e: any) => {
  console.log(e.currentTarget.value);
};

const user = { name: 'João', age: 30 }; // Implícito
```

### Regras TypeScript

```typescript
// ❌ NUNCA use `any`
const value: any = something;

// ✅ SEMPRE especifique o tipo
const value: string | number = something;

// ❌ NUNCA faltam tipos em funções
const calculate = (a, b) => a + b;

// ✅ SEMPRE com tipos
const calculate = (a: number, b: number): number => a + b;

// ❌ NUNCA implicit any
function process(data) {}

// ✅ SEMPRE explicit
function process(data: unknown): void {}

// ❌ NUNCA esqueça de tipos de retorno
const getData = async () => {
  return fetch('/api');
};

// ✅ SEMPRE com tipos de retorno
const getData = async (): Promise<Response> => {
  return fetch('/api');
};
```

### Verificar

```bash
npm run type-check  # Deve passar SEM erros
```

---

## 🟣 REGRA #2: Componentes Reutilizáveis - SEMPRE

### Nunca duplicar componentes

```typescript
// ❌ ERRADO - Duplicação
// Em Dashboard.tsx
<button className="bg-pink-600 text-white px-4 py-2 rounded">Enviar</button>

// Em Agendamentos.tsx
<button className="bg-pink-600 text-white px-4 py-2 rounded">Enviar</button>

// ✅ CORRETO - Use componente existente
import { Button } from '@/components/ui/button';

<Button variant="default">Enviar</Button>
```

### Componentes disponíveis

```
Sempre verificar src/components/ui/ antes de criar novo!

Existem 25+ componentes prontos:
- Button
- Input
- Card
- Form
- Dialog
- Tabs
- Badge
- Avatar
- ... (17 mais)
```

### Se não existir, criar de forma reutilizável

```typescript
// ✅ CORRETO - Novo componente reutilizável
// src/components/ui/custom-component.tsx
export interface CustomComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function CustomComponent({
  variant = 'primary',
  size = 'md',
  children,
}: CustomComponentProps) {
  // Implementação
}
```

---

## 🟢 REGRA #3: Tailwind Classes - NUNCA Inline Styles

### Obrigatório

```typescript
// ❌ ERRADO - Inline styles
<div style={{ color: 'red', fontSize: '16px' }}>Texto</div>

// ✅ CORRETO - Tailwind classes
<div className="text-red-500 text-base">Texto</div>

// ❌ ERRADO - CSS modules
<div className={styles.container}>Conteúdo</div>

// ✅ CORRETO - Tailwind
<div className="bg-white rounded-lg shadow-md p-6">Conteúdo</div>
```

### Usar cores do design system

```typescript
// ✅ CORRETO - Cores do design
<button className="bg-pink-600 hover:bg-pink-700 text-white">
  Clique
</button>

// ❌ ERRADO - Cores aleatórias
<button className="bg-blue-400">Clique</button>
```

### Espaçamento sempre 8px grid

```typescript
// ✅ CORRETO - Grid 8px
<div className="p-4 mb-4 gap-2">  // 16px, 16px, 8px

// ❌ ERRADO - Não-múltiplo de 8
<div className="p-3 mb-5">  // 12px, 20px - NÃO!
```

---

## 🔵 REGRA #4: Importar de index.ts (Barrel Exports)

### Obrigatório

```typescript
// ✅ CORRETO - Importar do barrel
import { Button, Card, Input } from '@/components/ui';

// ❌ ERRADO - Importar direto do arquivo
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### Manter index.ts atualizado

```typescript
// src/components/ui/index.ts
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
// ... todos os componentes
```

---

## 📛 REGRA #5: Nomes Claros - NUNCA Abreviações

### Obrigatório

```typescript
// ✅ CORRETO - Nomes claros
const isUserLoggedIn = true;
const handleButtonClick = () => {};
const getUserProfile = async () => {};

// ❌ ERRADO - Abreviações
const isUserLI = true;  // LI = LoggedIn?
const handleBC = () => {};  // BC = ButtonClick?
const getUP = async () => {};  // UP = UserProfile?

// ✅ CORRETO - Nomes descritivos
const calculateTotalOrderPrice = () => {};
const validateEmailFormat = () => {};
const fetchUserAppointments = () => {};

// ❌ ERRADO - Nomes genéricos
const process = () => {};
const handle = () => {};
const get = async () => {};
```

---

## 🟡 REGRA #6: PWA Sempre Funcional - NUNCA Quebrar

### Verificar regularmente

```bash
# Verificar Service Worker
npm run dev
# Chrome DevTools → Application → Service Workers
# Deve estar "activated and running"

# Verificar manifest
# Chrome DevTools → Application → Manifest
# Deve estar válido
```

### Arquivo obrigatório

```
public/
├── manifest.json        # OBRIGATÓRIO
├── sw.js               # OBRIGATÓRIO
├── icon-192.png        # OBRIGATÓRIO
└── icon-512.png        # OBRIGATÓRIO
```

### Teste de instalação

```
1. npm run dev
2. Abrir Chrome
3. Ver "Instalar" no endereço
4. Cliq

ar
5. App deve aparecer em aplicativos
```

---

## 🟠 REGRA #7: Types em Tudo - NUNCA Esquecer

### Props sempre tipadas

```typescript
// ✅ CORRETO
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}

export function Button(props: ButtonProps) {}

// ❌ ERRADO
export function Button(props) {}
```

### Retorno sempre tipado

```typescript
// ✅ CORRETO
async function fetchUser(id: number): Promise<User> {
  return await api.get(`/users/${id}`);
}

// ❌ ERRADO
async function fetchUser(id: number) {
  return await api.get(`/users/${id}`);
}
```

### State sempre tipado

```typescript
// ✅ CORRETO
const [user, setUser] = useState<User | null>(null);
const [count, setCount] = useState<number>(0);

// ❌ ERRADO
const [user, setUser] = useState(null);
const [count, setCount] = useState(0);
```

---

## 🔴 REGRA #8: Sem console.log em Produção

### Usar apenas em desenvolvimento

```typescript
// ❌ ERRADO - Em produção
if (user) {
  console.log('Usuário:', user);  // REMOVE ANTES DE PUSH!
  return user;
}

// ✅ CORRETO - Uso condicional
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', value);
}

// ✅ CORRETO - Usar logger profissional
import { logger } from '@/lib/logger';
logger.debug('Usuário:', user);
```

### Antes de fazer commit

```bash
# Verificar console.log
grep -r "console.log" src/

# Se houver resultado, remover TODOS antes de push!
```

---

## 🟢 REGRA #9: Commits Semânticos - SEMPRE

### Formato obrigatório

```bash
feat:       Nova feature
fix:        Correção de bug
chore:      Tarefas (dependências, setup)
refactor:   Refatoração de código
test:       Testes
docs:       Documentação
style:      Estilos (não lógica)
perf:       Performance
```

### Exemplos

```bash
# ✅ CORRETO
git commit -m "feat: add dashboard KPI cards"
git commit -m "fix: button click handler not working"
git commit -m "chore: update dependencies"
git commit -m "refactor: extract common logic to hook"

# ❌ ERRADO
git commit -m "update"
git commit -m "fix"
git commit -m "alterações"
git commit -m "mudanças do dia"
```

### Template

```
<type>(<scope>): <subject>

<body>

<footer>

---

Exemplo:
feat(dashboard): add revenue chart

- Implement recharts integration
- Add real-time data updates
- Responsive mobile layout

Closes #123
```

---

## 🟡 REGRA #10: Testes Before Push - SEMPRE

### Checklist antes de git push

```bash
# 1. TypeScript
npm run type-check          # Deve passar

# 2. Build
npm run build               # Deve compilar

# 3. Lint
npm run lint                # Sem erros

# 4. Dev server
npm run dev                 # Sem erros no terminal

# 5. Verificar no navegador
# - Página funciona?
# - Responsive?
# - Sem erro no console?
```

### Script de checagem rápida

```bash
npm run type-check && npm run build && npm run dev
```

---

## 📋 CHECKLIST: Antes de Fazer Qualquer Feature

- [ ] Leu REGRAS.md?
- [ ] Leu ESPECIFICACOES.md?
- [ ] Entendeu a estrutura?
- [ ] Vai reutilizar componentes?
- [ ] Vai usar Tailwind (não inline)?
- [ ] Vai usar TypeScript strict?
- [ ] Testou localmente?
- [ ] Passou em npm run type-check?
- [ ] Sem console.log?
- [ ] Commit semântico?

---

## ⚠️ PUNIÇÕES POR NÃO SEGUIR

Se quebrar as regras:

1. ❌ TypeScript erros → **Não faz merge**
2. ❌ Componente duplicado → **Pedir refactor**
3. ❌ Inline styles → **Rejeitar**
4. ❌ Sem tipos → **Rejeitar**
5. ❌ console.log em prod → **Rejeitar**
6. ❌ Commit ruim → **Pedir redo**
7. ❌ PWA quebrada → **Rejeitar tudo**

---

## 🎯 RESUMO RÁPIDO

| Regra | Obrigatório | Verificar |
|-------|-------------|-----------|
| TypeScript strict | ✅ SIM | `npm run type-check` |
| Componentes reutilizáveis | ✅ SIM | Revisar código |
| Tailwind (não inline) | ✅ SIM | Revisar código |
| Imports do index.ts | ✅ SIM | Revisar código |
| Nomes claros | ✅ SIM | Revisar código |
| PWA funcional | ✅ SIM | `npm run dev` |
| Types em tudo | ✅ SIM | `npm run type-check` |
| Sem console.log | ✅ SIM | `grep console.log` |
| Commits semânticos | ✅ SIM | `git log` |
| Testes before push | ✅ SIM | Manual |

---

**Regras do Projeto | SuaAgenda.Pro**

**Versão:** 1.0  
**Última atualização:** June 2026  
**Status:** FINAL E OBRIGATÓRIO
