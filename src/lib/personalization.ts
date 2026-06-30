export const PERSONALIZATION_KEY = "sa.personalizacao";

// Accents tuned for WCAG AA: `primary` reaches ≥4.5:1 with white text;
// `glow` is the lighter end used for gradients and highlights.
// `secondary`, `muted`, `border`, `cloud` = light-tinted surface vars so the
// whole page changes with the chosen accent, not just buttons.
export const ACCENTS = [
  {
    id: "rose", label: "Rosa",
    primary: "#be185d", glow: "#ec4899", accent: "#a21caf", ring: "#be185d",
    secondary: "#fdf2f8", secondaryFg: "#831843",
    muted: "#f7f4f8",    mutedFg: "#6b5b73",
    border: "#f3e8ee",   cloud: "#fdf2f8",
    gradientSoft: "linear-gradient(135deg,#fce7f3 0%,#fdf2f8 50%,#fae8ff 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fdf2f8 100%)",
  },
  {
    id: "violet", label: "Violeta",
    primary: "#6d28d9", glow: "#a78bfa", accent: "#5b21b6", ring: "#6d28d9",
    secondary: "#f5f3ff", secondaryFg: "#4c1d95",
    muted: "#f0eeff",    mutedFg: "#5b4e8b",
    border: "#e8e3fd",   cloud: "#f5f3ff",
    gradientSoft: "linear-gradient(135deg,#ede9fe 0%,#f5f3ff 50%,#f0eeff 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f5f3ff 100%)",
  },
  {
    id: "amber", label: "Âmbar",
    primary: "#b45309", glow: "#fbbf24", accent: "#9a3412", ring: "#b45309",
    secondary: "#fffbeb", secondaryFg: "#78350f",
    muted: "#fef9e7",    mutedFg: "#8a6e3a",
    border: "#fde9b0",   cloud: "#fffbeb",
    gradientSoft: "linear-gradient(135deg,#fef3c7 0%,#fffbeb 50%,#fefce8 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fffbeb 100%)",
  },
  {
    id: "emerald", label: "Esmeralda",
    primary: "#047857", glow: "#34d399", accent: "#065f46", ring: "#047857",
    secondary: "#ecfdf5", secondaryFg: "#064e3b",
    muted: "#f0fdf4",    mutedFg: "#3d7a5e",
    border: "#c9f0de",   cloud: "#ecfdf5",
    gradientSoft: "linear-gradient(135deg,#d1fae5 0%,#ecfdf5 50%,#f0fdf4 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#ecfdf5 100%)",
  },
  {
    id: "sky", label: "Azul",
    primary: "#0369a1", glow: "#38bdf8", accent: "#1d4ed8", ring: "#0369a1",
    secondary: "#f0f9ff", secondaryFg: "#0c4a6e",
    muted: "#e6f5ff",    mutedFg: "#3a7a9e",
    border: "#c8e8f8",   cloud: "#f0f9ff",
    gradientSoft: "linear-gradient(135deg,#e0f2fe 0%,#f0f9ff 50%,#e8f4ff 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f0f9ff 100%)",
  },
  {
    id: "noir", label: "Noir",
    primary: "#1f1230", glow: "#7c3aed", accent: "#312e81", ring: "#1f1230",
    secondary: "#f8f7f9", secondaryFg: "#1f1230",
    muted: "#f3f1f6",    mutedFg: "#4a3f57",
    border: "#e4e0ed",   cloud: "#f8f7f9",
    gradientSoft: "linear-gradient(135deg,#ede9fe 0%,#f8f7f9 50%,#f3f0ff 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f8f7f9 100%)",
  },
] as const;

export const FONTS = [
  { id: "playfair", label: "Playfair", stack: '"Playfair Display", Georgia, serif' },
  { id: "inter", label: "Inter", stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: "dm", label: "DM Serif", stack: '"DM Serif Display", Georgia, serif' },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type FontId = (typeof FONTS)[number]["id"];
export type ThemeId = "light" | "dark" | "auto";

export type LogoShape = "square" | "wide";

export type Personalization = {
  theme: ThemeId;
  accent: AccentId;
  font: FontId;
  highContrast: boolean;
  business: { name: string; logo: string; logoShape: LogoShape };
};

export const DEFAULTS: Personalization = {
  theme: "light",
  accent: "rose",
  font: "playfair",
  highContrast: false,
  business: { name: "Studio Beleza", logo: "", logoShape: "square" },
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
      business: {
        ...DEFAULTS.business,
        ...(parsed.business ?? {}),
        logoShape: (parsed.business?.logoShape ?? "square") as LogoShape,
      },
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
  // Primary / interactive colors
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-glow", a.glow);
  root.style.setProperty("--accent", a.accent);
  root.style.setProperty("--ring", a.ring);
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg,${a.primary} 0%,${a.accent} 100%)`);
  root.style.setProperty("--shadow-glow", `0 10px 30px -10px ${a.primary}73`);
  // Surface / background tints — make the whole layout reflect the chosen accent
  root.style.setProperty("--secondary", a.secondary);
  root.style.setProperty("--secondary-foreground", a.secondaryFg);
  root.style.setProperty("--muted", a.muted);
  root.style.setProperty("--muted-foreground", a.mutedFg);
  root.style.setProperty("--border", a.border);
  root.style.setProperty("--input", a.border);
  root.style.setProperty("--rose-cloud", a.cloud);
  root.style.setProperty("--gradient-soft", a.gradientSoft);
  root.style.setProperty("--gradient-card", a.gradientCard);
  // Barra do app instalado (PWA) acompanha a cor escolhida, ao vivo
  const mt = typeof document !== "undefined" ? document.querySelector('meta[name="theme-color"]') : null;
  if (mt) mt.setAttribute("content", a.primary);
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
