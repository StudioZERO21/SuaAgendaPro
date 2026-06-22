# 🎯 COMO USAR NO CURSOR CLI

## ⚙️ SETUP (5 MINUTOS)

### 1. Copiar Arquivo de Sistema Prompt

```
.cursor-system-prompt.txt → Raiz do seu projeto
```

### 2. Configurar Cursor para Usar o Arquivo

**Opção A: Via settings.json**

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

**Opção B: Via UI do Cursor**

```
Cursor → Settings → System Prompt
→ Cole o conteúdo de .cursor-system-prompt.txt
```

### 3. Pronto!

Agora todo Claude no Cursor vai seguir suas especificações automaticamente.

---

## 🚀 COMO USAR

### Para Criar uma Nova Página

```
Claude: Crie a página /dashboard com KPI cards
```

Claude vai automaticamente:
- ✅ Colocar em `src/routes/dashboard.tsx`
- ✅ Usar TypeScript strict
- ✅ Usar Tailwind (não inline styles)
- ✅ Usar componentes existentes
- ✅ Exportar tudo corretamente
- ✅ Seguir as regras rígidas

### Para Criar um Componente

```
Claude: Crie um componente CardMetrica reutilizável
```

Claude vai:
- ✅ Colocar em `src/components/ui/card-metrica.tsx`
- ✅ Com TypeScript types
- ✅ Com Tailwind design
- ✅ Adicionar em `index.ts`
- ✅ Seguir padrão

### Para Corrigir um Erro

```
Claude: Conserte este erro de TypeScript
```

Claude vai:
- ✅ Manter TypeScript strict
- ✅ Não usar `any`
- ✅ Adicionar types
- ✅ Testar a solução

---

## 📝 DICAS DE PROMPTS

### Bom Prompt ✅

```
Crie a página de clientes em /clientes com:
- Tabela de clientes
- Botão para adicionar novo
- Filtro por nome
- Deletar cliente (com confirmação)

Use TypeScript strict e componentes da UI.
```

### Ruim Prompt ❌

```
Faz uma página de clientes
```

### Melhor ✅

```
Crie componente PaginaClientes em src/routes/clientes.tsx

Requisitos:
- Listar clientes do Supabase
- Tabela responsiva
- Botão "Novo cliente"
- Modal para adicionar
- Deletar com confirmação
- Estados de loading/error

Use: TypeScript strict, Tailwind, componentes UI existentes
```

---

## 🎓 EXEMPLOS DE USO

### Exemplo 1: Nova Página

```
Claude: Crie a página de serviços em /servicos com:

Requisitos:
- Listar serviços profissional
- Card para cada serviço
- Botão para editar
- Botão para deletar
- Botão "Novo serviço"
- Modal para criar/editar

Design:
- Use cores do sistema (rosa, roxo)
- Responsive mobile first
- Animação com Framer Motion

Tecnologia:
- TypeScript strict
- Tailwind classes
- Componentes da UI
```

Claude vai entregar pronto para usar!

### Exemplo 2: Correção

```
Claude: Conserte estes erros TypeScript:

- 'user' is possibly null
- Property 'id' does not exist
- Expected return type

Não use 'any', mantenha strict mode.
```

### Exemplo 3: Componente

```
Claude: Crie componente CardAgendamento reutilizável

Propriedades:
- agendamento: Appointment
- onEdit?: () => void
- onDelete?: () => void

Design:
- Card com sombra
- Status badge
- Data e hora formatadas
- Cliente name
- Serviço name
- Ações (editar/deletar)

Tailwind + TypeScript
```

---

## ✅ CHECKLIST: Antes de Cada Sessão

- [ ] Arquivo `.cursor-system-prompt.txt` está na raiz?
- [ ] Cursor está lendo o arquivo?
- [ ] Leu `docs/MEMORIA.md`?
- [ ] Leu `docs/REGRAS.md`?
- [ ] Entendeu a estrutura?
- [ ] Testou `npm run dev`?

---

## 🆘 SE CLAUDE NÃO SEGUIR REGRAS

### Claude está usando `any`?

```
Claude: Não use `any` type. Adicione types corretos.

Regra: TypeScript strict mode SEMPRE.
```

### Claude está duplicando componente?

```
Claude: Não crie novo componente Button. Use o existente em src/components/ui/button.tsx

Regra: Reutilizar componentes SEMPRE.
```

### Claude está usando inline styles?

```
Claude: Use Tailwind classes, não inline styles.

className="text-pink-600 font-bold" ✅
style={{ color: 'pink', fontWeight: 'bold' }} ❌
```

### Claude está quebrando TypeScript?

```
Claude: Conserte para manter TypeScript strict.

Não use 'any', não use implicit types.
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Copie** `.cursor-system-prompt.txt` para raiz do projeto
2. **Configure** Cursor para usar o arquivo
3. **Teste** com um prompt simples:
   ```
   Claude: Como está configurado o projeto?
   ```
4. **Verifique** se Claude menciona regras e especificações
5. **Comece** a pedir features!

---

## 📞 TROUBLESHOOTING

### Cursor não está lendo o arquivo?

Reinicie Cursor:
```
Ctrl+Shift+P → Reload Window
```

### Claude não segue regras?

Atualize o prompt:
```
Settings → System Prompt → Cola novamente
```

### Como saber se está funcionando?

Pergunte ao Claude:
```
Quais são as 10 regras que você deve seguir?
```

Se Claude listar todas, está funcionando! ✅

---

## 🚀 VOCÊ ESTÁ PRONTO!

Agora você tem:
- ✅ System prompt completo
- ✅ Especificações definidas
- ✅ Regras rígidas
- ✅ Claude configurado automaticamente
- ✅ Tudo documentado

**Comece a desenvolver!** 🎉

```bash
npm run dev
# E peça ao Claude para criar suas páginas
```

---

**Cursor CLI Setup | SuaAgenda.Pro**
