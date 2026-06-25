// Autenticação server-side do super admin
// Valida contra SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD no .env
// Retorna um token assinado com HMAC-SHA256 válido por 8h

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return s;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function createSuperToken(email: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${email}:${exp}`;
  const sig = await hmacSign(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export async function verifySuperToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { timingSafeEqual } = await import("node:crypto");
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) return false;
    const payloadPart = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    // payloadPart = "email:exp"
    const colonIdx = payloadPart.lastIndexOf(":");
    if (colonIdx < 0) return false;
    const expStr = payloadPart.slice(colonIdx + 1);
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return false;
    const expected = await hmacSign(payloadPart, getSecret());
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ─── Verificação de token para uso em handlers (token vem do input da função) ──

export async function requireSuperAuth(token: string | null | undefined): Promise<void> {
  if (!await verifySuperToken(token)) throw new Error("Unauthorized");
}

// ─── Server Function ──────────────────────────────────────────────────────────

export const superAdminLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ token: string }> => {
    const { timingSafeEqual } = await import("node:crypto");
    const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "";
    const adminPass  = process.env.SUPER_ADMIN_PASSWORD ?? "";

    if (!adminEmail || !adminPass) {
      throw new Error("Unauthorized");
    }

    let emailOk = false;
    let passOk  = false;
    try {
      const eBuf = Buffer.from(data.email.toLowerCase());
      const eExp = Buffer.from(adminEmail.toLowerCase());
      emailOk = eBuf.length === eExp.length && timingSafeEqual(eBuf, eExp);

      const pBuf = Buffer.from(data.password);
      const pExp = Buffer.from(adminPass);
      passOk = pBuf.length === pExp.length && timingSafeEqual(pBuf, pExp);
    } catch {
      // comprimentos diferentes já retornam false acima
    }

    if (!emailOk || !passOk) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Credenciais inválidas.");
    }

    return { token: await createSuperToken(data.email) };
  });
