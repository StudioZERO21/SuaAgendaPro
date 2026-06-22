# ETAPA 11 — Personalização e Portfólio

**Status:** 🔴 Não iniciado  
**Prioridade:** Baixa-Média  
**Estimativa:** 2 dias  
**Dependências:** Etapas 01, 02

---

## Contexto

As páginas `/personalizacao` e `/portfolio` existem mockadas. Esta etapa permite que o profissional customize a aparência do seu perfil público e gerencie sua galeria de trabalhos.

---

## Objetivo

Profissional pode fazer upload de foto de perfil e capa, personalizar o tema de cores do seu perfil público, e gerenciar a galeria de trabalhos (portfolio). Todas as mudanças refletem imediatamente no perfil público.

---

## Checklist de Execução

### Upload de Imagens (Supabase Storage)
- [ ] Configurar bucket `avatars` no Supabase Storage (público)
- [ ] Configurar bucket `portfolio` no Supabase Storage (público)
- [ ] Configurar bucket `covers` no Supabase Storage (público)
- [ ] Criar políticas de storage (usuário só faz upload no próprio folder)

### Perfil Profissional (`/perfil-profissional`)
- [ ] Conectar form ao banco (substituir mock)
- [ ] Campos: nome, bio, telefone, cidade, estado, slug
- [ ] Upload de avatar:
  - [ ] Componente de crop (react-easy-crop — já instalado)
  - [ ] Drag & drop ou clique para selecionar
  - [ ] Preview antes de salvar
  - [ ] Redimensionar para 400x400
  - [ ] Upload para `avatars/{user_id}/avatar.webp`
  - [ ] Atualizar `profiles.avatar_url`
- [ ] Upload de foto de capa:
  - [ ] Proporção 16:9 ou 3:1
  - [ ] Upload para `covers/{user_id}/cover.webp`
  - [ ] Atualizar `profiles.cover_url`
- [ ] Editar slug (verificar disponibilidade em tempo real)
- [ ] Preview do link público (`suaagenda.pro/agendar/{slug}`)
- [ ] Botão "Copiar link" do perfil público

### Personalização de Tema (`/personalizacao`)
- [ ] Seção: Cores do perfil público:
  - [ ] Cor primária (color picker)
  - [ ] Esquemas predefinidos: Rosa Clássico, Dourado, Azul Elegant, Verde Natural
  - [ ] Preview em tempo real da página de agendamento
- [ ] Seção: Configuração do perfil público:
  - [ ] Toggle: mostrar/ocultar preços
  - [ ] Toggle: mostrar/ocultar portfólio
  - [ ] Toggle: aceitar agendamentos online
  - [ ] Política de cancelamento (texto livre)
  - [ ] Mensagem de boas-vindas (aparece no topo da página pública)
- [ ] Salvar em `profiles` (colunas: `theme_color`, `show_prices`, `show_portfolio`, `accept_online`, `cancellation_policy`, `welcome_message`)
- [ ] Botão "Ver meu perfil público"

### Portfólio / Galeria (`/portfolio`)
- [ ] Listar `portfolio_items` do banco
- [ ] Grid de fotos (3 colunas no mobile, 4 no desktop)
- [ ] Upload de nova foto:
  - [ ] Múltiplos arquivos de uma vez (até 10)
  - [ ] Preview antes de confirmar
  - [ ] Campo de título (opcional)
  - [ ] Campo de descrição (opcional)
  - [ ] Associar a um serviço (select)
  - [ ] Upload para `portfolio/{user_id}/{uuid}.webp`
- [ ] Reordenar fotos (drag & drop ou botões ↑↓)
  - [ ] Atualizar `order_index` no banco
- [ ] Excluir foto (com confirmação)
  - [ ] Remover do Storage
  - [ ] Remover do banco
- [ ] Estado vazio com call-to-action para adicionar fotos
- [ ] Lazy loading de imagens

### Saudação/Boas-vindas (`/saudacao`)
- [ ] Tela de boas-vindas ao abrir o app pela primeira vez
- [ ] Exibir logo e tagline
- [ ] Verificar se onboarding foi completado
- [ ] Redirecionar para /onboarding ou /dashboard

---

## Migrações Necessárias

```sql
-- Adicionar colunas de personalização à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#ec4899';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_prices BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_portfolio BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accept_online BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_message TEXT;
```

---

## Arquivos a Criar/Editar

```
src/routes/perfil-profissional.tsx     ← EDITAR (dados reais + upload)
src/routes/personalizacao.tsx          ← EDITAR (tema real)
src/routes/portfolio.tsx               ← EDITAR (galeria real)
src/routes/saudacao.tsx                ← EDITAR
src/hooks/useProfile.ts                ← CRIAR
src/lib/image-upload.ts               ← CRIAR (helper de upload)
supabase/migrations/etapa11_perso.sql  ← CRIAR
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Upload de avatar e capa funcionam
- Galeria de trabalhos pode ser adicionada/removida/reordenada
- Personalização de tema reflete no perfil público
- Todas as alterações persistem no banco
