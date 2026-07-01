/**
 * URL pública do app operacional (app.suaagenda.pro).
 * Usada em confirmação de e-mail, reset de senha e OAuth.
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv =
    import.meta.env.VITE_APP_URL ||
    (typeof process !== "undefined" ? process.env.VITE_APP_URL : undefined);
  return (fromEnv || "https://app.suaagenda.pro").replace(/\/+$/, "");
}

/** Redirect após clicar no link de confirmação de e-mail (Supabase Auth). */
export function getEmailConfirmRedirectUrl(): string {
  return `${getAuthRedirectOrigin()}/auth/callback`;
}
