// Injeta o token super admin no header x-super-token de toda fetch do servidor
// Uso: chamar configureSuperFetch() antes de qualquer server function super admin

import { getSuperToken } from "@/lib/super-auth";

const _MARK = "__superPatched";

export function configureSuperFetch() {
  if (typeof window === "undefined") return;
  if ((window.fetch as any)[_MARK]) return;

  const original = window.fetch;
  const patched = function (input: RequestInfo | URL, init?: RequestInit) {
    const token = getSuperToken();
    if (token) {
      init = { ...(init ?? {}) };
      const headers = new Headers(init.headers);
      headers.set("x-super-token", token);
      init.headers = headers;
    }
    return original.call(window, input, init);
  };
  (patched as any)[_MARK] = true;
  window.fetch = patched;
}
