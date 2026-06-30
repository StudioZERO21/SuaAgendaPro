import { createServerFn } from "@tanstack/react-start";

/** Verifica sessão super admin via cookie HttpOnly (para SSR guard). */
export const verifySuperSessionFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: boolean }> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getSuperTokenFromRequest } = await import("./super-auth-cookie.server");
    const { verifySuperToken } = await import("./super-auth.server");
    const token = getSuperTokenFromRequest(getRequest());
    return { ok: await verifySuperToken(token) };
  },
);
