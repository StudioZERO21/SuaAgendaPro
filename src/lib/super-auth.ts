export const SUPER_AUTH_KEY = "sa.super.token";
const COOKIE_NAME = "sa_super_token";
const COOKIE_TTL  = 8 * 60 * 60; // 8 horas em segundos

export function getSuperToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SUPER_AUTH_KEY);
}

export function setSuperToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUPER_AUTH_KEY, token);
  // Cookie para que o servidor receba o token automaticamente em cada requisição
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Strict; max-age=${COOKIE_TTL}`;
}

export function clearSuperAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SUPER_AUTH_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// Mantido para compatibilidade com route.tsx existente
export function getSuperAuth() {
  return getSuperToken() ? { role: "super_admin" as const } : null;
}
