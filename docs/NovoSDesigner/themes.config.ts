/**
 * THEMES CONFIGURATION
 * SuaAgenda.Pro - Sistema de Templates Dinâmicos
 * 
 * Cada template contém:
 * - colors: Paleta principal (pode ser sobreposta por customizações do profissional)
 * - typography: Tipografias Google Fonts
 * - layout: Seções que aparecem/desaparecem por template
 * - components: Estilos específicos de componentes
 */

export type ThemeId =
  | 'luxe_gold'
  | 'luxe_copper'
  | 'luxe_silver'
  | 'bloom_soft'
  | 'bloom_pearl'
  | 'glow_pink'
  | 'glow_coral'
  | 'bold_teal'
  | 'bold_emerald'
  | 'bold_ocean'
  | 'pure_neutral'
  | 'pure_slate';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
}

export interface ThemeTypography {
  heading: string;
  body: string;
  accent: string;
  sizes?: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
  };
}

export interface ThemeLayout {
  showPortfolio: boolean;
  showAbout: boolean;
  showServices: boolean;
  showReviews: boolean;
  showContact: boolean;
  showLocation: boolean;
  showFloatingCTA: boolean;
  headerStyle: 'premium' | 'minimal' | 'dynamic' | 'simple';
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'LUXE' | 'BLOOM' | 'GLOW HOT' | 'BOLD' | 'PURE';
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  segments: string[];
  components: {
    cardRadius: string;
    buttonRadius: string;
    shadowIntensity: 'subtle' | 'medium' | 'heavy';
    spacing: 'compact' | 'normal' | 'spacious';
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  // ============ LUXE ============
  luxe_gold: {
    id: 'luxe_gold',
    name: 'Luxe Gold',
    category: 'LUXE',
    description: 'Elegância sofisticada em preto e ouro',
    colors: {
      primary: '#1a1a1a',
      secondary: '#d4af37',
      accent: '#e8dcc8',
      background: '#0d0d0d',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Lato',
      accent: 'Cormorant Garamond',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: false,
      headerStyle: 'premium'
    },
    segments: ['Esteticistas Premium', 'Hair Designers', 'Consultores de Imagem'],
    components: {
      cardRadius: '8px',
      buttonRadius: '4px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  luxe_copper: {
    id: 'luxe_copper',
    name: 'Luxe Copper',
    category: 'LUXE',
    description: 'Elegância sofisticada em preto e cobre',
    colors: {
      primary: '#1a1a1a',
      secondary: '#b8860b',
      accent: '#d2a679',
      background: '#0d0d0d',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Lato',
      accent: 'Cormorant Garamond',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: false,
      headerStyle: 'premium'
    },
    segments: ['Esteticistas Premium', 'Barbeiros Upscale'],
    components: {
      cardRadius: '8px',
      buttonRadius: '4px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  luxe_silver: {
    id: 'luxe_silver',
    name: 'Luxe Silver',
    category: 'LUXE',
    description: 'Elegância sofisticada em preto e prata',
    colors: {
      primary: '#1a1a1a',
      secondary: '#c0c0c0',
      accent: '#e8e8e8',
      background: '#0d0d0d',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Lato',
      accent: 'Cormorant Garamond',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: false,
      headerStyle: 'premium'
    },
    segments: ['Clínicas Premium', 'Dentistas Sofisticados'],
    components: {
      cardRadius: '8px',
      buttonRadius: '4px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  // ============ BLOOM ============
  bloom_soft: {
    id: 'bloom_soft',
    name: 'Bloom Soft',
    category: 'BLOOM',
    description: 'Delicadeza natural em rosa claro e marrom',
    colors: {
      primary: '#f5e6e3',
      secondary: '#d4a5a5',
      accent: '#8b6f47',
      background: '#faf8f7',
      text: '#3d3d3d',
      textSecondary: '#8b8b8b',
      border: '#e8d4cc',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373'
    },
    typography: {
      heading: 'Montserrat',
      body: 'Open Sans',
      accent: 'Great Vibes',
      sizes: {
        h1: '44px',
        h2: '32px',
        h3: '22px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Beauty Coaches', 'Skincare Specialists', 'Bem-estar'],
    components: {
      cardRadius: '16px',
      buttonRadius: '24px',
      shadowIntensity: 'subtle',
      spacing: 'spacious'
    }
  },

  bloom_pearl: {
    id: 'bloom_pearl',
    name: 'Bloom Pearl',
    category: 'BLOOM',
    description: 'Delicadeza natural em rosa claro e bege quente',
    colors: {
      primary: '#f5e6e3',
      secondary: '#e8d4c8',
      accent: '#d4a574',
      background: '#faf8f7',
      text: '#3d3d3d',
      textSecondary: '#8b8b8b',
      border: '#e8d4cc',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373'
    },
    typography: {
      heading: 'Montserrat',
      body: 'Open Sans',
      accent: 'Great Vibes',
      sizes: {
        h1: '44px',
        h2: '32px',
        h3: '22px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Manicure & Pedicure', 'Estética Corporal'],
    components: {
      cardRadius: '16px',
      buttonRadius: '24px',
      shadowIntensity: 'subtle',
      spacing: 'spacious'
    }
  },

  // ============ GLOW HOT ============
  glow_pink: {
    id: 'glow_pink',
    name: 'Glow Pink',
    category: 'GLOW HOT',
    description: 'Feminino vibrante em rosa hot e roxo',
    colors: {
      primary: '#ff1493',
      secondary: '#9370db',
      accent: '#ffc0cb',
      background: '#fff5f8',
      text: '#2d2d2d',
      textSecondary: '#666666',
      border: '#ffe0ec',
      success: '#66bb6a',
      warning: '#ffa726',
      error: '#ef5350'
    },
    typography: {
      heading: 'Poppins',
      body: 'Quicksand',
      accent: 'Satisfy',
      sizes: {
        h1: '46px',
        h2: '34px',
        h3: '23px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Nail Art Designers', 'Manicure Criativo', 'Styling & Moda'],
    components: {
      cardRadius: '12px',
      buttonRadius: '20px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  glow_coral: {
    id: 'glow_coral',
    name: 'Glow Coral',
    category: 'GLOW HOT',
    description: 'Feminino vibrante em rosa hot e coral',
    colors: {
      primary: '#ff1493',
      secondary: '#ff7f50',
      accent: '#ffa07a',
      background: '#fff5f8',
      text: '#2d2d2d',
      textSecondary: '#666666',
      border: '#ffe0ec',
      success: '#66bb6a',
      warning: '#ffa726',
      error: '#ef5350'
    },
    typography: {
      heading: 'Poppins',
      body: 'Quicksand',
      accent: 'Satisfy',
      sizes: {
        h1: '46px',
        h2: '34px',
        h3: '23px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Estética Facial', 'Maquiagem Criativa'],
    components: {
      cardRadius: '12px',
      buttonRadius: '20px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  // ============ BOLD ============
  bold_teal: {
    id: 'bold_teal',
    name: 'Bold Teal',
    category: 'BOLD',
    description: 'Moderno vibrante em teal e verde menta',
    colors: {
      primary: '#008b8b',
      secondary: '#20b2aa',
      accent: '#40e0d0',
      background: '#f0f8f8',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      border: '#c1e8e4',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Montserrat',
      body: 'Inter',
      accent: 'Poppins',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Barbeiros Modernos', 'Salões Jovens', 'Pet Grooming'],
    components: {
      cardRadius: '12px',
      buttonRadius: '8px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  bold_emerald: {
    id: 'bold_emerald',
    name: 'Bold Emerald',
    category: 'BOLD',
    description: 'Moderno vibrante em verde escuro e ouro',
    colors: {
      primary: '#1b4332',
      secondary: '#2d6a4f',
      accent: '#d4af37',
      background: '#f1f9f6',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      border: '#b8e5d8',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Montserrat',
      body: 'Inter',
      accent: 'Poppins',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Salões Premium Modernos', 'Spa Boutique'],
    components: {
      cardRadius: '12px',
      buttonRadius: '8px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  bold_ocean: {
    id: 'bold_ocean',
    name: 'Bold Ocean',
    category: 'BOLD',
    description: 'Moderno vibrante em azul escuro e turquesa',
    colors: {
      primary: '#0a3d62',
      secondary: '#3498db',
      accent: '#1abc9c',
      background: '#ecf0f1',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      border: '#bdc3c7',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Montserrat',
      body: 'Inter',
      accent: 'Poppins',
      sizes: {
        h1: '48px',
        h2: '36px',
        h3: '24px',
        body: '16px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: true,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'dynamic'
    },
    segments: ['Clínicas Modernas', 'Dentistas Jovens'],
    components: {
      cardRadius: '12px',
      buttonRadius: '8px',
      shadowIntensity: 'medium',
      spacing: 'normal'
    }
  },

  // ============ PURE ============
  pure_neutral: {
    id: 'pure_neutral',
    name: 'Pure Neutral',
    category: 'PURE',
    description: 'Profissional limpo em bege e cinza',
    colors: {
      primary: '#f5f5f5',
      secondary: '#d4d4d4',
      accent: '#999999',
      background: '#ffffff',
      text: '#2d2d2d',
      textSecondary: '#666666',
      border: '#e0e0e0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Roboto',
      body: 'Open Sans',
      accent: 'Lato',
      sizes: {
        h1: '40px',
        h2: '32px',
        h3: '20px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: false,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'simple'
    },
    segments: ['Dentistas', 'Clínicas', 'Fisioterapia', 'Iniciantes'],
    components: {
      cardRadius: '6px',
      buttonRadius: '4px',
      shadowIntensity: 'subtle',
      spacing: 'compact'
    }
  },

  pure_slate: {
    id: 'pure_slate',
    name: 'Pure Slate',
    category: 'PURE',
    description: 'Profissional limpo em cinza e azul suave',
    colors: {
      primary: '#e8eef2',
      secondary: '#b8c5d6',
      accent: '#5a7a94',
      background: '#ffffff',
      text: '#2d2d2d',
      textSecondary: '#666666',
      border: '#d0d8e0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    },
    typography: {
      heading: 'Roboto',
      body: 'Open Sans',
      accent: 'Lato',
      sizes: {
        h1: '40px',
        h2: '32px',
        h3: '20px',
        body: '15px',
        small: '12px'
      }
    },
    layout: {
      showPortfolio: false,
      showAbout: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showLocation: true,
      showFloatingCTA: true,
      headerStyle: 'simple'
    },
    segments: ['Clínicas Médicas', 'Consultórios', 'Profissional Sereno'],
    components: {
      cardRadius: '6px',
      buttonRadius: '4px',
      shadowIntensity: 'subtle',
      spacing: 'compact'
    }
  }
};

/**
 * HELPER FUNCTIONS
 */

export function getTheme(themeId: ThemeId): ThemeConfig {
  return THEMES[themeId];
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

export function getThemesByCategory(
  category: ThemeConfig['category']
): ThemeConfig[] {
  return getAllThemes().filter((theme) => theme.category === category);
}

export function getThemesBySegment(segment: string): ThemeConfig[] {
  return getAllThemes().filter((theme) => theme.segments.includes(segment));
}

/**
 * TAILWIND CSS GENERATOR
 * Gera classes Tailwind dinamicamente baseado no tema
 */

export function generateThemeCSS(theme: ThemeConfig): string {
  return `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-text: ${theme.colors.text};
      --color-text-secondary: ${theme.colors.textSecondary};
      --color-border: ${theme.colors.border || '#e0e0e0'};
      
      --font-heading: '${theme.typography.heading}', sans-serif;
      --font-body: '${theme.typography.body}', sans-serif;
      --font-accent: '${theme.typography.accent}', cursive;
      
      --radius-card: ${theme.components.cardRadius};
      --radius-button: ${theme.components.buttonRadius};
    }
  `;
}

/**
 * MERGE FUNCTION
 * Combina paleta padrão do tema com cores customizadas do profissional
 * Cores customizadas sobrepõem a paleta padrão
 */

export function mergeThemeWithCustomColors(
  theme: ThemeConfig,
  customColors: Partial<ThemeColors>
): ThemeColors {
  return {
    ...theme.colors,
    ...customColors
  };
}

export default THEMES;
