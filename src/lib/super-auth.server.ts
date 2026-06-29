import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOKEN_TTL_MS    = 8 * 60 * 60 * 1000;
const MFA_PENDING_TTL = 5 * 60 * 1000;
const PWD_PENDING_TTL = 10 * 60 * 1000;

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

export async function verifySuperToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded   = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return false;
    const payloadPart = decoded.slice(0, lastColon);
    const sig         = decoded.slice(lastColon + 1);
    if (payloadPart.startsWith("mfa:") || payloadPart.startsWith("pwd:")) return false;
    const colonIdx = payloadPart.lastIndexOf(":");
    if (colonIdx < 0) return false;
    const exp = parseInt(payloadPart.slice(colonIdx + 1), 10);
    if (isNaN(exp) || Date.now() > exp) return false;
    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf   = Buffer.from(sig, "base64url");
    const expBuf   = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch { return false; }
}

export async function requireSuperAuth(token: string | null | undefined): Promise<void> {
  if (!await verifySuperToken(token)) throw new Error("Unauthorized");
}

export async function getSuperAuthEmail(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const decoded     = Buffer.from(token, "base64url").toString("utf8");
    const lastColon   = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payloadPart = decoded.slice(0, lastColon);
    if (payloadPart.startsWith("mfa:") || payloadPart.startsWith("pwd:")) return null;
    if (!await verifySuperToken(token)) return null;
    const colonIdx = payloadPart.lastIndexOf(":");
    return payloadPart.slice(0, colonIdx);
  } catch { return null; }
}

// ─── MFA-pending token (5 min) ────────────────────────────────────────────────

async function createMfaPendingToken(email: string): Promise<string> {
  const exp     = Date.now() + MFA_PENDING_TTL;
  const payload = `mfa:${email}:${exp}`;
  const sig     = await hmacSign(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

async function verifyMfaPendingToken(token: string): Promise<string | null> {
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded     = Buffer.from(token, "base64url").toString("utf8");
    const lastColon   = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payloadPart = decoded.slice(0, lastColon);
    const sig         = decoded.slice(lastColon + 1);
    if (!payloadPart.startsWith("mfa:")) return null;
    const withoutPrefix = payloadPart.slice(4);
    const expColon      = withoutPrefix.lastIndexOf(":");
    if (expColon < 0) return null;
    const exp = parseInt(withoutPrefix.slice(expColon + 1), 10);
    if (isNaN(exp) || Date.now() > exp) return null;
    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf   = Buffer.from(sig, "base64url");
    const expBuf   = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return withoutPrefix.slice(0, expColon);
  } catch { return null; }
}

// ─── Password-change pending token (10 min) ───────────────────────────────────

async function createPwdPendingToken(email: string): Promise<string> {
  const exp     = Date.now() + PWD_PENDING_TTL;
  const payload = `pwd:${email}:${exp}`;
  const sig     = await hmacSign(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

async function verifyPwdPendingToken(token: string): Promise<string | null> {
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded     = Buffer.from(token, "base64url").toString("utf8");
    const lastColon   = decoded.lastIndexOf(":");
    if (lastColon < 0) return null;
    const payloadPart = decoded.slice(0, lastColon);
    const sig         = decoded.slice(lastColon + 1);
    if (!payloadPart.startsWith("pwd:")) return null;
    const withoutPrefix = payloadPart.slice(4);
    const expColon      = withoutPrefix.lastIndexOf(":");
    if (expColon < 0) return null;
    const exp = parseInt(withoutPrefix.slice(expColon + 1), 10);
    if (isNaN(exp) || Date.now() > exp) return null;
    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf   = Buffer.from(sig, "base64url");
    const expBuf   = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return withoutPrefix.slice(0, expColon);
  } catch { return null; }
}

// ─── Login ────────────────────────────────────────────────────────────────────

type LoginResult =
  | { token: string; mfaRequired?: false; mustChangePassword?: false }
  | { mfaRequired: true; pendingToken: string }
  | { mustChangePassword: true; pendingToken: string };

export const superAdminLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<LoginResult> => {
    const { timingSafeEqual } = await import("node:crypto");
    const {
      getSuperAdmins, getDbSuperAdmin, upsertDbSuperAdmin,
      hashPassword, verifyPassword, getMfaSecret,
    } = await import("./super-totp.server");

    const emailLower = data.email.toLowerCase();

    // 1. Try DB-based credentials first
    const dbAdmin = await getDbSuperAdmin(emailLower);
    if (dbAdmin) {
      if (!verifyPassword(data.password, dbAdmin.password_hash)) {
        await new Promise((r) => setTimeout(r, 800 + Math.floor(Math.random() * 200)));
        throw new Error("Credenciais inválidas.");
      }
      if (dbAdmin.must_change_password) {
        return { mustChangePassword: true, pendingToken: await createPwdPendingToken(emailLower) };
      }
      const totpSecret = await getMfaSecret(emailLower);
      if (totpSecret) {
        return { mfaRequired: true, pendingToken: await createMfaPendingToken(emailLower) };
      }
      return { token: await createSuperToken(emailLower) };
    }

    // 2. Fallback to env var credentials (auto-migrates to DB on success)
    const admins = getSuperAdmins();
    let matchedAdmin: (typeof admins)[number] | null = null;
    for (const a of admins) {
      try {
        const eBuf = Buffer.from(emailLower);
        const eExp = Buffer.from(a.email.toLowerCase());
        if (eBuf.length === eExp.length && timingSafeEqual(eBuf, eExp)) {
          matchedAdmin = a;
          break;
        }
      } catch { /* continua */ }
    }

    const passwordOk = (() => {
      try {
        const pBuf = Buffer.from(data.password);
        const pExp = Buffer.from(matchedAdmin?.password ?? "dummy_placeholder");
        return pBuf.length === pExp.length && timingSafeEqual(pBuf, pExp);
      } catch { return false; }
    })();

    if (!matchedAdmin || !passwordOk) {
      await new Promise((r) => setTimeout(r, 800 + Math.floor(Math.random() * 200)));
      throw new Error("Credenciais inválidas.");
    }

    // Auto-migrate env var credentials to DB
    try {
      await upsertDbSuperAdmin({
        email:                emailLower,
        name:                 matchedAdmin.name ?? emailLower.split("@")[0],
        password_hash:        hashPassword(data.password),
        must_change_password: matchedAdmin.must_change_password ?? false,
      });
    } catch (e) {
      console.error("[SuperAuth] auto-migrate failed:", e);
    }

    if (matchedAdmin.must_change_password) {
      return { mustChangePassword: true, pendingToken: await createPwdPendingToken(emailLower) };
    }

    const totpSecret = await getMfaSecret(emailLower);
    if (totpSecret) {
      return { mfaRequired: true, pendingToken: await createMfaPendingToken(emailLower) };
    }

    return { token: await createSuperToken(emailLower) };
  });

// ─── MFA verify ───────────────────────────────────────────────────────────────

export const superAdminVerifyMfa = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      pendingToken: z.string().min(1),
      totpCode:     z.string().length(6).regex(/^\d{6}$/),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<{ token: string }> => {
    const email = await verifyMfaPendingToken(data.pendingToken);
    if (!email) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const { getMfaSecret, verifyTotpCode } = await import("./super-totp.server");
    const secret = await getMfaSecret(email);
    if (!secret) throw new Error("MFA não configurado.");
    if (!verifyTotpCode(data.totpCode, secret)) {
      await new Promise((r) => setTimeout(r, 500));
      throw new Error("Código inválido. Tente novamente.");
    }
    return { token: await createSuperToken(email) };
  });

