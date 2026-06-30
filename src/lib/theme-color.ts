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

/**
 * Lê `--primary` do DOM e retorna rgba com alpha informado.
 * Funciona com accent aplicado via inline style (personalização).
 */
export function primaryRgba(alpha: number, hex?: string, fallback = "#6b7280"): string {
  const source =
    hex ??
    (typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
      : "") ||
    fallback;
  const rgb = parseHex(source);
  if (!rgb) return fallback;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/** Intensidade 0–10 do heatmap → alpha 0.12–1.0 */
export function peakIntensityAlpha(value: number): number {
  return 0.12 + (value / 10) * 0.88;
}
