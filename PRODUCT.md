# Product

## Register

product

## Users

Profissionais autônomos da beleza (manicures, cabeleireiras, esteticistas, lash designers) que gerenciam agenda, clientes e pagamentos no celular, entre atendimentos.

## Product Purpose

SuaAgenda.Pro centraliza agendamentos, clientes, serviços e finanças em um app mobile-first confiável — menos fricção operacional, mais tempo com a cliente.

## Brand Personality

Calmo, premium, acolhedor, competente. Estúdio de beleza de alto padrão, não startup genérica. Três palavras: **sereno · preciso · cuidadoso**.

## Anti-references

- Dashboard “AI slop”: KPIs em arco-íris (verde/roxo/âmbar), gradientes em todo botão, cards dentro de cards, glow exagerado
- Inter + gradiente roxo/rosa em tudo, ícones decorativos gigantes sem função
- Landing SaaS template (Hero + 3 cards + purple CTA)
- Tipografia display em labels, botões e dados tabulares
- Animações bounce/elastic e badges “Premium” gratuitos

## Design Principles

1. **Design serve a tarefa** — a profissional está entre clientes; interface legível em 2 segundos.
2. **Accent com intenção** — cor do tema (personalização) só em ações primárias, seleção e dados-chave; superfícies neutras.
3. **Editorial nos títulos, utilitário no resto** — Playfair (ou fonte escolhida) só em títulos de página; UI em sans.
4. **Superfícies antes de gradientes** — bordas sutis, sombras leves, hierarquia por tipografia — não por efeitos.
5. **Consistência no app operacional** — Agenda, Clientes, Serviços e Mais compartilham o mesmo vocabulário visual (shell, nav, superfícies). O **Dashboard** é área administrativa separada — fora do escopo deste craft.

## Brand assets

- `src/assets/brand/` — logos otimizados (stack, horizontal, icon) em PNG + WebP
- `public/icon-*.png`, `favicon.png`, `apple-touch-icon.png` — PWA / favicon
- Regenerar: `npm run brand:optimize`
- Componentes: `BrandLogo` (variantes) e `BrandMark` (ícone 3D)
