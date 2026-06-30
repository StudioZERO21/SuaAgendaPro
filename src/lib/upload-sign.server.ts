/**
 * URLs assinadas para pastas privadas de upload (ex.: support/).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppHmacSecret } from "@/lib/hmac-secret.server";

const DEFAULT_TTL_SEC = 3600;

export function isPrivateUploadPath(relative: string): boolean {
  const clean = relative.replace(/^\/+/, "").toLowerCase();
  return (
    clean.startsWith("support/") ||
    clean.includes("/support/") ||
    clean.startsWith("private/")
  );
}

export function signUploadPath(relative: string, ttlSec = DEFAULT_TTL_SEC): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${relative}:${exp}`;
  const sig = createHmac("sha256", getAppHmacSecret())
    .update(payload)
    .digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyUploadSignature(
  relative: string,
  token: string | null,
): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = parseInt(expStr ?? "", 10);
  if (!exp || Math.floor(Date.now() / 1000) > exp) return false;

  const expected = createHmac("sha256", getAppHmacSecret())
    .update(`${relative}:${exp}`)
    .digest("base64url");

  try {
    const a = Buffer.from(sig ?? "");
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signedUploadUrl(relative: string, origin: string): string {
  const token = signUploadPath(relative);
  return `${origin}/uploads/${relative}?sig=${encodeURIComponent(token)}`;
}
