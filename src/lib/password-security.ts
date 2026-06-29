export type PasswordStrength = "fraca" | "média" | "forte" | "muito forte";

export interface PasswordValidation {
  valid:    boolean;
  strength: PasswordStrength;
  score:    number; // 0-4
  errors:   string[];
  checks: {
    length:    boolean;
    uppercase: boolean;
    lowercase: boolean;
    number:    boolean;
    special:   boolean;
    notCommon: boolean;
  };
}

const COMMON = new Set([
  "password123456", "123456789012", "qwerty123456", "senha123456789",
  "senha12345678", "minhasenha123", "brasil123456", "1234567890ab",
  "admin123456789", "welcome123456", "monkey123456!", "letmein123456",
]);

const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    length:    password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   SPECIAL_RE.test(password),
    notCommon: !COMMON.has(password.toLowerCase()),
  };

  const errors: string[] = [];
  if (!checks.length)    errors.push("Mínimo de 12 caracteres");
  if (!checks.uppercase) errors.push("Pelo menos 1 letra maiúscula (A-Z)");
  if (!checks.lowercase) errors.push("Pelo menos 1 letra minúscula (a-z)");
  if (!checks.number)    errors.push("Pelo menos 1 número (0-9)");
  if (!checks.special)   errors.push("Pelo menos 1 símbolo (!@#$%...)");
  if (!checks.notCommon) errors.push("Senha muito comum — escolha outra");

  const passed  = Object.values(checks).filter(Boolean).length;
  const score   = Math.min(4, Math.max(0, passed - 1)); // 0-4
  const strength: PasswordStrength =
    passed <= 2 ? "fraca" :
    passed === 3 ? "média" :
    passed === 5 ? "forte" : "muito forte";

  return { valid: errors.length === 0, strength, score, errors, checks };
}

export const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  "fraca":       "bg-destructive",
  "média":       "bg-amber-500",
  "forte":       "bg-emerald-500",
  "muito forte": "bg-emerald-600",
};

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  "fraca":       "Fraca",
  "média":       "Média",
  "forte":       "Forte",
  "muito forte": "Muito forte",
};
