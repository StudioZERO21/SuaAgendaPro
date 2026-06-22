
# SuaAgenda.Pro — Pacote essencial (UI mockada, rosa premium)

App web mobile-first para SaaS de agendamento de profissionais da beleza. Foco no fluxo principal do profissional, sem backend ainda — dados mockados em memória.

## Identidade visual

- **Marca:** SuaAgenda.Pro (logo enviada utilizada no splash, login e header).
- **Tagline:** "Sua agenda, seu tempo, mais clientes."
- **Paleta rosa premium (vibrante, chama atenção):**
  - Primary `#EC4899` (rosa pink vibrante)
  - Primary glow `#F472B6`
  - Accent magenta `#D946EF` (para gradientes premium)
  - Rosa profundo `#BE185D` (textos/realces)
  - Fundos: branco `#FFFFFF` + rosa nuvem `#FDF2F8` + cinza neutro
  - Gradiente assinatura: `linear-gradient(135deg, #EC4899 0%, #D946EF 100%)` em CTAs, chips ativos e cards de destaque
  - Sombra suave colorida: `0 10px 30px -10px rgba(236,72,153,0.35)`
- **Tipografia:** Playfair Display (display/títulos, ar editorial premium) + Inter (UI/corpo). Instalados via @fontsource.
- **Estilo:** mobile-first, cantos arredondados (2xl), microinterações suaves (framer-motion: fade/slide nos cards da agenda, scale nos chips), brilho sutil/sparkles decorativos nas telas-chave.

## Telas desta entrega

1. **Splash / Boas-vindas** (`/`) — logo, tagline, CTAs "Entrar" e "Criar conta", fundo com gradiente rosa.
2. **Login** (`/login`) — email + senha, login social (visual), "esqueci minha senha" (mock).
3. **Cadastro** (`/cadastro`) — nome, email, senha, telefone.
4. **Onboarding (3 passos)** (`/onboarding`) — (1) dados do studio/profissional, (2) tipo de serviço/nicho, (3) cadastro rápido de 1 serviço inicial. Indicador de progresso rosa.
5. **Dashboard / Agenda** (`/app`) — réplica da tela de referência:
   - Header com saudação + avatar + sino
   - Toggle **Timeline / Grade**
   - Navegador de data ( `<  Hoje 📅  >` ) + botão **+ Novo** (gradiente rosa)
   - Strip semanal (SEG–DOM) com dia ativo em pílula gradiente
   - Filtro de profissionais (chips com avatar, "Todas" ativo em gradiente)
   - Filtro de período (Dia/Semana/Mês) + Status
   - Chips de status com contadores (Todos, Pendentes, Confirmados, Concluídos, Cancelados)
   - Lista de agendamentos agrupada por profissional → cards com hora, avatar do cliente, serviço, valor, badge de status, ações (WhatsApp, menu)
   - Bottom nav fixa (Agenda, Clientes, Serviços, Mais) — abas placeholder
6. **Novo Agendamento (modal/sheet)** (`/app` → sheet) — fluxo em etapas: cliente → serviço → profissional → data/hora → confirmação. Implementado como `Sheet` do shadcn em mobile.

## Detalhes técnicos

- Stack atual: TanStack Start + Tailwind v4 + shadcn. Sem Lovable Cloud nesta etapa.
- Dados mock em `src/lib/mock-data.ts` (profissionais, clientes, serviços, agendamentos do dia).
- Tokens de cor/gradiente/sombra em `src/styles.css` (semânticos: `--primary`, `--primary-glow`, `--accent`, `--gradient-primary`, `--shadow-glow`).
- Fontes via `@fontsource/playfair-display` e `@fontsource/inter` (sem CDN, sem editar index.html). Adicionadas em `src/main.tsx` (ou equivalente do template).
- Animações com `framer-motion` (stagger nos cards da agenda, scale nos chips).
- Ícones: `lucide-react`.
- Bottom navigation custom em `src/components/bottom-nav.tsx`.
- Componentes shadcn usados: Button, Sheet, Tabs, Badge, Avatar, Input, Card, Dialog, Separator, ScrollArea.
- Estado do "novo agendamento" mantido localmente (useState) — ao confirmar, insere no array mock e mostra toast (sonner).
- Viewport: forço preview mobile no início.
- Rotas (TanStack file-based):
  - `src/routes/index.tsx` (splash)
  - `src/routes/login.tsx`
  - `src/routes/cadastro.tsx`
  - `src/routes/onboarding.tsx`
  - `src/routes/app.tsx` (dashboard/agenda + sheet de novo agendamento)
- Logo: upload via lovable-assets a partir de `/mnt/user-uploads/logo_SuaAgendaPro.png`.

## Fora de escopo (próximas iterações)

- Site público do profissional
- Fluxo de agendamento do cliente
- Configurações/Personalização de tema
- Lovable Cloud (auth real, banco, persistência)
- Integração WhatsApp / lembretes
