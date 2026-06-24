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

// Lazy import do módulo crypto para não vazar no bundle do cliente
async function getCrypto() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("crypto") as typeof import("crypto");
}

function signTokenSync(payload: string, secret: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require("crypto") as typeof import("crypto");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function createSuperToken(email: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${email}:${exp}`;
  const sig = signTokenSync(payload, getSecret());
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export async function verifySuperToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { timingSafeEqual } = await getCrypto();
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [email, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return false;
    const expected = signTokenSync(`${email}:${expStr}`, getSecret());
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// ─── Server Function ──────────────────────────────────────────────────────────

export const superAdminLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ token: string }> => {
    const { timingSafeEqual } = await getCrypto();
    const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "";
    const adminPass  = process.env.SUPER_ADMIN_PASSWORD ?? "";

    if (!adminEmail || !adminPass) {
      throw new Error("Super admin não configurado no servidor.");
    }

    let emailOk = false;
    let passOk = false;
    try {
      const eBuf = Buffer.from(data.email.toLowerCase());
      const eExp = Buffer.from(adminEmail.toLowerCase());
      emailOk = eBuf.length === eExp.length && timingSafeEqual(eBuf, eExp);

      const pBuf = Buffer.from(data.password);
      const pExp = Buffer.from(adminPass);
      passOk = pBuf.length === pExp.length && timingSafeEqual(pBuf, pExp);
    } catch {
      // length mismatch handled above
    }

    if (!emailOk || !passOk) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Credenciais inválidas.");
    }

    return { token: await createSuperToken(data.email) };
  });
