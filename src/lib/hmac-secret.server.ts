/**
 * Segredo HMAC dedicado (não reutiliza service_role key).
 * Fallback temporário para service_role se APP_HMAC_SECRET não estiver definido.
 */

export function getAppHmacSecret(): string {
  const dedicated = process.env.APP_HMAC_SECRET;
  if (dedicated) return dedicated;

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (fallback) {
    console.warn(
      "[security] APP_HMAC_SECRET não definido — usando fallback. " +
        "Defina APP_HMAC_SECRET em produção.",
    );
    return fallback;
  }

  throw new Error("Missing APP_HMAC_SECRET or SUPABASE_SERVICE_ROLE_KEY");
}
