// Shared portfolio storage (localStorage). Used by /portfolio (editor)
// and by the public page /agendar/$slug (display).

export type PortfolioItem = {
  id: string;
  src: string; // data URL (9:16 JPEG)
  title: string;
  category: string;
  description: string;
};

export const PORTFOLIO_KEY = "sa.portfolio";
export const PORTFOLIO_CATEGORIES_KEY = "sa.portfolio.categories";
export const MAX_PORTFOLIO_ITEMS = 10;

export const DEFAULT_CATEGORIES = [
  "Cílios",
  "Unhas",
  "Cabelo",
  "Maquiagem",
  "Sobrancelhas",
  "Estética facial",
  "Estética corporal",
  "Outro",
];

export function loadPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    return raw ? (JSON.parse(raw) as PortfolioItem[]) : [];
  } catch {
    return [];
  }
}

export function savePortfolio(items: PortfolioItem[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items));
  } catch {}
}

export function loadCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(PORTFOLIO_CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(cats: string[]) {
  try {
    localStorage.setItem(PORTFOLIO_CATEGORIES_KEY, JSON.stringify(cats));
  } catch {}
}
