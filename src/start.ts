import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// ─── Rotas por domínio ────────────────────────────────────────────────────────

const APP_ROUTE_PREFIXES = [
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
];

const SITE_ONLY_PREFIXES = [
  "/precos",
  "/recursos",
  "/contato",
];

// Rotas de autenticação/conta — devem viver no subdomínio do app
// (app.suaagenda.pro), igual o super admin em admin.suaagenda.pro.
// Motivo: a sessão do Supabase fica em cookie (.suaagenda.pro, compartilhado),
// mas o session_nonce do single-session fica em localStorage (por origem).
// Mantendo login + app no MESMO origin, o nonce fica consistente e o
// single-session não derruba o usuário por engano.
const AUTH_PREFIXES = [
  "/login",
  "/cadastro",
  "/auth/callback",
  "/reset-password",
  "/redefinir-senha",
  "/trocar-senha",
];

const ADMIN_PREFIX = "/super";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectSubdomain(hostname: string): "site" | "app" | "admin" {
  if (hostname.startsWith("app.")) return "app";
  if (hostname.startsWith("admin.")) return "admin";
  return "site";
}

function isLocalDev(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.")
  );
}

function isPassthrough(path: string): boolean {
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_server") || // cobre /_server/ E /_serverFn/ (server functions)
    path.startsWith("/_build/") ||
    path.startsWith("/_nitro/") ||
    path.startsWith("/@")
  ) {
    return true;
  }
  if (
    /\.(js|mjs|cjs|ts|css|map|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|otf|json|txt|xml|pdf)$/.test(
      path,
    )
  ) {
    return true;
  }
  return false;
}

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

// ─── Middleware de subdomínio ─────────────────────────────────────────────────

const subdomainMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const req = getRequest();
    if (!req) return await next();

    const host = req.headers.get("host") ?? "";
    const hostname = host.split(":")[0];

    if (isLocalDev(hostname)) return await next();

    const path = new URL(req.url).pathname;
    if (isPassthrough(path)) return await next();

    const subdomain = detectSubdomain(hostname);

    if (subdomain === "site") {
      if (matchesPrefix(path, APP_ROUTE_PREFIXES)) {
        return Response.redirect(`https://app.suaagenda.pro${path}`, 302);
      }
      // Auth/conta sempre no subdomínio do app
      if (matchesPrefix(path, AUTH_PREFIXES)) {
        return Response.redirect(`https://app.suaagenda.pro${path}`, 302);
      }
      if (path === ADMIN_PREFIX || path.startsWith(ADMIN_PREFIX + "/")) {
        return Response.redirect(`https://admin.suaagenda.pro${path}`, 302);
      }
    }

    if (subdomain === "app") {
      // Raiz do domínio app → redireciona para a tela de Agenda
      if (path === "/") {
        return Response.redirect("https://app.suaagenda.pro/app", 302);
      }
      if (matchesPrefix(path, SITE_ONLY_PREFIXES)) {
        return Response.redirect(`https://suaagenda.pro${path}`, 302);
      }
      if (path === ADMIN_PREFIX || path.startsWith(ADMIN_PREFIX + "/")) {
        return Response.redirect(`https://admin.suaagenda.pro${path}`, 302);
      }
    }

    if (subdomain === "admin") {
      const isAdminPath =
        path === ADMIN_PREFIX || path.startsWith(ADMIN_PREFIX + "/");
      if (!isAdminPath) {
        return Response.redirect("https://admin.suaagenda.pro/super/", 302);
      }
    }
  } catch {
    // não interrompe o app se o middleware falhar
  }

  return await next();
});

// ─── Middleware de erro (mantém comportamento original) ───────────────────────

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [subdomainMiddleware, errorMiddleware],
}));
