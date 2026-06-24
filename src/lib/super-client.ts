// Injeta o token super admin no header x-super-token de toda fetch do servidor
// Uso: chamar configureSuperFetch() antes de qualquer server function super admin

import { getSuperToken } from "@/lib/super-auth";

let _patched = false;

export function configureSuperFetch() {
  if (typeof window === "undefined" || _patched) return;
  const original = window.fetch;
  window.fetch = function (input, init) {
    const token = getSuperToken();
    if (token) {
      init = init ?? {};
      init.headers = {
        ...(init.headers as Record<string, string> ?? {}),
        "x-super-token": token,
      };
    }
    return original.call(this, input, init);
  };
  _patched = true;
}
