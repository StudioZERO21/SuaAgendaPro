import { authenticator } from "otplib";

// Tolera ±30s de drift de relógio (window = 1 intervalo antes/depois)
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret(20); // 160 bits
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

export type SuperAdmin = {
  email: string;
  password: string;
  totpSecret?: string;
  name?: string;
};

export function getSuperAdmins(): SuperAdmin[] {
  // Formato novo: SUPER_ADMINS = JSON array
  const raw = process.env.SUPER_ADMINS;
  if (raw) {
    try {
      return JSON.parse(raw) as SuperAdmin[];
    } catch {
      console.error("[SuperAuth] SUPER_ADMINS inválido — não é JSON válido");
    }
  }

  // Compatibilidade com formato antigo (admin único via variáveis separadas)
  const email    = process.env.SUPER_ADMIN_EMAIL ?? "";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const totpSecret = process.env.SUPER_ADMIN_TOTP_SECRET;
  if (email && password) {
    return [{ email, password, totpSecret }];
  }

  return [];
}
