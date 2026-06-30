import { useSyncExternalStore } from "react";
import type { AccentId } from "@/lib/accents-data";
import {
  DEFAULTS,
  getActiveAccentId,
  loadPersonalization,
  THEME_CHANGE_EVENT,
} from "@/lib/personalization";
import { THEME_ACCENTS } from "@/lib/theme-vars";

/** Converte hex (#rgb ou #rrggbb) para componentes RGB. */
function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace("#", "");
  if (!raw) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Aceita hex ou rgb()/rgba() retornado por getComputedStyle. */
export function parseCssColor(input: string): [number, number, number] | null {
  const hex = parseHex(input);
  if (hex) return hex;
  const rgbMatch = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
  return null;
}

export function subscribeTheme(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export type ThemeBrand = {
  accentId: AccentId;
  primary: string;
  accent: string;
  gradient: string;
};

/** Resolve cores do accent a partir do catálogo (não depende de CSS cascade). */
export function resolveThemeBrand(accentId: AccentId = getActiveAccentId()): ThemeBrand {
  const pack = THEME_ACCENTS[accentId] ?? THEME_ACCENTS.rose;
  return {
    accentId,
    primary: pack.p,
    accent: pack.a,
    gradient: `linear-gradient(135deg, ${pack.p} 0%, ${pack.a} 100%)`,
  };
}

function readAccentSnapshot(): AccentId {
  if (typeof window === "undefined") return DEFAULTS.accent;
  return getActiveAccentId();
}

/** Re-render quando accent/tema mudam (personalização, ui_settings, storage). */
export function useThemeBrand(): ThemeBrand {
  const accentId = useSyncExternalStore(
    subscribeTheme,
    readAccentSnapshot,
    () => DEFAULTS.accent,
  );
  return resolveThemeBrand(accentId);
}

/**
 * Retorna rgba com alpha informado a partir de uma cor hex/rgb.
 */
export function primaryRgba(alpha: number, color: string, fallback = "#6b7280"): string {
  const rgb = parseCssColor(color) ?? parseCssColor(fallback) ?? [107, 114, 128];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/** Intensidade 0–10 do heatmap → alpha 0.12–1.0 */
export function peakIntensityAlpha(value: number): number {
  return 0.12 + (value / 10) * 0.88;
}

/** Fundo dos cards de pico (dia + horário): 1º gradiente, demais tint do accent. */
export function peakTopCardStyle(
  rank: number,
  brand: ThemeBrand,
): { background?: string; backgroundColor?: string } {
  if (rank === 0) return { background: brand.gradient };
  return { backgroundColor: primaryRgba(rank === 1 ? 0.28 : 0.14, brand.primary) };
}

/** Accent persistido (localStorage) — útil ao hidratar após reload. */
export function readPersistedAccentId(): AccentId {
  return loadPersonalization().accent;
}
