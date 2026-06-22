# 🎯 SUAAGENDA.PRO - CURSOR CLI SETUP

## 📦 O QUE VOCÊ RECEBEU

1. **`.cursor-system-prompt.txt`** - System prompt para Cursor (COPIE PARA RAIZ DO PROJETO)
2. **`CURSOR_SETUP.md`** - Como configurar no Cursor (LEIA PRIMEIRO)
3. **`ESPECIFICACOES.md`** - Specs completas do projeto
4. **`MEMORIA.md`** - Contexto do projeto
5. **`REGRAS.md`** - Regras rígidas (OBRIGATÓRIAS)
6. **`GUIA_ARQUIVOS.md`** - Onde colocar arquivos convertidos

---

## 🚀 SETUP RÁPIDO (3 MINUTOS)

### 1. Copie o arquivo de system prompt

```
.cursor-system-prompt.txt → Raiz do seu projeto
```

### 2. Configure no Cursor

**Opção A - Via Settings:**
```
Cursor → Settings → System Prompt
→ Cole o conteúdo de .cursor-system-prompt.txt
```

**Opção B - Via JSON:**
Edite `.cursor/settings.json`:
```json
{
  "claude": {
    "systemPrompt": {
      "type": "file",
      "path": ".cursor-system-prompt.txt"
    }
  }
}
```

### 3. Reinicie Cursor

```
Ctrl+Shift+P → Reload Window
```

### 4. Teste

Pergunte ao Claude:
```
Quais são as regras que devo seguir?
```

Se aparecer a lista de 10 regras, está funcionando! ✅

---

## 📁 ONDE COLOCAR ARQUIVOS CONVERTIDOS

### Resumo Rápido

| Tipo | Destino |
|------|---------|
| **Página** (do Lovable) | `src/routes/` |
| **Componente reutilizável** | `src/components/ui/` |
| **Layout** | `src/components/layout/` |
| **Hook** | `src/hooks/` |
| **Tipo TypeScript** | `src/types/` |
| **Utilitário** | `src/lib/` |
| **Integração API** | `src/integrations/` |

### Exemplo

Se você converteu do Lovable uma página chamada `dashboard-novo.tsx`:

```
✅ CORRETO:
src/routes/dashboard-novo.tsx

❌ ERRADO:
src/pages/dashboard-novo.tsx
src/components/dashboard-novo.tsx
dashboard-novo.tsx (raiz)
```

Ver `GUIA_ARQUIVOS.md` para detalhes completos.

---

## 🎯 COMO USAR O CURSOR AGORA

### Pedir Nova Página

```
Claude: Crie a página de dashboard em /dashboard

Requisitos:
- Card com receita do mês
- Card com agendamentos hoje
- Gráfico de receita
- Tabela de últimos agendamentos

Use TypeScript strict, Tailwind, componentes UI existentes.
```

### Pedir Componente

```
Claude: Crie componente CardMetrica reutilizável

Propriedades:
- icon: ReactNode
- titulo: string
- valor: number | string
- subtexto?: string

Tailwind design com hover effect.
```

### Corrigir Erro

```
Claude: Conserte estes erros TypeScript
(Cole os erros aqui)

Mantenha strict mode, não use any.
```

---

## 📚 ARQUIVOS IMPORTANTES

### Deve Ler Primeiro

1. **MEMORIA.md** - Entender contexto do projeto
2. **REGRAS.md** - Conhecer as 10 regras obrigatórias
3. **ESPECIFICACOES.md** - Specs técnicas

### Referência

- **GUIA_ARQUIVOS.md** - Consulte quando adicionar arquivo
- **CURSOR_SETUP.md** - Setup detalhado

---

## ✅ CHECKLIST

- [ ] Copiei `.cursor-system-prompt.txt` para raiz?
- [ ] Configurei no Cursor?
- [ ] Reiniciei Cursor?
- [ ] Testei com um prompt?
- [ ] Lí MEMORIA.md?
- [ ] Lí REGRAS.md?
- [ ] Entendi aonde colocar arquivos?

---

## 🔑 10 REGRAS OBRIGATÓRIAS

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

## 🎨 DESIGN SYSTEM

- **Primária**: #ec4899 (Rosa)
- **Secundária**: #9b5b9f (Roxo)
- **Success**: #10b981 (Verde)
- **Warning**: #f59e0b (Laranja)
- **Destructive**: #ef4444 (Vermelho)

---

## 🐳 DOCKER

```bash
# Desenvolvimento
docker-compose up dev
# Porta 8080

# Produção
docker-compose up prod
# Porta 3000
```

---

## 🚀 PRÓXIMO PASSO

```bash
# 1. Copie .cursor-system-prompt.txt
# 2. Configure no Cursor
# 3. Reinicie Cursor
# 4. Execute:

npm run dev

# 5. Peça ao Claude para criar uma página!
```

---

## 📞 DÚVIDAS?

Veja os arquivos:
- **CURSOR_SETUP.md** - Setup detalhado
- **REGRAS.md** - Regras específicas
- **GUIA_ARQUIVOS.md** - Estrutura de pastas
- **ESPECIFICACOES.md** - Specs técnicas
- **MEMORIA.md** - Contexto do projeto

---

**SuaAgenda.Pro | Cursor CLI Ready** ✅

Você está pronto para começar!
