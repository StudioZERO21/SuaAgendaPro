/** Cookie HttpOnly para sessão super admin. */

export const SUPER_COOKIE_NAME = "sa_super_token";
const COOKIE_TTL_SEC = 8 * 60 * 60;

export function getSuperTokenFromRequest(
  request: Request | null | undefined,
): string | null {
  if (!request) return null;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${SUPER_COOKIE_NAME}=([^;]+)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function buildSuperSetCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return (
    `${SUPER_COOKIE_NAME}=${encodeURIComponent(token)}; ` +
    `Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_TTL_SEC}${secure}`
  );
}

export function buildSuperClearCookieHeader(): string {
  return `${SUPER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
