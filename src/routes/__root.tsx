import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AuthContext, useAuthState, createAuthActions } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  type SubscriptionInfo,
  isBlocked,
  requiresSubscription,
} from "@/lib/subscription-guard";
import { useDeviceGuard } from "@/lib/device-guard";
import type { AccentId, FontId, ThemeId } from "@/lib/personalization";
import {
  applyAccentVars,
  buildThemeInitScript,
  resolveIsDark,
  THEME_ACCENTS,
  THEME_FONTS,
  THEME_GRAY,
} from "@/lib/theme-vars";
import { SystemModeProvider, useSystemConfig } from "@/components/system-mode-provider";
import { TestModeBanner } from "@/components/test-mode-banner";
import { MaintenanceOverlay } from "@/components/maintenance-overlay";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import {
  resolveSubdomain,
  resolveSubdomainFromPathOnly,
  shouldRegisterServiceWorker,
  type AppSubdomain,
} from "@/lib/pwa-context";
import {
  LOCALE_HEAD_META,
  SITE_LANG,
} from "@/lib/site-locale";
import {
  mergeAndApplyUiSettings,
  useProfileUiSettings,
} from "@/hooks/useProfileUiSettings";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/contato",
  "/privacidade",
  "/termos",
  "/dsar",
  "/recursos",
  "/precos",
  "/reset-password",
  "/redefinir-senha",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/agendar/")) return true;
  if (pathname.startsWith("/perfil-publico")) return true;
  if (pathname.startsWith("/avaliar/")) return true;
  if (pathname.startsWith("/super")) return true;
  return false;
}

function AuthGuard({
  children,
  subscription,
}: {
  children: ReactNode;
  subscription: SubscriptionInfo | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading } = useAuthState();
  useDeviceGuard();

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (isLoading) return;
    if (!session && !isPublicPath(location.pathname)) {
      navigate({ to: "/login" });
    }
  }, [session, isLoading, location.pathname, navigate]);

  // Redireciona para /plano se assinatura bloqueada
  useEffect(() => {
    if (!session || !subscription) return;
    if (isBlocked(subscription) && requiresSubscription(location.pathname)) {
      navigate({ to: "/plano" });
    }
  }, [subscription, location.pathname, session, navigate]);

  return <>{children}</>;
}

