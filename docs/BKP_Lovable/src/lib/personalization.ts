export const PERSONALIZATION_KEY = "sa.personalizacao";

// Accents tuned for WCAG AA: `primary` reaches ≥4.5:1 with white text;
// `glow` is the lighter end used for gradients and highlights.
export const ACCENTS = [
  { id: "rose", label: "Rosa", primary: "#be185d", glow: "#ec4899", accent: "#a21caf", ring: "#be185d" },
  { id: "violet", label: "Violeta", primary: "#6d28d9", glow: "#a78bfa", accent: "#5b21b6", ring: "#6d28d9" },
  { id: "amber", label: "Âmbar", primary: "#b45309", glow: "#fbbf24", accent: "#9a3412", ring: "#b45309" },
  { id: "emerald", label: "Esmeralda", primary: "#047857", glow: "#34d399", accent: "#065f46", ring: "#047857" },
  { id: "sky", label: "Azul", primary: "#0369a1", glow: "#38bdf8", accent: "#1d4ed8", ring: "#0369a1" },
  { id: "noir", label: "Noir", primary: "#1f1230", glow: "#7c3aed", accent: "#312e81", ring: "#1f1230" },
] as const;

export const FONTS = [
  { id: "playfair", label: "Playfair", stack: '"Playfair Display", Georgia, serif' },
  { id: "inter", label: "Inter", stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: "dm", label: "DM Serif", stack: '"DM Serif Display", Georgia, serif' },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type FontId = (typeof FONTS)[number]["id"];
export type ThemeId = "light" | "dark" | "auto";

export type Personalization = {
  theme: ThemeId;
  accent: AccentId;
  font: FontId;
  highContrast: boolean;
  business: { name: string; logo: string };
};

export const DEFAULTS: Personalization = {
  theme: "light",
  accent: "rose",
  font: "playfair",
  highContrast: false,
  business: { name: "Studio Beleza", logo: "" },
};

export function loadPersonalization(): Personalization {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(PERSONALIZATION_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      business: { ...DEFAULTS.business, ...(parsed.business ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export function savePersonalization(p: Personalization) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(p));
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  const isDark =
    theme === "dark" ||
    (theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  const a = ACCENTS.find((x) => x.id === id) ?? ACCENTS[0];
  const root = document.documentElement;
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-glow", a.glow);
  root.style.setProperty("--accent", a.accent);
  root.style.setProperty("--ring", a.ring);
  // Always white text on primary buttons — verified ≥4.5:1 for every accent above.
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, ${a.primary} 0%, ${a.accent} 100%)`,
  );
  root.style.setProperty(
    "--shadow-glow",
    `0 10px 30px -10px ${a.primary}73`,
  );
}

export function applyFont(id: FontId) {
  if (typeof document === "undefined") return;
  const f = FONTS.find((x) => x.id === id) ?? FONTS[0];
  document.documentElement.style.setProperty("--font-display", f.stack);
}

export function applyHighContrast(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("high-contrast", enabled);
}

export function applyPersonalization(p: Personalization) {
  applyTheme(p.theme);
  applyAccent(p.accent);
  applyFont(p.font);
  applyHighContrast(p.highContrast);
}
