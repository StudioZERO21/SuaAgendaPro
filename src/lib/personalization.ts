export { ACCENTS, FONTS, type AccentId, type FontId } from "@/lib/accents-data";

import { ACCENTS, FONTS, isAccentId, type AccentId, type FontId } from "@/lib/accents-data";
import {
  applyAccentVars,
  resolveIsDark,
  THEME_ACCENTS,
} from "@/lib/theme-vars";

export const PERSONALIZATION_KEY = "sa.personalizacao";

/** Disparado após applyPersonalization / applyAccent (mesma aba). */
export const THEME_CHANGE_EVENT = "sa:theme-change";

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

/** Accent aplicado por último — fonte imediata para componentes reativos ao tema. */
let activeAccentId: AccentId = DEFAULTS.accent;

function notifyThemeChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getActiveAccentId(): AccentId {
  return activeAccentId;
}

export function loadPersonalization(): Personalization {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(PERSONALIZATION_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      accent: isAccentId(parsed.accent) ? parsed.accent : DEFAULTS.accent,
      font: FONTS.some((f) => f.id === parsed.font) ? parsed.font : DEFAULTS.font,
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

if (typeof window !== "undefined") {
  activeAccentId = loadPersonalization().accent;
}

export function savePersonalization(p: Personalization) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(p));
  activeAccentId = p.accent;
  notifyThemeChange();
}

let autoThemeMedia: MediaQueryList | null = null;
let autoThemeHandler: (() => void) | null = null;
let autoThemePersonalization: Personalization | null = null;

function teardownAutoThemeListener() {
  if (autoThemeMedia && autoThemeHandler) {
    autoThemeMedia.removeEventListener("change", autoThemeHandler);
  }
  autoThemeMedia = null;
  autoThemeHandler = null;
  autoThemePersonalization = null;
}

function setupAutoThemeListener(p: Personalization) {
  teardownAutoThemeListener();
  if (p.theme !== "auto" || typeof window === "undefined") return;

  autoThemePersonalization = p;
  autoThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  autoThemeHandler = () => {
    if (!autoThemePersonalization) return;
    applyTheme(autoThemePersonalization.theme);
    applyAccent(autoThemePersonalization.accent);
  };
  autoThemeMedia.addEventListener("change", autoThemeHandler);
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveIsDark(theme));
}

export function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  activeAccentId = id;
  const accent = THEME_ACCENTS[id] ?? THEME_ACCENTS.rose;
  const isDark = document.documentElement.classList.contains("dark");
  applyAccentVars(document.documentElement, accent, isDark);
  const mt = document.querySelector('meta[name="theme-color"]');
  if (mt) mt.setAttribute("content", accent.p);
  notifyThemeChange();
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
  activeAccentId = p.accent;
  applyTheme(p.theme);
  applyAccent(p.accent);
  applyFont(p.font);
  applyHighContrast(p.highContrast);
  setupAutoThemeListener(p);
}