function NotFoundComponent() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  // Rastreamento da rota que caiu em 404
  useEffect(() => {
    if (typeof window === "undefined") return;
    const info = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
      referrer: document.referrer || "(direto)",
      timestamp: new Date().toISOString(),
    };
    console.warn("[404] Rota não encontrada:", info);
    try {
      reportLovableError(
        new Error(`404 Not Found: ${info.pathname}${info.search}`),
        { boundary: "tanstack_root_not_found", ...info },
      );
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      router.navigate({ to: "/" });
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, router]);

  const pct = ((5 - seconds) / 5) * 100;
  const requestedPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden not-found-animated-bg">
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        {/* Parte 1: topo vazio */}
        <div className="flex-1" />

        {/* Parte 2: 404 + barra de progresso */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Erro
          </p>

          <h1
            className="mt-4 font-display text-[180px] font-bold leading-none tracking-tight sm:text-[220px]"
            style={{
              backgroundImage: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </h1>

          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/40">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${pct}%`,
                background: "var(--gradient-primary)",
              }}
            />
          </div>
        </div>

        {/* Parte 3: textos e botões na base */}
        <div className="flex flex-1 flex-col justify-end pb-8 text-center">
          <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
            Oooops…
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Não foi possível achar a página que você está procurando.
          </p>
          {requestedPath && (
            <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground/80">
              {requestedPath}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Você será redirecionado para a página inicial em{" "}
            <span className="font-bold text-foreground">{seconds}s</span>, ou
            escolha uma das opções abaixo.
          </p>

          <div className="mt-8 flex w-full flex-row justify-center gap-3">
            <button
              onClick={() => router.history.back()}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-4 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <Link
              to="/"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
              style={{
                background: "linear-gradient(135deg, #ec4899, #f472b6)",
              }}
            >
              <Home className="h-4 w-4" />
              Início
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .not-found-animated-bg {
          background: linear-gradient(-45deg, #ffe4ef, #fbcfe8, #f9a8d4, #fce7f3, #fbcfe8);
          background-size: 400% 400%;
          animation: notFoundGradient 14s ease infinite;
        }
        @keyframes notFoundGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar a página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar atualizar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir ao início
          </a>
        </div>
      </div>
    </div>
  );
}

function resolveSubdomainForRequest(pathname: string): AppSubdomain {
  if (typeof window !== "undefined") {
    return resolveSubdomain(window.location.hostname, pathname);
  }
  return resolveSubdomainFromPathOnly(pathname);
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => ({
    subdomain: resolveSubdomainForRequest(location.pathname),
  }),

  loader: async ({ location }) => ({
    subdomain: resolveSubdomainForRequest(location.pathname),
  }),

  head: ({ loaderData }) => {
    const subdomain = loaderData?.subdomain ?? "site";
    const isApp   = subdomain === "app";
    const isAdmin = subdomain === "admin";

    const title = isApp
      ? "Minha Agenda — SuaAgenda.Pro"
      : isAdmin
      ? "Super Admin — SuaAgenda.Pro"
      : "SuaAgenda.Pro — Agenda premium para profissionais da beleza";

    const description = isApp
      ? "Sua agenda de atendimentos."
      : "Sua agenda, seu tempo, mais clientes. App de agendamento premium para profissionais autônomos da beleza.";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#1e3a5f" },
        ...LOCALE_HEAD_META,
        { title },
        { name: "description", content: description },
        { property: "og:title", content: "SuaAgenda.Pro" },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        ...(isApp
          ? [
              { name: "mobile-web-app-capable", content: "yes" },
              { name: "apple-mobile-web-app-capable", content: "yes" },
              { name: "apple-mobile-web-app-title", content: "SuaAgenda" },
            ]
          : []),
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: isApp ? "/app-manifest.json" : "/manifest.json" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Applied synchronously in <head> (SSR) AND immediately when the JS module
// loads on the client — so the correct theme is set before the first React
// render regardless of whether the server streamed the script tag first.
function applyThemeVars() {
  if (typeof document === "undefined") return;
  try {
    const d = JSON.parse(localStorage.getItem("sa.personalizacao") || "null") as {
      accent?: AccentId;
      font?: FontId;
      theme?: ThemeId;
      highContrast?: boolean;
    } | null;
    const ac = (d?.accent && THEME_ACCENTS[d.accent]) || THEME_GRAY;
    const font = (d?.font && THEME_FONTS[d.font]) || THEME_FONTS.playfair;
    const theme = d?.theme || "light";
    const e = document.documentElement;
    const isDark = resolveIsDark(theme);
    e.classList.toggle("dark", isDark);
    applyAccentVars(e, ac, isDark);
    e.style.setProperty("--font-display", font);
    if (d?.highContrast) e.classList.add("high-contrast");
    const mt = document.querySelector('meta[name="theme-color"]');
    if (mt) mt.setAttribute("content", ac.p);
  } catch { /* silent */ }
}

// Run immediately when this JS module is evaluated (CSR path — before first React render)
applyThemeVars();

const THEME_INIT_SCRIPT = buildThemeInitScript();

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang={SITE_LANG} translate="no" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isSuperRoute = router.state.location.pathname.startsWith("/super");

  const navigate = useNavigate();
  const { session, setSession, user, setUser, isLoading, wasKickedOut } = useAuthState();
  const authActions = useMemo(() => createAuthActions(setSession, setUser), [setSession, setUser]);

  const authValue = useMemo(
    () => ({ session, user, isLoading, ...authActions }),
    [session, user, isLoading, authActions],
  );

  useEffect(() => {
    if (!wasKickedOut) return;
    import("@/lib/activity.functions").then(({ recordActivity }) =>
      recordActivity({ data: { event: "session_kicked", email: user?.email ?? undefined, professionalId: user?.id } }).catch(() => {}),
    );
    toast.error("Sua sessão foi encerrada porque você entrou em outro dispositivo.", { duration: 8000 });
    navigate({ to: "/login" });
  }, [wasKickedOut, navigate, user]);

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  // 1. Aplica tema do localStorage imediatamente (sem flash)
  useEffect(() => {
    import("../lib/personalization").then((m) => {
      m.applyPersonalization(m.loadPersonalization());
    });
  }, []);

  // 3. Busca assinatura e verifica bloqueio
  useEffect(() => {
    if (!user?.id) { setSubscription(null); return; }
    supabase
      .from("subscriptions")
      .select("status, plan_id, trial_ends_at, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const endsAt = data.trial_ends_at ?? data.current_period_end;
        const diff = endsAt ? new Date(endsAt).getTime() - Date.now() : null;
        setSubscription({
          status: data.status as SubscriptionInfo["status"],
          planId: data.plan_id,
          trialEndsAt: data.trial_ends_at,
          currentPeriodEnd: data.current_period_end,
          daysRemaining: diff !== null ? Math.max(0, Math.ceil(diff / 86_400_000)) : null,
        });
      });
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!shouldRegisterServiceWorker(window.location.hostname)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (isSuperRoute) {
      html.classList.add("super-scope");
    } else {
      html.classList.remove("super-scope");
    }
  }, [isSuperRoute]);

  return (
    <QueryClientProvider client={queryClient}>
      <UiSettingsSync userId={user?.id} />
      <AuthContext.Provider value={authValue}>
        <SystemModeProvider>
          <SystemModeGate isSuperRoute={isSuperRoute} />
          <AuthGuard subscription={subscription}>
            <Outlet />
            <PwaInstallBanner />
          </AuthGuard>
        </SystemModeProvider>
        <Toaster position="top-center" richColors />
        <CookieConsentBanner />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

// Sincroniza ui_settings do Supabase — DENTRO do QueryClientProvider (useQuery
// não pode rodar no RootComponent, que está acima do provider que ele renderiza).
function UiSettingsSync({ userId }: { userId: string | undefined }) {
  const { data: remoteUiSettings } = useProfileUiSettings(userId);
  useEffect(() => {
    if (remoteUiSettings) mergeAndApplyUiSettings(remoteUiSettings);
  }, [remoteUiSettings]);
  return null;
}

function SystemModeGate({ isSuperRoute }: { isSuperRoute: boolean }) {
  const { config } = useSystemConfig();
  const showMaintenance = (config?.maintenanceModeActive ?? false) && !isSuperRoute;
  return (
    <>
      {!isSuperRoute && <TestModeBanner />}
      {showMaintenance && <MaintenanceOverlay />}
    </>
  );
}
