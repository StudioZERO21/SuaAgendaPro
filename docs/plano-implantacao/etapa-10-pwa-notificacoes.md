# ETAPA 10 — PWA e Notificações Push

**Status:** 🔴 Não iniciado  
**Prioridade:** Média  
**Estimativa:** 2 dias  
**Dependências:** Etapas 01, 02

---

## Contexto

O `manifest.json` e `sw.js` já existem em `/public`. O PWA está parcialmente configurado mas o Service Worker não implementa cache offline real e as notificações push não estão funcionando. Esta etapa consolida o PWA completo.

---

## Objetivo

App instalável que funciona offline com Service Worker, cache inteligente de assets, e notificações push nativas para o profissional (novo agendamento, cancelamento, lembrete de hoje).

---

## Checklist de Execução

### Service Worker (`public/sw.js`)
- [ ] Estratégia de cache para assets estáticos (cache-first):
  - [ ] JS/CSS bundles
  - [ ] Fonts (Playfair Display, Inter)
  - [ ] Imagens e ícones
- [ ] Estratégia de cache para API calls (network-first com fallback):
  - [ ] `/api/public/*` → network first (dados em tempo real)
  - [ ] Assets do usuário (avatars, fotos) → cache 1h
- [ ] Página offline customizada (`/offline.html`)
- [ ] Mostrar página offline quando não há conexão
- [ ] Cache versioning: limpar cache antigo ao atualizar SW
- [ ] Background sync: reenviar ações feitas offline quando reconectar

### Manifest (`public/manifest.json`)
- [ ] Revisar e completar:
  - [ ] `name`: "SuaAgenda.Pro"
  - [ ] `short_name`: "SuaAgenda"
  - [ ] `start_url`: "/"
  - [ ] `display`: "standalone"
  - [ ] `theme_color`: "#ec4899"
  - [ ] `background_color`: "#ffffff"
  - [ ] `icons`: 192x192 e 512x512 (verificar se existem em /public)
  - [ ] `screenshots`: adicionar 2-3 screenshots do app (melhora install)
  - [ ] `categories`: ["business", "productivity"]
- [ ] Validar no Chrome DevTools → Application → Manifest

### Ícones PWA
- [ ] Verificar `icon-192.png` e `icon-512.png` existem em `/public`
- [ ] Se não existirem: gerar a partir do logo-oficial.png
- [ ] Ícone maskable (para Android): fundo rosa + logo centralizado
- [ ] Adicionar `maskable` no manifest para ícones maskable

### Notificações Push (Web Push API)
- [ ] Gerar VAPID keys:
  ```bash
  npx web-push generate-vapid-keys
  ```
- [ ] Salvar em `.env`:
  ```
  VAPID_PUBLIC_KEY=...
  VAPID_PRIVATE_KEY=...
  ```
- [ ] Criar tabela `push_subscriptions` (migration):
  ```sql
  CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, endpoint)
  );
  ```
- [ ] Solicitar permissão de notificação ao primeiro acesso
- [ ] Salvar subscription no banco via API
- [ ] Implementar no Service Worker: receber push e mostrar notificação
- [ ] Criar server function `sendPushNotification(userId, payload)`:
  - [ ] Buscar subscriptions do usuário
  - [ ] Enviar via `web-push` library

### Gatilhos de Notificação Push
- [ ] Novo agendamento recebido:
  - [ ] Título: "Novo agendamento! 🎉"
  - [ ] Body: "{{cliente_nome}} agendou {{servico}} para {{data}}"
  - [ ] Clique → abre /app
- [ ] Agendamento cancelado:
  - [ ] Título: "Agendamento cancelado"
  - [ ] Body: "{{cliente_nome}} cancelou o agendamento de {{data}}"
- [ ] Lembrete de agendamentos do dia (às 8h da manhã):
  - [ ] Título: "Sua agenda de hoje"
  - [ ] Body: "Você tem {{n}} agendamentos hoje. Bom trabalho!"

### Centro de Notificações (`/notificacoes`)
- [ ] Listar notificações da tabela `notifications` (banco)
- [ ] Separar: não lidas (topo) e lidas
- [ ] Marcar como lida ao clicar
- [ ] Botão "Marcar todas como lidas"
- [ ] Ícone com badge de contagem não lidas no bottom nav
- [ ] Real-time: badge atualiza quando chega nova notificação

### Instalação do App
- [ ] Evento `beforeinstallprompt` capturado
- [ ] Banner sutil de instalação exibido após 30s de uso
- [ ] Botão "Instalar app" persistente nas configurações
- [ ] Instruções para iOS (Safari → Compartilhar → Adicionar à tela inicial)

---

## Arquivos a Criar/Editar

```
public/sw.js                                    ← EDITAR (completar)
public/manifest.json                            ← EDITAR (completar)
public/offline.html                             ← CRIAR
src/routes/notificacoes.tsx                     ← EDITAR (dados reais)
src/routes/notificacoes-todas.tsx               ← EDITAR (dados reais)
src/lib/push-notifications.ts                   ← CRIAR
supabase/migrations/etapa10_push_subs.sql       ← CRIAR
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- App pode ser instalado no celular (Android + iOS)
- Funciona offline (exibe página de offline ao invés de erro)
- Notificações push chegam ao profissional quando há novo agendamento
- Centro de notificações exibe dados reais
- Chrome Lighthouse PWA score ≥ 90
