import { createHmac, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ─── Base32 (RFC 4648) ────────────────────────────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(secret: string): Buffer {
  const s = secret.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of s) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(bytes);
}

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, result = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { result += B32[(value >>> (bits - 5)) & 0x1f]; bits -= 5; }
  }
  if (bits > 0) result += B32[(value << (5 - bits)) & 0x1f];
  return result;
}

// ─── TOTP (RFC 6238) ─────────────────────────────────────────────────────────

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const mac    = createHmac("sha1", key).update(buf).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const code   = ((mac[offset] & 0x7f) << 24) | ((mac[offset + 1] & 0xff) << 16) |
                 ((mac[offset + 2] & 0xff) << 8) | (mac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateTotpUri(email: string, secret: string): string {
  const issuer  = encodeURIComponent("SuaAgenda Super Admin");
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotpCode(code: string, secret: string): boolean {
  const c = code.replace(/\s/g, "");
  if (c.length !== 6 || !/^\d{6}$/.test(c)) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  return [-1, 0, 1].some((d) => hotp(secret, step + d) === c);
}

// ─── PBKDF2 password hashing ─────────────────────────────────────────────────

const PBKDF2_ITERS = 200_000;
const PBKDF2_LEN   = 64;
const PBKDF2_ALGO  = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERS, PBKDF2_LEN, PBKDF2_ALGO).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const computed = pbkdf2Sync(password, salt, PBKDF2_ITERS, PBKDF2_LEN, PBKDF2_ALGO).toString("hex");
    const hBuf = Buffer.from(hash, "hex");
    const cBuf = Buffer.from(computed, "hex");
    if (hBuf.length !== cBuf.length) return false;
    return timingSafeEqual(hBuf, cBuf);
  } catch { return false; }
}

// ─── Supabase client (service role) ──────────────────────────────────────────

function svc() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── super_admin_credentials (DB-based credentials) ──────────────────────────

export type DbSuperAdmin = {
  email: string;
  name: string;
  password_hash: string;
  must_change_password: boolean;
};

export async function getDbSuperAdmin(email: string): Promise<DbSuperAdmin | null> {
  const { data } = await svc()
    .from("super_admin_credentials")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data ?? null;
}

export async function getAllDbSuperAdmins(): Promise<DbSuperAdmin[]> {
  const { data } = await svc()
    .from("super_admin_credentials")
    .select("*")
    .order("created_at");
  return data ?? [];
}

export async function upsertDbSuperAdmin(
  admin: DbSuperAdmin & { created_by?: string },
): Promise<void> {
  const { error } = await svc()
    .from("super_admin_credentials")
    .upsert(
      { ...admin, email: admin.email.toLowerCase(), updated_at: new Date().toISOString() },
      { onConflict: "email" },
    );
  if (error) throw new Error("Falha ao salvar admin: " + error.message);
}

export async function updateDbSuperAdminPassword(
  email: string,
  newPasswordHash: string,
): Promise<void> {
  const { error } = await svc()
    .from("super_admin_credentials")
    .update({ password_hash: newPasswordHash, must_change_password: false, updated_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());
  if (error) throw new Error("Falha ao atualizar senha: " + error.message);
}

export async function updateDbSuperAdminName(email: string, name: string): Promise<void> {
  const { error } = await svc()
    .from("super_admin_credentials")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());
  if (error) throw new Error("Falha ao atualizar nome: " + error.message);
}

export async function deleteDbSuperAdmin(email: string): Promise<void> {
  const { error } = await svc()
    .from("super_admin_credentials")
    .delete()
    .eq("email", email.toLowerCase());
  if (error) throw new Error("Falha ao remover admin: " + error.message);
}

// ─── Env-var credentials (legacy + bootstrap) ────────────────────────────────

export type SuperAdmin = { email: string; password: string; name?: string; must_change_password?: boolean };

export function getSuperAdmins(): SuperAdmin[] {
  const raw = process.env.SUPER_ADMINS;
  if (raw) {
    try { return JSON.parse(raw) as SuperAdmin[]; }
    catch { console.error("[SuperAuth] SUPER_ADMINS: JSON inválido"); }
  }
  const email    = process.env.SUPER_ADMIN_EMAIL ?? "";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const name     = process.env.SUPER_ADMIN_NAME ?? "";
  if (email && password) return [{ email, password, name: name || undefined }];
  return [];
}

// ─── MFA no Supabase ──────────────────────────────────────────────────────────

export async function getMfaSecret(email: string): Promise<string | null> {
  const { data } = await svc()
    .from("super_admin_mfa")
    .select("totp_secret")
    .eq("email", email.toLowerCase())
    .eq("enabled", true)
    .maybeSingle();
  return data?.totp_secret ?? null;
}

export async function saveMfaSecret(email: string, secret: string): Promise<void> {
  const { error } = await svc()
    .from("super_admin_mfa")
    .upsert(
      { email: email.toLowerCase(), totp_secret: secret, enabled: true, updated_at: new Date().toISOString() },
      { onConflict: "email" },
    );
  if (error) throw new Error("Falha ao salvar MFA: " + error.message);
}

export async function disableMfaSecret(email: string): Promise<void> {
  const { error } = await svc()
    .from("super_admin_mfa")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());
  if (error) throw new Error("Falha ao desativar MFA: " + error.message);
}

export async function isMfaEnabled(email: string): Promise<boolean> {
  return (await getMfaSecret(email)) !== null;
}
