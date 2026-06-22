import { createHmac, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 min

function getStateSecret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for OAuth state signing");
  return s;
}

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

export function createOAuthState(
  userId: string,
  redirectUri: string,
  attemptId: string,
): string {
  const body = JSON.stringify({
    u: userId,
    r: redirectUri,
    a: attemptId,
    e: Date.now() + STATE_TTL_MS,
  });
  const payload = b64url(body);
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyOAuthState(
  state: string,
): { userId: string; redirectUri: string; attemptId: string } | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u: string;
      r: string;
      a: string;
      e: number;
    };
    if (!body.u || !body.r || !body.a || typeof body.e !== "number") return null;
    if (Date.now() > body.e) return null;
    return { userId: body.u, redirectUri: body.r, attemptId: body.a };
  } catch {
    return null;
  }
}

export function getMpOAuthCredentials() {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function buildAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string; user_id?: number | string; public_key?: string } | null> {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });
  if (!response.ok) return null;
  return (await response.json()) as {
    access_token: string;
    user_id?: number | string;
    public_key?: string;
  };
}
