export const SUPER_AUTH_KEY = "sa.super.token";

export function getSuperToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SUPER_AUTH_KEY);
}

export function setSuperToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUPER_AUTH_KEY, token);
}

export function clearSuperAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SUPER_AUTH_KEY);
}

// Mantido para compatibilidade com route.tsx existente
export function getSuperAuth() {
  return getSuperToken() ? { role: "super_admin" as const } : null;
}
