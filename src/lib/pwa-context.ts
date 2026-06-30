/** Rotas do app operacional (espelha start.ts). */
export const APP_ROUTE_PREFIXES = [
  "/app",
  "/dashboard",
  "/clientes",
  "/servicos",
  "/servico",
  "/horarios",
  "/portfolio",
  "/avaliacoes",
  "/notificacoes",
  "/notificacoes-todas",
  "/perfil-profissional",
  "/personalizacao",
  "/pagamentos",
  "/transacoes",
  "/plano",
  "/mais",
  "/onboarding",
  "/whatsapp",
  "/google-calendar",
  "/saudacao",
  "/use-no-celular",
] as const;

/** Auth no subdomínio app — precisa do manifest instalável também. */
export const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/cadastro",
  "/reset-password",
  "/redefinir-senha",
  "/trocar-senha",
] as const;

export type AppSubdomain = "site" | "app" | "admin";

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Fallback SSR quando hostname não está disponível no bundle cliente. */
export function resolveSubdomainFromPathOnly(pathname: string): AppSubdomain {
  if (pathname.startsWith("/super")) return "admin";
  if (matchesPrefix(pathname, APP_ROUTE_PREFIXES)) return "app";
  if (matchesPrefix(pathname, AUTH_ROUTE_PREFIXES)) return "app";
  return "site";
}

/**
 * Resolve qual manifest / contexto PWA usar.
 * No host `app.*` todo o origin é instalável (inclui /login).
 */
export function resolveSubdomain(
  hostname: string,
  pathname: string,
): AppSubdomain {
  const host = hostname.split(":")[0].toLowerCase();

  if (pathname.startsWith("/super") || host.startsWith("admin.")) {
    return "admin";
  }
  if (host.startsWith("app.")) {
    return "app";
  }
  if (
    matchesPrefix(pathname, APP_ROUTE_PREFIXES) ||
    matchesPrefix(pathname, AUTH_ROUTE_PREFIXES)
  ) {
    return "app";
  }
  return "site";
}

/** Registra SW no subdomínio do app e em dev local. */
export function shouldRegisterServiceWorker(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  if (host.startsWith("app.")) return true;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  );
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // Safari iOS
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}