// ─── Forced password change (must_change_password) ────────────────────────────

export const superAdminForcedChangePassword = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      pendingToken: z.string().min(1),
      newPassword:  z.string().min(8),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<{ token: string }> => {
    const email = await verifyPwdPendingToken(data.pendingToken);
    if (!email) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const { hashPassword, updateDbSuperAdminPassword } = await import("./super-totp.server");
    await updateDbSuperAdminPassword(email, hashPassword(data.newPassword));
    return { token: await createSuperToken(email) };
  });

// ─── TOTP setup ───────────────────────────────────────────────────────────────

export const superAdminGenerateTotpSetup = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ secret: string; uri: string; email: string }> => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { generateTotpSecret, generateTotpUri } = await import("./super-totp.server");
    const secret = generateTotpSecret();
    const uri    = generateTotpUri(email, secret);
    return { secret, uri, email };
  });

export const superAdminActivateMfa = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st: z.string(), secret: z.string().min(16), totpCode: z.string().length(6).regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { verifyTotpCode, saveMfaSecret } = await import("./super-totp.server");
    if (!verifyTotpCode(data.totpCode, data.secret)) throw new Error("Código incorreto. Escaneie novamente e tente.");
    await saveMfaSecret(email, data.secret);
    return { ok: true };
  });

export const superAdminDeactivateMfa = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { disableMfaSecret } = await import("./super-totp.server");
    await disableMfaSecret(email);
    return { ok: true };
  });

export const superAdminGetMfaStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ enabled: boolean; email: string }> => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { isMfaEnabled } = await import("./super-totp.server");
    return { enabled: await isMfaEnabled(email), email };
  });
