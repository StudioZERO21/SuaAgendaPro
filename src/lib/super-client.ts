// Utilitários para chamadas de server functions do super admin

import { getSuperToken } from "@/lib/super-auth";

/** Adiciona o token super admin ao objeto de input de qualquer server function */
export function withSuperToken<T extends Record<string, unknown>>(extra?: T): T & { _st: string } {
  return { ...(extra ?? {} as T), _st: getSuperToken() ?? "" };
}

/** @deprecated Não mais necessário — o token é passado via input das funções */
export function configureSuperFetch() { /* no-op */ }
