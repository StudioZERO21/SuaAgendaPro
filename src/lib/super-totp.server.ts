import { authenticator } from "otplib";
import { createClient } from "@supabase/supabase-js";

authenticator.options = { window: 1 }; // tolera ±30s de drift

// ─── TOTP ─────────────────────────────────────────────────────────────────────

export function generateTotpSecret(): string {
  return authenticator.generateSecret(20);
}

export function generateTotpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, "SuaAgenda Super Admin", secret);
}

export function verifyTotpCode(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

// ─── Credenciais dos admins (ainda em env para senha) ─────────────────────────

export type SuperAdmin = {
  email: string;
  password: string;
  totpSecret?: string;
  name?: string;
};

export function getSuperAdmins(): SuperAdmin[] {
  // Novo formato: SUPER_ADMINS = JSON array
  const raw = process.env.SUPER_ADMINS;
  if (raw) {
    try {
      return JSON.parse(raw) as SuperAdmin[];
    } catch {
      console.error("[SuperAuth] SUPER_ADMINS inválido — JSON malformado");
    }
  }
  // Formato legado (variáveis separadas)
  const email    = process.env.SUPER_ADMIN_EMAIL ?? "";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  if (email && password) return [{ email, password }];
  return [];
}

// ─── MFA no Supabase (sem edição manual de arquivos) ─────────────────────────

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Retorna o secret TOTP ativo para um email, ou null se não configurado. */
export async function getMfaSecret(email: string): Promise<string | null> {
  const { data } = await serviceClient()
    .from("super_admin_mfa")
    .select("totp_secret")
    .eq("email", email.toLowerCase())
    .eq("enabled", true)
    .maybeSingle();
  return data?.totp_secret ?? null;
}

/** Ativa (ou substitui) o MFA para um admin. */
export async function saveMfaSecret(email: string, secret: string): Promise<void> {
  const { error } = await serviceClient()
    .from("super_admin_mfa")
    .upsert(
      { email: email.toLowerCase(), totp_secret: secret, enabled: true, updated_at: new Date().toISOString() },
      { onConflict: "email" },
    );
  if (error) throw new Error("Falha ao salvar MFA: " + error.message);
}

/** Desativa o MFA para um admin (mantém o registro para histórico). */
export async function disableMfaSecret(email: string): Promise<void> {
  const { error } = await serviceClient()
    .from("super_admin_mfa")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());
  if (error) throw new Error("Falha ao desativar MFA: " + error.message);
}

/** Verifica se um admin tem MFA ativo. */
export async function isMfaEnabled(email: string): Promise<boolean> {
  const secret = await getMfaSecret(email);
  return secret !== null;
}
