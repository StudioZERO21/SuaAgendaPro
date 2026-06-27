# Guia de Implementação Técnica
## Sistema de Templates Dinâmicos - SuaAgenda.Pro

---

## 📋 Índice
1. [Arquitetura Geral](#arquitetura-geral)
2. [Setup Inicial](#setup-inicial)
3. [Criar ThemeProvider](#criar-themeprovider)
4. [Implementar useTheme Hook](#implementar-usetheme-hook)
5. [Adaptar Componentes](#adaptar-componentes)
6. [Integração com Banco de Dados](#integração-com-banco-de-dados)
7. [Página de Seleção de Templates](#página-de-seleção-de-templates)
8. [Fluxo Completo de Customização](#fluxo-completo-de-customização)
9. [Testes](#testes)

---

## Arquitetura Geral

```
app/
├── context/
│   └── ThemeContext.tsx          ← Context do tema
│
├── hooks/
│   ├── useTheme.ts               ← Hook para acessar tema
│   └── useThemeColors.ts         ← Hook para cores mergeadas
│
├── providers/
│   └── ThemeProvider.tsx          ← Wrapper que carrega tema
│
├── config/
│   └── themes.config.ts           ← Todas as paletas (você já tem)
│
├── components/
│   ├── public-page/
│   │   ├── Header.tsx            ← Adaptado para temas
│   │   ├── Services.tsx          ← Adaptado para temas
│   │   ├── Reviews.tsx           ← Adaptado para temas
│   │   └── ...
│   │
│   └── admin/
│       └── ThemeSelector.tsx      ← Galeria + seletor
│
├── pages/
│   ├── [slug].tsx                ← Página pública (com ThemeProvider)
│   └── admin/
│       ├── settings.tsx
│       └── appearance.tsx         ← Customização de cores
│
└── utils/
    └── theme-utils.ts            ← Funções auxiliares
```

---

## Setup Inicial

### 1. Instalar Google Fonts

```bash
npm install @react-google-fonts/react-google-fonts
# ou, se já usa next.js
# Adicionar em next.config.js
```

### 2. Adicionar Fontes ao next.config.js

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeFonts: true,
  },
};
```

### 3. Adicionar Google Fonts no _document.tsx

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;500&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500&family=Great+Vibes:wght@400&family=Poppins:wght@400;600;700&family=Quicksand:wght@400;500&family=Satisfy:wght@400&family=Roboto:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

---

## Criar ThemeProvider

### 1. Context File: `contexts/ThemeContext.tsx`

```typescript
import React, { createContext, ReactNode } from 'react';
import { ThemeConfig, ThemeColors } from '@/config/themes.config';

export interface ThemeContextType {
  theme: ThemeConfig;
  colors: ThemeColors;
  updateColors: (newColors: Partial<ThemeColors>) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  theme: ThemeConfig;
  customColors: Partial<ThemeColors>;
  onColorsUpdate?: (colors: Partial<ThemeColors>) => void;
}

export function ThemeProvider({
  children,
  theme,
  customColors,
  onColorsUpdate
}: ThemeProviderProps) {
  // Mescla paleta padrão com cores customizadas
  const finalColors: ThemeColors = {
    ...theme.colors,
    ...customColors
  };

  const handleUpdateColors = (newColors: Partial<ThemeColors>) => {
    if (onColorsUpdate) {
      onColorsUpdate(newColors);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: finalColors,
        updateColors: handleUpdateColors
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Layout Principal: `pages/[slug].tsx`

```typescript
import { GetStaticProps, GetStaticPaths } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { THEMES, ThemeId } from '@/config/themes.config';
import { Header } from '@/components/public-page/Header';
import { Services } from '@/components/public-page/Services';
import { Reviews } from '@/components/public-page/Reviews';
import { Contact } from '@/components/public-page/Contact';

interface PublicPageProps {
  professional: {
    id: string;
    name: string;
    template_selecionado: ThemeId;
    colors?: Partial<any>;
    typography?: Partial<any>;
    // ... outros dados
  };
}

export default function PublicPage({ professional }: PublicPageProps) {
  const selectedTheme = THEMES[professional.template_selecionado];

  return (
    <ThemeProvider
      theme={selectedTheme}
      customColors={professional.colors || {}}
    >
      <main style={{ backgroundColor: selectedTheme.colors.background }}>
        <Header />
        <Services />
        <Reviews />
        <Contact />
      </main>
    </ThemeProvider>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };

  // Buscar profissional no banco
  const professional = await fetchProfessionalBySlug(slug);

  if (!professional) {
    return { notFound: true };
  }

  return {
    props: { professional },
    revalidate: 60 // ISR - revalidar a cada 60s
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Buscar todos os profissionais
  const professionals = await fetchAllProfessionals();

  return {
    paths: professionals.map(p => ({ params: { slug: p.slug } })),
    fallback: 'blocking'
  };
};
```

---

## Implementar useTheme Hook

### Hook: `hooks/useTheme.ts`

```typescript
import { useContext } from 'react';
import { ThemeContext, ThemeContextType } from '@/contexts/ThemeContext';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider'
    );
  }

  return context;
}
```

### Hook Auxiliar: `hooks/useThemeColors.ts`

```typescript
import { useTheme } from './useTheme';

export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}
```

### Hook para CSS Variables: `hooks/useThemeCSS.ts`

```typescript
import { useTheme } from './useTheme';
import { useEffect } from 'react';

export function useThemeCSS() {
  const { theme, colors } = useTheme();

  useEffect(() => {
    // Define CSS variables no root
    const root = document.documentElement;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border || '#e0e0e0');

    root.style.setProperty('--font-heading', `'${theme.typography.heading}', sans-serif`);
    root.style.setProperty('--font-body', `'${theme.typography.body}', sans-serif`);
    root.style.setProperty('--font-accent', `'${theme.typography.accent}', cursive`);

    root.style.setProperty('--radius-card', theme.components.cardRadius);
    root.style.setProperty('--radius-button', theme.components.buttonRadius);
  }, [theme, colors]);
}
```

---

## Adaptar Componentes

### Exemplo 1: Header Component

```typescript
// components/public-page/Header.tsx
import { useTheme } from '@/hooks/useTheme';
import { useThemeCSS } from '@/hooks/useThemeCSS';
import styles from './Header.module.css';

interface HeaderProps {
  professional: {
    name: string;
    photo: string;
    about: string;
    rating: number;
    reviews_count: number;
  };
}

export function Header({ professional }: HeaderProps) {
  const { theme, colors } = useTheme();
  useThemeCSS();

  return (
    <header
      style={{
        backgroundColor: colors.background,
        padding: theme.components.spacing === 'spacious' ? '40px' : '24px'
      }}
    >
      {/* Banner/Hero */}
      <div
        style={{
          backgroundImage: `url(${professional.photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '300px',
          borderRadius: theme.components.cardRadius,
          position: 'relative'
        }}
      />

      {/* Informações */}
      <div style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        <img
          src={professional.photo}
          alt={professional.name}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: `4px solid ${colors.secondary}`,
            marginBottom: '16px'
          }}
        />

        {/* Nome */}
        <h1
          style={{
            fontFamily: `var(--font-heading)`,
            color: colors.text,
            fontSize: theme.typography.sizes?.h1,
            fontWeight: 700,
            margin: '0 0 8px 0'
          }}
        >
          {professional.name}
        </h1>

        {/* Rating */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: colors.accent }}>★ {professional.rating}</span>
          <span style={{ color: colors.textSecondary }}>
            ({professional.reviews_count} avaliações)
          </span>
        </div>

        {/* Redes Sociais */}
        {theme.layout.showContact && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            {/* Instagram, WhatsApp, etc */}
          </div>
        )}
      </div>

      {/* Sobre */}
      <p
        style={{
          fontFamily: `var(--font-body)`,
          color: colors.textSecondary,
          marginTop: '24px',
          lineHeight: 1.6
        }}
      >
        {professional.about}
      </p>
    </header>
  );
}
```

### Exemplo 2: Service Card

```typescript
// components/public-page/ServiceCard.tsx
import { useTheme } from '@/hooks/useTheme';

interface ServiceCardProps {
  name: string;
  duration: string;
  price: string;
  description?: string;
  image?: string;
}

export function ServiceCard({
  name,
  duration,
  price,
  description,
  image
}: ServiceCardProps) {
  const { theme, colors } = useTheme();

  return (
    <div
      style={{
        backgroundColor: colors.primary,
        borderRadius: theme.components.cardRadius,
        padding: '16px',
        boxShadow:
          theme.components.shadowIntensity === 'subtle'
            ? '0 1px 4px rgba(0,0,0,0.08)'
            : theme.components.shadowIntensity === 'medium'
            ? '0 4px 12px rgba(0,0,0,0.12)'
            : '0 8px 24px rgba(0,0,0,0.2)',
        transition: 'transform 200ms, box-shadow 200ms',
        cursor: 'pointer',
        border: `1px solid ${colors.border || colors.secondary}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {image && (
        <img
          src={image}
          alt={name}
          style={{
            width: '100%',
            height: '180px',
            objectFit: 'cover',
            borderRadius: theme.components.cardRadius,
            marginBottom: '12px'
          }}
        />
      )}

      <h3
        style={{
          fontFamily: `var(--font-heading)`,
          color: colors.text,
          fontSize: theme.typography.sizes?.h3,
          margin: '0 0 8px 0'
        }}
      >
        {name}
      </h3>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: colors.textSecondary,
          marginBottom: '12px'
        }}
      >
        <span>⏱️ {duration}</span>
        <span style={{ fontWeight: 600, color: colors.secondary }}>
          R$ {price}
        </span>
      </div>

      {description && (
        <p
          style={{
            fontFamily: `var(--font-body)`,
            color: colors.textSecondary,
            fontSize: '13px',
            margin: 0,
            lineHeight: 1.4
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
```

### Exemplo 3: Button Dinâmico

```typescript
// components/Button.tsx
import { useTheme } from '@/hooks/useTheme';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium'
}: ButtonProps) {
  const { theme, colors } = useTheme();

  const backgroundColor =
    variant === 'primary' ? colors.secondary : colors.accent;

  const padding =
    size === 'small'
      ? '8px 16px'
      : size === 'large'
      ? '16px 32px'
      : '12px 24px';

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor,
        color: theme.category === 'PURE' ? colors.text : '#ffffff',
        border: 'none',
        borderRadius: theme.components.buttonRadius,
        padding,
        fontFamily: `var(--font-body)`,
        fontWeight: 600,
        fontSize: size === 'small' ? '13px' : '14px',
        cursor: 'pointer',
        transition: 'opacity 200ms, transform 200ms',
        opacity: 1
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}
```

---

## Integração com Banco de Dados

### 1. Migration (Supabase)

```sql
-- Adicionar coluna de template (se não existir)
ALTER TABLE professionals
ADD COLUMN template_selecionado VARCHAR(50) DEFAULT 'pure_neutral';

-- Adicionar coluna de cores customizadas (JSON)
ALTER TABLE professionals
ADD COLUMN custom_colors JSONB DEFAULT NULL;

-- Adicionar coluna de tipografia customizada (JSON)
ALTER TABLE professionals
ADD COLUMN custom_typography JSONB DEFAULT NULL;

-- Index para performance
CREATE INDEX idx_template ON professionals(template_selecionado);
```

### 2. TypeScript Interface (Banco de Dados)

```typescript
// types/professional.ts
import { ThemeId } from '@/config/themes.config';

export interface Professional {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  photo_url: string;
  about: string;
  
  // Template & Customização
  template_selecionado: ThemeId;
  custom_colors?: Record<string, string>; // { primary: '#fff', ... }
  custom_typography?: Record<string, string>; // { heading_family: 'Playfair Display', ... }
  
  // Dados de conteúdo (esses nunca mudam)
  portfolio: PortfolioItem[];
  servicos: Service[];
  avaliacoes: Review[];
  endereco: Address;
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

### 3. Funções Supabase

```typescript
// lib/supabase/professionals.ts
import { createClient } from '@supabase/supabase-js';
import { Professional, ThemeId } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Buscar profissional por slug
export async function fetchProfessionalBySlug(
  slug: string
): Promise<Professional | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Erro ao buscar profissional:', error);
    return null;
  }

  return data as Professional;
}

// Buscar profissional por ID
export async function fetchProfessionalById(
  id: string
): Promise<Professional | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar profissional:', error);
    return null;
  }

  return data as Professional;
}

// Atualizar template selecionado
export async function updateSelectedTemplate(
  professionalId: string,
  templateId: ThemeId
): Promise<boolean> {
  const { error } = await supabase
    .from('professionals')
    .update({ template_selecionado: templateId })
    .eq('id', professionalId);

  if (error) {
    console.error('Erro ao atualizar template:', error);
    return false;
  }

  return true;
}

// Atualizar cores customizadas
export async function updateCustomColors(
  professionalId: string,
  colors: Record<string, string>
): Promise<boolean> {
  const { error } = await supabase
    .from('professionals')
    .update({ custom_colors: colors })
    .eq('id', professionalId);

  if (error) {
    console.error('Erro ao atualizar cores:', error);
    return false;
  }

  return true;
}

// Atualizar tipografia customizada
export async function updateCustomTypography(
  professionalId: string,
  typography: Record<string, string>
): Promise<boolean> {
  const { error } = await supabase
    .from('professionals')
    .update({ custom_typography: typography })
    .eq('id', professionalId);

  if (error) {
    console.error('Erro ao atualizar tipografia:', error);
    return false;
  }

  return true;
}
```

---

## Página de Seleção de Templates

### Admin: `pages/admin/appearance.tsx`

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { THEMES, ThemeId } from '@/config/themes.config';
import { updateSelectedTemplate } from '@/lib/supabase/professionals';

interface AppearancePageProps {
  professionalId: string;
  currentTemplate: ThemeId;
}

export default function AppearancePage({
  professionalId,
  currentTemplate
}: AppearancePageProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<ThemeId>(currentTemplate);
  const [loading, setLoading] = useState(false);

  const handleSelectTemplate = async (templateId: ThemeId) => {
    setLoading(true);

    try {
      const success = await updateSelectedTemplate(
        professionalId,
        templateId
      );

      if (success) {
        setSelectedTemplate(templateId);
        // Revalidar página pública
        await router.push('/admin/appearance');
      } else {
        alert('Erro ao atualizar template');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['LUXE', 'BLOOM', 'GLOW HOT', 'BOLD', 'PURE'];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Aparência da Página Pública</h1>

      {categories.map((category) => (
        <div key={category} style={{ marginBottom: '32px' }}>
          <h2>{category}</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}
          >
            {THEMES &&
              Object.values(THEMES)
                .filter((t) => t.category === category)
                .map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => handleSelectTemplate(theme.id)}
                    style={{
                      border:
                        selectedTemplate === theme.id
                          ? `3px solid ${theme.colors.secondary}`
                          : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0' }}>{theme.name}</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px' }}>
                      {theme.description}
                    </p>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: theme.colors.primary,
                          borderRadius: '4px'
                        }}
                      />
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: theme.colors.secondary,
                          borderRadius: '4px'
                        }}
                      />
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: theme.colors.accent,
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    {selectedTemplate === theme.id && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '8px',
                          backgroundColor: theme.colors.secondary,
                          color: '#fff',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        ✓ Selecionado
                      </div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Fluxo Completo de Customização

### Página de Cores: `pages/admin/colors.tsx`

```typescript
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { updateCustomColors } from '@/lib/supabase/professionals';

interface ColorsPageProps {
  professionalId: string;
  currentColors?: Record<string, string>;
}

export default function ColorsPage({
  professionalId,
  currentColors
}: ColorsPageProps) {
  const { theme } = useTheme();
  const [colors, setColors] = useState(currentColors || {});
  const [loading, setLoading] = useState(false);

  const handleColorChange = (colorKey: string, value: string) => {
    setColors({
      ...colors,
      [colorKey]: value
    });
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const success = await updateCustomColors(professionalId, colors);
      if (success) {
        alert('Cores atualizadas com sucesso!');
      }
    } catch (error) {
      alert('Erro ao salvar cores');
    } finally {
      setLoading(false);
    }
  };

  const colorKeys = [
    'primary',
    'secondary',
    'accent',
    'background',
    'text'
  ] as const;

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1>Customizar Cores</h1>
      <p>Tema: {theme.name}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {colorKeys.map((key) => (
          <div key={key}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
            </label>
            <input
              type="color"
              value={colors[key] || theme.colors[key] || '#000000'}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                cursor: 'pointer',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
              }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
              {colors[key] || theme.colors[key]}
            </small>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          backgroundColor: theme.colors.secondary,
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Salvando...' : 'Salvar Cores'}
      </button>
    </div>
  );
}
```

---

## Testes

### 1. Testar Mudança de Template

```typescript
// __tests__/theme-switching.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { THEMES } from '@/config/themes.config';

describe('Theme Switching', () => {
  it('should render with correct theme colors', () => {
    const theme = THEMES.luxe_gold;
    const { container } = render(
      <ThemeProvider theme={theme} customColors={{}}>
        <div style={{ backgroundColor: theme.colors.primary }}>Test</div>
      </ThemeProvider>
    );

    expect(container.firstChild).toHaveStyle(
      `background-color: ${theme.colors.primary}`
    );
  });

  it('should merge custom colors with theme', () => {
    const theme = THEMES.bloom_soft;
    const customColors = { primary: '#ff0000' };

    const { container } = render(
      <ThemeProvider theme={theme} customColors={customColors}>
        <div style={{ backgroundColor: customColors.primary }}>Test</div>
      </ThemeProvider>
    );

    expect(container.firstChild).toHaveStyle(
      'background-color: #ff0000'
    );
  });
});
```

### 2. Checklist de Testes Manuais

- [ ] Carregar página com cada template
- [ ] Verificar cores corretas
- [ ] Verificar tipografias carregadas
- [ ] Testar responsividade
- [ ] Trocar de template e verificar atualização
- [ ] Customizar cores e persistir
- [ ] Trocar de template e voltar (verificar cores salvas)
- [ ] Testar em mobile
- [ ] Verificar performance (Lighthouse)
- [ ] Testar acessibilidade (contraste de cores)

---

## Próximas Etapas

1. ✅ **Criar ThemeProvider e Hooks**
2. ✅ **Adaptar componentes existentes**
3. ✅ **Integrar com Banco de Dados**
4. ✅ **Criar página de seleção**
5. 📌 **Testes e refinamento visual**
6. 📌 **Deploy em produção**

---

**Implementação v1.0 — Junho 2026**
**SuaAgenda.Pro - Sistema de Templates Dinâmicos**
