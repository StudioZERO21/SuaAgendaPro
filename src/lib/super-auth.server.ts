// Autenticação server-side do super admin
// Valida credenciais e emite tokens HMAC-SHA256 (8h) ou MFA-pending (5 min)

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOKEN_TTL_MS     = 8 * 60 * 60 * 1000; // 8 horas  — token completo
const MFA_PENDING_TTL  = 5 * 60 * 1000;       // 5 minutos — aguardando TOTP

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return s;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export async function createSuperToken(email: string): Promise<string> {
  const exp     = Date.now() + TOKEN_TTL_MS;
  const payload = `${email}:${exp}`;
  const sig     = await hmacSign(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export async function verifySuperToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded   = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return false;
    const payloadPart = decoded.slice(0, lastColon);
    const sig         = decoded.slice(lastColon + 1);

    // payloadPart = "email:exp"  (sem prefixo "mfa:")
    if (payloadPart.startsWith("mfa:")) return false; // pending token ≠ full token

    const colonIdx = payloadPart.lastIndexOf(":");
    if (colonIdx < 0) return false;
    const exp = parseInt(payloadPart.slice(colonIdx + 1), 10);
    if (isNaN(exp) || Date.now() > exp) return false;

    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf   = Buffer.from(sig, "base64url");
    const expBuf   = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export async function requireSuperAuth(
  token: string | null | undefined,
): Promise<void> {
  if (!await verifySuperToken(token)) throw new Error("Unauthorized");
}

// Retorna o email do admin autenticado (útil para setup de MFA)
export async function getSuperAuthEmail(
  token: string | null | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payloadPart = decoded.slice(0, lastColon);
    if (payloadPart.startsWith("mfa:")) return null;
    if (!await verifySuperToken(token)) return null;
    const colonIdx = payloadPart.lastIndexOf(":");
    return payloadPart.slice(0, colonIdx);
  } catch {
    return null;
  }
}

// ─── Token MFA-pending ────────────────────────────────────────────────────────

async function createMfaPendingToken(email: string): Promise<string> {
  const exp     = Date.now() + MFA_PENDING_TTL;
  const payload = `mfa:${email}:${exp}`;
  const sig     = await hmacSign(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

async function verifyMfaPendingToken(
  token: string,
): Promise<string | null> {
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded   = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payloadPart = decoded.slice(0, lastColon);
    const sig         = decoded.slice(lastColon + 1);
    if (!payloadPart.startsWith("mfa:")) return null;

    // Extrai expiração (último segmento)
    const withoutPrefix = payloadPart.slice(4); // remove "mfa:"
    const expColon      = withoutPrefix.lastIndexOf(":");
    if (expColon < 0) return null;
    const exp = parseInt(withoutPrefix.slice(expColon + 1), 10);
    if (isNaN(exp) || Date.now() > exp) return null;

    // Verifica assinatura
    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf   = Buffer.from(sig, "base64url");
    const expBuf   = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    return withoutPrefix.slice(0, expColon); // email
  } catch {
    return null;
  }
}

// ─── Server Functions ─────────────────────────────────────────────────────────

type LoginResult =
  | { token: string; mfaRequired?: false }
  | { mfaRequired: true; pendingToken: string };

export const superAdminLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<LoginResult> => {
    const { timingSafeEqual } = await import("node:crypto");
    const { getSuperAdmins } = await import("./super-totp.server");
    const admins = getSuperAdmins();

    // Encontra o admin pelo e-mail (timing-safe)
    let matchedAdmin: (typeof admins)[number] | null = null;
    for (const a of admins) {
      try {
        const eBuf = Buffer.from(data.email.toLowerCase());
        const eExp = Buffer.from(a.email.toLowerCase());
        if (eBuf.length === eExp.length && timingSafeEqual(eBuf, eExp)) {
          matchedAdmin = a;
          break;
        }
      } catch { /* continua */ }
    }

    // Sempre compara senha (evita timing oracle)
    const passwordOk = (() => {
      try {
        const pBuf = Buffer.from(data.password);
        const pExp = Buffer.from(matchedAdmin?.password ?? "dummy_placeholder");
        return (
          pBuf.length === pExp.length &&
          timingSafeEqual(pBuf, pExp)
        );
      } catch {
        return false;
      }
    })();

    if (!matchedAdmin || !passwordOk) {
      await new Promise((r) =>
        setTimeout(r, 800 + Math.floor(Math.random() * 200)),
      );
      throw new Error("Credenciais inválidas.");
    }

    // Se MFA configurado → emite pending token
    if (matchedAdmin.totpSecret) {
      return {
        mfaRequired: true,
        pendingToken: await createMfaPendingToken(data.email),
      };
    }

    // Sem MFA → token completo imediato
    return { token: await createSuperToken(data.email) };
  });

export const superAdminVerifyMfa = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        pendingToken: z.string().min(1),
        totpCode:     z.string().length(6).regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ token: string }> => {
    const email = await verifyMfaPendingToken(data.pendingToken);
    if (!email) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const { getSuperAdmins, verifyTotpCode } = await import(
      "./super-totp.server"
    );
    const admins = getSuperAdmins();
    const admin  = admins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase(),
    );

    if (!admin?.totpSecret) {
      throw new Error("MFA não configurado para este administrador.");
    }

    if (!verifyTotpCode(data.totpCode, admin.totpSecret)) {
      await new Promise((r) => setTimeout(r, 500));
      throw new Error("Código inválido. Tente novamente.");
    }

    return { token: await createSuperToken(email) };
  });

// Gera novo secret + URI TOTP para o admin autenticado (setup)
export const superAdminGenerateTotpSetup = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st: z.string() }).parse(input),
  )
  .handler(
    async ({ data }): Promise<{ secret: string; uri: string; email: string }> => {
      await requireSuperAuth(data._st);
      const email = await getSuperAuthEmail(data._st);
      if (!email) throw new Error("Unauthorized");

      const { generateTotpSecret, generateTotpUri } = await import(
        "./super-totp.server"
      );
      const secret = generateTotpSecret();
      const uri    = generateTotpUri(email, secret);
      return { secret, uri, email };
    },
  );

// Valida um código TOTP durante o setup (para confirmar que o admin escaneou corretamente)
export const superAdminConfirmTotpSetup = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        _st:      z.string(),
        secret:   z.string().min(16),
        totpCode: z.string().length(6).regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await requireSuperAuth(data._st);
    const { verifyTotpCode } = await import("./super-totp.server");
    const ok = verifyTotpCode(data.totpCode, data.secret);
    if (!ok) throw new Error("Código incorreto. Escaneie novamente e tente.");
    return { ok: true };
  });
