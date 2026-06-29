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
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Strict; max-age=${COOKIE_TTL}`;
}

export function clearSuperAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SUPER_AUTH_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/** Verifica localmente se o token existe E não está expirado (sem chamada ao servidor). */
export function isSuperTokenValid(): boolean {
  const token = getSuperToken();
  if (!token) return false;
  try {
    // Token format (base64url): "email:exp:sig"
    const decoded     = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const lastColon   = decoded.lastIndexOf(":");
    const payloadPart = decoded.slice(0, lastColon);
    // Rejeita tokens de estado intermediário (mfa: ou pwd:)
    if (payloadPart.startsWith("mfa:") || payloadPart.startsWith("pwd:")) return false;
    const colonIdx = payloadPart.lastIndexOf(":");
    const exp      = parseInt(payloadPart.slice(colonIdx + 1), 10);
    return !isNaN(exp) && Date.now() < exp;
  } catch {
    return false;
  }
}

/** @deprecated Use isSuperTokenValid() — mantido para compatibilidade */
export function getSuperAuth() {
  return isSuperTokenValid() ? { role: "super_admin" as const } : null;
}
