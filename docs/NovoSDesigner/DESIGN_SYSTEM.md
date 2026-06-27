# Design System - SuaAgenda.Pro
## Galeria de Templates & Guia de Implementação

---

## 📑 Índice
1. [Visão Geral](#visão-geral)
2. [Templates & Categorias](#templates--categorias)
3. [Paletas de Cores](#paletas-de-cores)
4. [Tipografias](#tipografias)
5. [Componentes](#componentes)
6. [Layout & Seções](#layout--seções)
7. [Implementação Técnica](#implementação-técnica)
8. [Fluxo de Customização](#fluxo-de-customização)

---

## Visão Geral

### Propósito
Sistema de 13 templates profissionais para páginas públicas de profissionais da beleza e wellness, permitindo:
- ✅ Seleção de template visual
- ✅ Customização individual de cores e fontes
- ✅ Preservação de dados entre mudanças de template
- ✅ Seções condicionais por template

### Estrutura
- **5 Categorias**: LUXE, BLOOM, GLOW HOT, BOLD, PURE
- **13 Templates**: Variações de paleta dentro de cada categoria
- **100% Google Fonts**: Tipografias gratuitas e premium
- **Customizável**: Cores e fontes sobrepõem o tema padrão

---

## Templates & Categorias

### LUXE (3 Templates)
Elegância sofisticada para profissionais premium.

#### Luxe Gold
- **Cores**: Preto (#1a1a1a) + Ouro (#d4af37)
- **Tipografia**: Playfair Display (heading), Lato (body), Cormorant Garamond (accent)
- **Ideal para**: Esteticistas premium, Hair designers, Consultores de imagem
- **Características**: Minimalista, sombras médias, espaçamento normal

#### Luxe Copper
- **Cores**: Preto (#1a1a1a) + Cobre (#b8860b)
- **Tipografia**: Playfair Display, Lato, Cormorant Garamond
- **Ideal para**: Esteticistas premium, Barbeiros upscale
- **Características**: Minimalista, sombras médias, espaçamento normal

#### Luxe Silver
- **Cores**: Preto (#1a1a1a) + Prata (#c0c0c0)
- **Tipografia**: Playfair Display, Lato, Cormorant Garamond
- **Ideal para**: Clínicas premium, Dentistas sofisticados
- **Características**: Minimalista, sombras médias, espaçamento normal

---

### BLOOM (2 Templates)
Delicadeza natural com rosa claro. Aconchego e feminilidade.

#### Bloom Soft
- **Cores**: Rosa Claro (#f5e6e3) + Marrom (#d4a5a5)
- **Tipografia**: Montserrat (heading), Open Sans (body), Great Vibes (accent)
- **Ideal para**: Beauty coaches, Skincare specialists, Bem-estar
- **Características**: Cards arredondados (16px), botões 24px, sombra suave, espaçamento amplo

#### Bloom Pearl
- **Cores**: Rosa Claro (#f5e6e3) + Bege Quente (#e8d4c8)
- **Tipografia**: Montserrat, Open Sans, Great Vibes
- **Ideal para**: Manicure & pedicure, Estética corporal
- **Características**: Cards arredondados (16px), botões 24px, sombra suave, espaçamento amplo

---

### GLOW HOT (2 Templates)
Feminino vibrante com rosa hot. Moderno e divertido.

#### Glow Pink
- **Cores**: Rosa Hot (#ff1493) + Roxo (#9370db)
- **Tipografia**: Poppins (heading), Quicksand (body), Satisfy (accent)
- **Ideal para**: Nail art designers, Manicure criativo, Styling & moda
- **Características**: Cards 12px, botões 20px, sombra média, espaçamento normal

#### Glow Coral
- **Cores**: Rosa Hot (#ff1493) + Coral (#ff7f50)
- **Tipografia**: Poppins, Quicksand, Satisfy
- **Ideal para**: Estética facial, Maquiagem criativa
- **Características**: Cards 12px, botões 20px, sombra média, espaçamento normal

---

### BOLD (3 Templates)
Moderno e vibrante. Visual dinâmico e contemporâneo.

#### Bold Teal
- **Cores**: Teal (#008b8b) + Verde Menta (#20b2aa)
- **Tipografia**: Montserrat (heading), Inter (body), Poppins (accent)
- **Ideal para**: Barbeiros modernos, Salões jovens, Pet grooming
- **Características**: Cards 12px, botões 8px, sombra média, espaçamento normal

#### Bold Emerald
- **Cores**: Verde Escuro (#1b4332) + Ouro (#d4af37)
- **Tipografia**: Montserrat, Inter, Poppins
- **Ideal para**: Salões premium modernos, Spa boutique
- **Características**: Cards 12px, botões 8px, sombra média, espaçamento normal

#### Bold Ocean
- **Cores**: Azul Escuro (#0a3d62) + Turquesa (#1abc9c)
- **Tipografia**: Montserrat, Inter, Poppins
- **Ideal para**: Clínicas modernas, Dentistas jovens
- **Características**: Cards 12px, botões 8px, sombra média, espaçamento normal

---

### PURE (2 Templates)
Profissional limpo e acessível. Foco em usabilidade.

#### Pure Neutral
- **Cores**: Bege (#f5f5f5) + Cinza (#d4d4d4)
- **Tipografia**: Roboto (heading), Open Sans (body), Lato (accent)
- **Ideal para**: Dentistas, Clínicas, Fisioterapia, Iniciantes
- **Características**: Cards 6px, botões 4px, sombra suave, espaçamento compacto

#### Pure Slate
- **Cores**: Cinza (#e8eef2) + Azul Suave (#b8c5d6)
- **Tipografia**: Roboto, Open Sans, Lato
- **Ideal para**: Clínicas médicas, Consultórios, Profissional sereno
- **Características**: Cards 6px, botões 4px, sombra suave, espaçamento compacto

---

## Paletas de Cores

### Estrutura de Cores por Template

Cada template contém 6 cores principais + 3 utilitárias:

```
Primary:        Cor dominante (fundo/hero)
Secondary:      Destaque (buttons/accents)
Accent:         Cor de complemento
Background:     Fundo geral
Text:           Texto principal
TextSecondary:  Texto auxiliar
Border:         Bordas (automático)
Success:        Feedback positivo
Warning:        Aviso
Error:          Erro
```

### Paletas Completas

#### LUXE Gold
```
Primary:        #1a1a1a (Preto profundo)
Secondary:      #d4af37 (Ouro clássico)
Accent:         #e8dcc8 (Bege claro)
Background:     #0d0d0d (Preto ultra-escuro)
Text:           #ffffff (Branco)
TextSecondary:  #b0b0b0 (Cinza médio)
```

#### BLOOM Soft
```
Primary:        #f5e6e3 (Rosa muito claro)
Secondary:      #d4a5a5 (Rosa suave)
Accent:         #8b6f47 (Marrom terroso)
Background:     #faf8f7 (Branco quente)
Text:           #3d3d3d (Cinza escuro)
TextSecondary:  #8b8b8b (Cinza médio)
```

#### GLOW Pink
```
Primary:        #ff1493 (Rosa hot)
Secondary:      #9370db (Roxo médio)
Accent:         #ffc0cb (Rosa claro)
Background:     #fff5f8 (Rosa muito claro)
Text:           #2d2d2d (Preto suave)
TextSecondary:  #666666 (Cinza médio)
```

#### BOLD Teal
```
Primary:        #008b8b (Teal escuro)
Secondary:      #20b2aa (Teal médio)
Accent:         #40e0d0 (Verde menta)
Background:     #f0f8f8 (Teal muito claro)
Text:           #1a1a1a (Preto)
TextSecondary:  #4a4a4a (Cinza escuro)
```

#### PURE Neutral
```
Primary:        #f5f5f5 (Bege claro)
Secondary:      #d4d4d4 (Cinza médio)
Accent:         #999999 (Cinza escuro)
Background:     #ffffff (Branco puro)
Text:           #2d2d2d (Preto suave)
TextSecondary:  #666666 (Cinza médio)
```

---

## Tipografias

### Google Fonts Utilizadas

#### Heading (Títulos H1, H2, H3)
- **Playfair Display** (LUXE) - Elegante, serif, 400/700
- **Montserrat** (BLOOM, BOLD) - Moderno, sans-serif, 400/700
- **Poppins** (GLOW HOT) - Divertido, sans-serif, 400/700
- **Roboto** (PURE) - Limpo, sans-serif, 400/700

#### Body (Texto principal, parágrafos)
- **Lato** (LUXE) - Legível, sans-serif, 400/500
- **Open Sans** (BLOOM, PURE) - Acessível, sans-serif, 400/500
- **Quicksand** (GLOW HOT) - Amigável, sans-serif, 400/500
- **Inter** (BOLD) - Moderno, sans-serif, 400/500

#### Accent (Detalhes, CTA)
- **Cormorant Garamond** (LUXE) - Refinado, serif, 400/600
- **Great Vibes** (BLOOM) - Script, handwriting, 400
- **Satisfy** (GLOW HOT) - Elegante script, 400
- **Lato** (PURE) - Consistente, sans-serif, 400/600

### Tamanhos de Fonte por Categoria

#### LUXE / BOLD
```
H1: 48px (font-weight: 700)
H2: 36px (font-weight: 600)
H3: 24px (font-weight: 600)
Body: 16px (font-weight: 400)
Small: 12px (font-weight: 400)
```

#### BLOOM
```
H1: 44px (font-weight: 700)
H2: 32px (font-weight: 600)
H3: 22px (font-weight: 600)
Body: 15px (font-weight: 400)
Small: 12px (font-weight: 400)
```

#### GLOW HOT
```
H1: 46px (font-weight: 700)
H2: 34px (font-weight: 600)
H3: 23px (font-weight: 600)
Body: 15px (font-weight: 400)
Small: 12px (font-weight: 400)
```

#### PURE
```
H1: 40px (font-weight: 700)
H2: 32px (font-weight: 600)
H3: 20px (font-weight: 600)
Body: 15px (font-weight: 400)
Small: 12px (font-weight: 400)
```

---

## Componentes

### Header
**Variações por Template**

#### Premium (LUXE)
- Fundo: Cor primária com imagem de fundo
- Foto: Circular com borda secundária (border: 4px)
- Texto: Branco, tipografia heading grande
- Sombra: Medium drop shadow
- Rating: Ícone de estrela + número

#### Dynamic (BLOOM, GLOW HOT, BOLD)
- Fundo: Gradiente ou cor única
- Foto: Arredondada (border-radius: 50%)
- Texto: Cor do tema, tipografia heading
- Sombra: Suave
- Rating + Redes sociais: Visível no header

#### Simple (PURE)
- Fundo: Cor primária suave
- Foto: Quadrada com corners arredondados (8px)
- Texto: Cinza escuro, tipografia neutra
- Sombra: Mínima
- Rating: Pequeno, discreto

### Cards de Serviços

**Border Radius por Template**
```
LUXE:       8px (Sharp elegance)
BLOOM:      16px (Soft rounded)
GLOW HOT:   12px (Playful)
BOLD:       12px (Modern)
PURE:       6px (Minimal)
```

**Sombra por Template**
```
LUXE:       box-shadow: 0 8px 24px rgba(0,0,0,0.2)
BLOOM:      box-shadow: 0 2px 8px rgba(0,0,0,0.08)
GLOW HOT:   box-shadow: 0 4px 12px rgba(255,20,147,0.15)
BOLD:       box-shadow: 0 4px 16px rgba(0,0,0,0.12)
PURE:       box-shadow: 0 1px 4px rgba(0,0,0,0.08)
```

### Botões

**Border Radius por Template**
```
LUXE:       4px (Sharp)
BLOOM:      24px (Fully rounded)
GLOW HOT:   20px (Rounded)
BOLD:       8px (Subtle round)
PURE:       4px (Sharp)
```

**Padding**
```
LUXE/BOLD/PURE:     16px 32px
BLOOM/GLOW HOT:     14px 28px
```

**Hover States**
```
Todas: opacity: 0.9 + scale(1.02)
Transição: 200ms ease
```

### Cards de Avaliações

**Layout**
- Avatar: 40px circular, inicial do nome ou foto
- Nome: font-weight 600, cor text
- Rating: Ícones de estrela (⭐), cor accent
- Texto: font-weight 400, cor textSecondary
- Data: Pequena, cor border

---

## Layout & Seções

### Seções Exibidas por Template

```
                LUXE  BLOOM GLOW  BOLD  PURE
Portfolio       ✅    ✅    ✅    ✅    ❌
About           ✅    ✅    ✅    ✅    ✅
Services        ✅    ✅    ✅    ✅    ✅
Reviews         ✅    ✅    ✅    ✅    ✅
Contact         ✅    ✅    ✅    ✅    ✅
Location        ✅    ✅    ✅    ✅    ✅
Floating CTA    ❌    ✅    ✅    ✅    ✅
```

### Ordem de Seções
1. Header (Foto + Nome + Rating)
2. Redes Sociais (opcional no header)
3. Portfolio (se aplicável)
4. Sobre
5. Serviços
6. Avaliações
7. Localização/Contato
8. Footer

---

## Implementação Técnica

### 1. Estrutura de Dados

```typescript
interface Professional {
  id: string;
  name: string;
  template_selecionado: ThemeId; // "luxe_gold" | "bloom_soft" | ...
  colors: {
    primary?: string;        // Sobrepõe tema
    secondary?: string;
    accent?: string;
    // ... outros
  };
  typography: {
    heading_family?: string;
    body_family?: string;
    // ... outros
  };
  portfolio: PortfolioItem[];
  servicos: Service[];
  avaliacoes: Review[];
  sobre: string;
  endereco: Address;
}
```

### 2. Hook useTheme()

```typescript
import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  const context = useContext(ThemeContext);
  return context; // Retorna tema + colors customizadas
}
```

### 3. Provider

```typescript
export function ThemeProvider({ professional, children }) {
  const baseTheme = THEMES[professional.template_selecionado];
  const finalColors = mergeThemeWithCustomColors(
    baseTheme.colors,
    professional.colors
  );
  
  return (
    <ThemeContext.Provider value={{ ...baseTheme, colors: finalColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 4. Componente Exemplo

```typescript
export function ServiceCard({ service }) {
  const { colors, components } = useTheme();
  
  return (
    <div
      style={{
        backgroundColor: colors.primary,
        borderRadius: components.cardRadius,
        boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
      }}
    >
      {/* Conteúdo */}
    </div>
  );
}
```

### 5. Integração no Banco de Dados

**Nova Coluna**
```sql
ALTER TABLE professionals ADD COLUMN template_selecionado VARCHAR(50) DEFAULT 'luxe_gold';
```

**Query de Atualização**
```typescript
await supabase
  .from('professionals')
  .update({ template_selecionado: 'bloom_soft' })
  .eq('id', professionalId);
```

---

## Fluxo de Customização

### Cenário 1: Profissional Novo
1. Cria conta
2. Recebe página padrão com template **Pure Neutral**
3. Pode escolher outro template imediatamente
4. Template padrão = paleta pré-definida
5. Profissional pode customizar cores (optional)

### Cenário 2: Trocar de Template
1. Profissional vai em Configurações > Tema
2. Vê galeria visual dos 13 templates
3. Clica em um template
4. Sistema:
   - ✅ Salva novo template_selecionado no banco
   - ✅ Carrega paleta padrão do novo template
   - ✅ Cores customizadas ANTIGAS são pausadas (não deletadas!)
   - ✅ Página re-renderiza com novo tema

### Cenário 3: Voltar ao Tema Anterior
1. Profissional volta ao template antigo (ex: Bloom Soft)
2. Sistema:
   - ✅ Carrega as cores customizadas que ele tinha em Bloom Soft
   - ✅ Página re-renderiza com as cores salvas

### Cenário 4: Customizar Cores Dentro de um Template
1. Profissional está em Luxe Gold
2. Vai em Configurações > Aparência
3. Muda cor primária de preto para azul navy
4. Sistema:
   - ✅ Sobrepõe cor customizada na paleta
   - ✅ Salva no banco (em campo colors)
   - ✅ Se trocar de template depois, essa cor volta quando voltasse a Luxe

---

## Checklist de Implementação

### Fase 1: Setup
- [ ] Instalar dependencies (Google Fonts)
- [ ] Criar `themes.config.ts`
- [ ] Criar `ThemeProvider.tsx`
- [ ] Criar `useTheme.ts` hook

### Fase 2: Componentes
- [ ] Adaptar Header
- [ ] Adaptar Cards de Serviço
- [ ] Adaptar Cards de Avaliação
- [ ] Adaptar Botões

### Fase 3: Banco de Dados
- [ ] Adicionar coluna `template_selecionado`
- [ ] Criar migration
- [ ] Garantir valores padrão

### Fase 4: Interface de Seleção
- [ ] Criar página de galeria de temas
- [ ] Criar botão de salvar/aplicar
- [ ] Criar confirmação de mudança

### Fase 5: Testes
- [ ] Testar cada template visualmente
- [ ] Testar mudança de template
- [ ] Testar customização de cores
- [ ] Testar preservation de dados

---

## Próximos Passos

1. ✅ **Artifact React** — Preview interativo (concluído)
2. ✅ **themes.config.ts** — Código TypeScript (concluído)
3. ✅ **Design System Doc** — Este documento
4. 📌 **Guia de Implementação Técnica** — Passo-a-passo em React
5. 📌 **Testes e Refinamento** — Validação visual

---

**Design System v1.0 — Junho 2026**
**SuaAgenda.Pro - Templates & Customização**
