import type { ThemeCategory, ThemeId } from "@/lib/themes";

/** Metadados de marketing para a galeria de templates (docs/NovoSDesigner). */
export type ThemeMeta = {
  description: string;
  segments: string[];
};

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  luxe_gold: {
    description: "Elegância sofisticada em preto e ouro",
    segments: ["Esteticistas premium", "Hair designers"],
  },
  luxe_copper: {
    description: "Elegância sofisticada em preto e cobre",
    segments: ["Barbeiros upscale", "Consultores de imagem"],
  },
  luxe_silver: {
    description: "Elegância sofisticada em preto e prata",
    segments: ["Clínicas premium", "Dentistas sofisticados"],
  },
  bloom_soft: {
    description: "Delicadeza natural em rosa claro e marrom",
    segments: ["Beauty coaches", "Skincare"],
  },
  bloom_pearl: {
    description: "Aconchego em rosa claro e bege quente",
    segments: ["Manicure & pedicure", "Estética corporal"],
  },
  glow_pink: {
    description: "Feminino vibrante em rosa hot e roxo",
    segments: ["Nail artists", "Makeup artists"],
  },
  glow_coral: {
    description: "Energia quente em coral e laranja",
    segments: ["Cabeleireiras", "Lash designers"],
  },
  bold_teal: {
    description: "Moderno e confiante em teal profundo",
    segments: ["Clínicas de estética", "Spa urbano"],
  },
  bold_emerald: {
    description: "Natureza premium em verde esmeralda",
    segments: ["Wellness", "Terapeutas holísticos"],
  },
  bold_ocean: {
    description: "Profissional vibrante em azul oceano",
    segments: ["Clínicas modernas", "Fisioterapia"],
  },
  pure_neutral: {
    description: "Layout limpo em tons neutros",
    segments: ["Dentistas", "Consultórios"],
  },
  pure_slate: {
    description: "Profissional sereno em cinza e azul suave",
    segments: ["Clínicas médicas", "Iniciantes"],
  },
  urban_noir: {
    description: "Estética cinematográfica dark luxe",
    segments: ["Barbearias premium", "Tatuadores"],
  },
  urban_steel: {
    description: "Urbano futurista em azul aço",
    segments: ["Barbershops", "Studios masculinos"],
  },
  urban_rust: {
    description: "Industrial quente em ferrugem e carvão",
    segments: ["Barbearias", "Personal trainers"],
  },
};

export const THEME_CATEGORY_ORDER: ThemeCategory[] = [
  "LUXE",
  "BLOOM",
  "GLOW HOT",
  "BOLD",
  "PURE",
  "URBAN",
];
