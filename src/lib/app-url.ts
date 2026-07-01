/** URL pública do app operacional em produção. */
const DEFAULT_APP_URL = "https://app.suaagenda.pro";

function readEnv(key: string): string | undefined {
  const fromMeta = import.meta.env?.[key];
  if (fromMeta && String(fromMeta).trim()) {
    return String(fromMeta).trim();
  }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key]!.trim();
  }
  return undefined;
}

/**
 * URL canônica do app operacional (app.suaagenda.pro).
 * Usada em confirmação de e-mail, reset de senha e OAuth.
 */
export function getPublicAppUrl(): string {
  const configured = readEnv("VITE_APP_URL") || readEnv("APP_URL");
  if (configured) return configured.replace(/\/+$/, "");

  // Build de produção: nunca inferir de window (localhost/Lovable quebra e-mails reais)
  if (import.meta.env.PROD) {
    return DEFAULT_APP_URL;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return DEFAULT_APP_URL;
}

/** @deprecated Prefer getPublicAppUrl — mantido para compatibilidade. */
export function getAuthRedirectOrigin(): string {
  return getPublicAppUrl();
}

/**
 * Redirect após clicar no link de confirmação de e-mail (Supabase Auth).
 * Em produção sempre aponta para app.suaagenda.pro, independente do origin do browser.
 */
export function getEmailConfirmRedirectUrl(): string {
  const base = import.meta.env.PROD
    ? (readEnv("VITE_APP_URL") || DEFAULT_APP_URL).replace(/\/+$/, "")
    : getPublicAppUrl();
  return `${base}/auth/callback`;
}

/** Redirect para reset de senha (Supabase Auth). */
export function getPasswordResetRedirectUrl(): string {
  return `${getPublicAppUrl()}/reset-password`;
}
