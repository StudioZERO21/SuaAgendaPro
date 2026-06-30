import { useSyncExternalStore } from "react";

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

/**
 * Lê variável CSS do `<html>`.
 * Prioriza inline style (personalização) sobre regras `.dark` do stylesheet.
 */
export function readCssVar(name: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const root = document.documentElement;
  const inline = root.style.getPropertyValue(name).trim();
  if (inline) return inline;
  return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
}

export function subscribeTheme(cb: () => void) {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });
  window.addEventListener("storage", cb);
  return () => {
    obs.disconnect();
    window.removeEventListener("storage", cb);
  };
}

export type ThemeBrand = {
  primary: string;
  accent: string;
  gradient: string;
};

function readThemeBrand(): ThemeBrand {
  const primary = readCssVar("--primary", "#6b7280");
  const accent = readCssVar("--accent", "#4b5563");
  const gradient = readCssVar(
    "--gradient-primary",
    `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
  );
  return { primary, accent, gradient };
}

const SSR_BRAND: ThemeBrand = {
  primary: "#6b7280",
  accent: "#4b5563",
  gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
};

/** Re-render quando accent/tema mudam no DOM (personalização, ui_settings, dark). */
export function useThemeBrand(): ThemeBrand {
  return useSyncExternalStore(subscribeTheme, readThemeBrand, () => SSR_BRAND);
}

/**
 * Lê `--primary` e retorna rgba com alpha informado.
 * Funciona com accent aplicado via inline style (personalização).
 */
export function primaryRgba(alpha: number, color?: string, fallback = "#6b7280"): string {
  const source = color ?? readCssVar("--primary", fallback);
  const rgb = parseCssColor(source);
  if (!rgb) {
    const fb = parseCssColor(fallback) ?? [107, 114, 128];
    return `rgba(${fb[0]}, ${fb[1]}, ${fb[2]}, ${alpha})`;
  }
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
