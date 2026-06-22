import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número de telefone brasileiro enquanto o usuário digita.
 * Suporta 8 dígitos (fixo/regiões sem 9) e 9 dígitos (celular).
 * Exemplos:
 *   (11) 9999-9999  — 8 dígitos (fixo ou regiões antigas)
 *   (11) 99999-9999 — 9 dígitos (celular)
 */
export function formatPhoneBR(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
