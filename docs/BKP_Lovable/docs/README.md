# 📚 Documentação de Sincronização

## Como Sincronizar uma Tela

### Passo 1: Documentar
```bash
npm run sync:lovable nome-da-tela
```

### Passo 2: Converter
```bash
npm run sync:convert nome-da-tela
```

### Passo 3: Editar
Abra `src/routes/nome-da-tela.tsx` e implemente.

### Passo 4: Testar
```bash
npm run dev
npm run type-check
```

### Passo 5: Commit
```bash
git add .
git commit -m "feat: sync [nome] from Lovable"
```

## Scripts Disponíveis

- `npm run sync:lovable` - Documenta tela
- `npm run sync:convert` - Cria arquivo React
- `npm run sync:validate` - Valida estrutura
- `npm run sync:all` - Valida tudo

---

Sincronização criada em: 2026-06-21
