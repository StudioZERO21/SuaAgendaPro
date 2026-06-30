const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HEX3 = /^#[0-9a-fA-F]{3}$/;
const BARE6 = /^[0-9a-fA-F]{6}$/;

/**
 * Normaliza cores hex vindas do banco ou formulários.
 * Aceita `#rgb`, `#rrggbb` ou `rrggbb` sem `#`.
 */
export function normalizeHexColor(
  value: string | null | undefined,
  fallback = "#ec4899",
): string {
  if (!value?.trim()) return fallback;
  const v = value.trim();
  if (HEX6.test(v)) return v.toLowerCase();
  if (HEX3.test(v)) {
    const h = v.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (BARE6.test(v)) return `#${v}`.toLowerCase();
  return fallback;
}

/** Retorna hex válido ou string vazia (ex.: gradiente secundário opcional). */
export function normalizeHexColorOrEmpty(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";
  const normalized = normalizeHexColor(value, "");
  return HEX6.test(normalized) ? normalized : "";
}
