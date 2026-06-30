// Accents tuned for WCAG AA: `primary` reaches ≥4.5:1 with white text;
// `glow` is the lighter end used for gradients and highlights.
// `secondary`, `muted`, `border`, `cloud` = light-tinted surface vars (light mode).
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
  {
    id: "coral", label: "Coral",
    primary: "#c2410c", glow: "#fb923c", accent: "#9a3412", ring: "#c2410c",
    secondary: "#fff7ed", secondaryFg: "#9a3412",
    muted: "#ffedd5",    mutedFg: "#8a5a3a",
    border: "#fed7aa",   cloud: "#fff7ed",
    gradientSoft: "linear-gradient(135deg,#ffedd5 0%,#fff7ed 50%,#fef3c7 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fff7ed 100%)",
  },
  {
    id: "wine", label: "Vinho",
    primary: "#881337", glow: "#fb7185", accent: "#701a36", ring: "#881337",
    secondary: "#fff1f2", secondaryFg: "#881337",
    muted: "#fef2f2",    mutedFg: "#7f4d56",
    border: "#fecdd3",   cloud: "#fff1f2",
    gradientSoft: "linear-gradient(135deg,#ffe4e6 0%,#fff1f2 50%,#fef2f2 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fff1f2 100%)",
  },
  {
    id: "fuchsia", label: "Fúcsia",
    primary: "#a21caf", glow: "#e879f9", accent: "#86198f", ring: "#a21caf",
    secondary: "#fdf4ff", secondaryFg: "#86198f",
    muted: "#fae8ff",    mutedFg: "#7e4585",
    border: "#f5d0fe",   cloud: "#fdf4ff",
    gradientSoft: "linear-gradient(135deg,#fae8ff 0%,#fdf4ff 50%,#fce7f3 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fdf4ff 100%)",
  },
  {
    id: "lilac", label: "Lilás",
    primary: "#9333ea", glow: "#d8b4fe", accent: "#7e22ce", ring: "#9333ea",
    secondary: "#faf5ff", secondaryFg: "#6b21a8",
    muted: "#f3e8ff",    mutedFg: "#6d5494",
    border: "#e9d5ff",   cloud: "#faf5ff",
    gradientSoft: "linear-gradient(135deg,#f3e8ff 0%,#faf5ff 50%,#ede9fe 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)",
  },
  {
    id: "indigo", label: "Índigo",
    primary: "#4338ca", glow: "#818cf8", accent: "#3730a3", ring: "#4338ca",
    secondary: "#eef2ff", secondaryFg: "#3730a3",
    muted: "#e0e7ff",    mutedFg: "#4f5294",
    border: "#c7d2fe",   cloud: "#eef2ff",
    gradientSoft: "linear-gradient(135deg,#e0e7ff 0%,#eef2ff 50%,#ede9fe 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#eef2ff 100%)",
  },
  {
    id: "teal", label: "Turquesa",
    primary: "#0f766e", glow: "#2dd4bf", accent: "#115e59", ring: "#0f766e",
    secondary: "#f0fdfa", secondaryFg: "#115e59",
    muted: "#ccfbf1",    mutedFg: "#3d7a72",
    border: "#99f6e4",   cloud: "#f0fdfa",
    gradientSoft: "linear-gradient(135deg,#ccfbf1 0%,#f0fdfa 50%,#ecfeff 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f0fdfa 100%)",
  },
  {
    id: "sage", label: "Sálvia",
    primary: "#4d7c0f", glow: "#a3e635", accent: "#3f6212", ring: "#4d7c0f",
    secondary: "#f7fee7", secondaryFg: "#3f6212",
    muted: "#ecfccb",    mutedFg: "#4a6638",
    border: "#d9f99d",   cloud: "#f7fee7",
    gradientSoft: "linear-gradient(135deg,#ecfccb 0%,#f7fee7 50%,#f0fdf4 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f7fee7 100%)",
  },
  {
    id: "copper", label: "Cobre",
    primary: "#92400e", glow: "#fbbf24", accent: "#78350f", ring: "#92400e",
    secondary: "#fffbeb", secondaryFg: "#78350f",
    muted: "#fef3c7",    mutedFg: "#7a5c3a",
    border: "#fde68a",   cloud: "#fffbeb",
    gradientSoft: "linear-gradient(135deg,#fef3c7 0%,#fffbeb 50%,#fff7ed 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fffbeb 100%)",
  },
  {
    id: "mocha", label: "Mocha",
    primary: "#713f12", glow: "#d97706", accent: "#57534e", ring: "#713f12",
    secondary: "#fafaf9", secondaryFg: "#44403c",
    muted: "#f5f5f4",    mutedFg: "#6b6560",
    border: "#e7e5e4",   cloud: "#fafaf9",
    gradientSoft: "linear-gradient(135deg,#f5f5f4 0%,#fafaf9 50%,#fff7ed 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#fafaf9 100%)",
  },
  {
    id: "slate", label: "Grafite",
    primary: "#475569", glow: "#94a3b8", accent: "#334155", ring: "#475569",
    secondary: "#f8fafc", secondaryFg: "#334155",
    muted: "#f1f5f9",    mutedFg: "#64748b",
    border: "#e2e8f0",   cloud: "#f8fafc",
    gradientSoft: "linear-gradient(135deg,#f1f5f9 0%,#f8fafc 50%,#f9fafb 100%)",
    gradientCard: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
  },
] as const;

export const FONTS = [
  { id: "playfair", label: "Playfair", stack: '"Playfair Display", Georgia, serif' },
  { id: "inter", label: "Inter", stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: "dm", label: "DM Serif", stack: '"DM Serif Display", Georgia, serif' },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type FontId = (typeof FONTS)[number]["id"];

/** Tupla para validação Zod — mantém sync com ACCENTS. */
export const ACCENT_ID_ENUM = ACCENTS.map((a) => a.id) as [
  AccentId,
  ...AccentId[],
];

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && ACCENTS.some((a) => a.id === value);
}
