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
import { SystemModeProvider, useSystemConfig } from "@/components/system-mode-provider";
import { TestModeBanner } from "@/components/test-mode-banner";
import { MaintenanceOverlay } from "@/components/maintenance-overlay";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/contato",
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
              Home
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
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// Rotas que pertencem ao domínio app.suaagenda.pro
const APP_ROUTE_PREFIXES = [
  "/app", "/dashboard", "/clientes", "/servicos", "/servico",
  "/horarios", "/portfolio", "/avaliacoes", "/notificacoes",
  "/notificacoes-todas", "/perfil-profissional", "/personalizacao",
  "/pagamentos", "/transacoes", "/plano", "/mais", "/onboarding",
  "/whatsapp", "/google-calendar", "/saudacao", "/use-no-celular",
];

// Detecta subdomínio pelo path — seguro em SSR e no cliente sem server imports.
// O subdomainMiddleware (src/start.ts) já garante que cada path chega no domínio certo.
function subdomainFromPath(pathname: string): "site" | "app" | "admin" {
  if (pathname.startsWith("/super")) return "admin";
  if (APP_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "app";
  return "site";
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    const subdomain = subdomainFromPath(location.pathname);
    return { subdomain };
  },

  loader: async ({ context }) => {
    // loaderData é o único jeito de passar dados para head()
    const subdomain = (context as any).subdomain as "site" | "app" | "admin" ?? "site";
    return { subdomain };
  },

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
        { name: "theme-color", content: "#ec4899" },
        { title },
        { name: "description", content: description },
        { property: "og:title", content: "SuaAgenda.Pro" },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: isApp ? "/app-manifest.json" : "/manifest.json" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
        },
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
const THEME_ACCENTS: Record<string, {p:string;g:string;a:string;r:string;s:string;sf:string;m:string;mf:string;b:string;cl:string;gs:string;gc:string}> = {
  rose:    {p:"#be185d",g:"#ec4899",a:"#a21caf",r:"#be185d",s:"#fdf2f8",sf:"#831843",m:"#f7f4f8",mf:"#6b5b73",b:"#f3e8ee",cl:"#fdf2f8",gs:"linear-gradient(135deg,#fce7f3 0%,#fdf2f8 50%,#fae8ff 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#fdf2f8 100%)"},
  violet:  {p:"#6d28d9",g:"#a78bfa",a:"#5b21b6",r:"#6d28d9",s:"#f5f3ff",sf:"#4c1d95",m:"#f0eeff",mf:"#5b4e8b",b:"#e8e3fd",cl:"#f5f3ff",gs:"linear-gradient(135deg,#ede9fe 0%,#f5f3ff 50%,#f0eeff 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#f5f3ff 100%)"},
  amber:   {p:"#b45309",g:"#fbbf24",a:"#9a3412",r:"#b45309",s:"#fffbeb",sf:"#78350f",m:"#fef9e7",mf:"#8a6e3a",b:"#fde9b0",cl:"#fffbeb",gs:"linear-gradient(135deg,#fef3c7 0%,#fffbeb 50%,#fefce8 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#fffbeb 100%)"},
  emerald: {p:"#047857",g:"#34d399",a:"#065f46",r:"#047857",s:"#ecfdf5",sf:"#064e3b",m:"#f0fdf4",mf:"#3d7a5e",b:"#c9f0de",cl:"#ecfdf5",gs:"linear-gradient(135deg,#d1fae5 0%,#ecfdf5 50%,#f0fdf4 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#ecfdf5 100%)"},
  sky:     {p:"#0369a1",g:"#38bdf8",a:"#1d4ed8",r:"#0369a1",s:"#f0f9ff",sf:"#0c4a6e",m:"#e6f5ff",mf:"#3a7a9e",b:"#c8e8f8",cl:"#f0f9ff",gs:"linear-gradient(135deg,#e0f2fe 0%,#f0f9ff 50%,#e8f4ff 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#f0f9ff 100%)"},
  noir:    {p:"#1f1230",g:"#7c3aed",a:"#312e81",r:"#1f1230",s:"#f8f7f9",sf:"#1f1230",m:"#f3f1f6",mf:"#4a3f57",b:"#e4e0ed",cl:"#f8f7f9",gs:"linear-gradient(135deg,#ede9fe 0%,#f8f7f9 50%,#f3f0ff 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#f8f7f9 100%)"},
};
const THEME_FONTS: Record<string, string> = {
  playfair: '"Playfair Display",Georgia,serif',
  inter: 'Inter,ui-sans-serif,system-ui,sans-serif',
  dm: '"DM Serif Display",Georgia,serif',
};
// Gray fallback shown while theme is unknown (first visit / cleared storage)
const THEME_GRAY = {p:"#6b7280",g:"#9ca3af",a:"#4b5563",r:"#6b7280",s:"#f9fafb",sf:"#374151",m:"#f3f4f6",mf:"#6b7280",b:"#e5e7eb",cl:"#f9fafb",gs:"linear-gradient(135deg,#f3f4f6 0%,#f9fafb 50%,#f3f4f6 100%)",gc:"linear-gradient(135deg,#ffffff 0%,#f9fafb 100%)"};

function applyThemeVars() {
  if (typeof document === "undefined") return;
  try {
    const d = JSON.parse(localStorage.getItem("sa.personalizacao") || "null");
    const ac = (d && THEME_ACCENTS[d.accent]) || THEME_GRAY;
    const font = (d && THEME_FONTS[d.font]) || THEME_FONTS.playfair;
    const theme = (d && d.theme) || "light";
    const e = document.documentElement;
    e.style.setProperty("--primary", ac.p);
    e.style.setProperty("--primary-glow", ac.g);
    e.style.setProperty("--accent", ac.a);
    e.style.setProperty("--ring", ac.r);
    e.style.setProperty("--primary-foreground", "#ffffff");
    e.style.setProperty("--gradient-primary", "linear-gradient(135deg," + ac.p + " 0%," + ac.a + " 100%)");
    e.style.setProperty("--shadow-glow", "0 10px 30px -10px " + ac.p + "73");
    e.style.setProperty("--secondary", ac.s);
    e.style.setProperty("--secondary-foreground", ac.sf);
    e.style.setProperty("--muted", ac.m);
    e.style.setProperty("--muted-foreground", ac.mf);
    e.style.setProperty("--border", ac.b);
    e.style.setProperty("--input", ac.b);
    e.style.setProperty("--rose-cloud", ac.cl);
    e.style.setProperty("--gradient-soft", ac.gs);
    e.style.setProperty("--gradient-card", ac.gc);
    e.style.setProperty("--font-display", font);
    const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme:dark)").matches);
    e.classList.toggle("dark", isDark);
    if (d && d.highContrast) e.classList.add("high-contrast");
  } catch { /* silent */ }
}

// Run immediately when this JS module is evaluated (CSR path — before first React render)
applyThemeVars();

// Serialised version injected into <head> for the SSR path (runs before CSS loads)
const THEME_INIT_SCRIPT = `(function(){try{
var A=${JSON.stringify(THEME_ACCENTS)};
var F=${JSON.stringify(THEME_FONTS)};
var G=${JSON.stringify(THEME_GRAY)};
var d=JSON.parse(localStorage.getItem("sa.personalizacao")||"null");
var ac=(d&&A[d.accent])||G;var font=(d&&F[d.font])||F.playfair;var theme=(d&&d.theme)||"light";
var e=document.documentElement;
e.style.setProperty("--primary",ac.p);e.style.setProperty("--primary-glow",ac.g);
e.style.setProperty("--accent",ac.a);e.style.setProperty("--ring",ac.r);
e.style.setProperty("--primary-foreground","#ffffff");
e.style.setProperty("--gradient-primary","linear-gradient(135deg,"+ac.p+" 0%,"+ac.a+" 100%)");
e.style.setProperty("--shadow-glow","0 10px 30px -10px "+ac.p+"73");
e.style.setProperty("--secondary",ac.s);e.style.setProperty("--secondary-foreground",ac.sf);
e.style.setProperty("--muted",ac.m);e.style.setProperty("--muted-foreground",ac.mf);
e.style.setProperty("--border",ac.b);e.style.setProperty("--input",ac.b);
e.style.setProperty("--rose-cloud",ac.cl);
e.style.setProperty("--gradient-soft",ac.gs);e.style.setProperty("--gradient-card",ac.gc);
e.style.setProperty("--font-display",font);
var dark=theme==="dark"||(theme==="auto"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
e.classList.toggle("dark",dark);if(d&&d.highContrast)e.classList.add("high-contrast");
}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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

  // 2. Quando autenticado, busca ui_settings do Supabase e sobrescreve localStorage
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("ui_settings")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.ui_settings) return;
        import("../lib/personalization").then((m) => {
          const local = m.loadPersonalization();
          const ui = data.ui_settings as { accent?: string; font?: string; theme?: string; highContrast?: boolean };
          const merged = {
            ...local,
            accent:      (ui.accent      as AccentId) ?? local.accent,
            font:        (ui.font        as FontId)   ?? local.font,
            theme:       (ui.theme       as ThemeId)  ?? local.theme,
            highContrast: ui.highContrast               ?? local.highContrast,
          };
          m.savePersonalization(merged);
          m.applyPersonalization(merged);
        });
      });
  }, [user?.id]);

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
    if (!("serviceWorker" in navigator)) return;
    const hostname = window.location.hostname;
    const isAppDomain = hostname.startsWith("app.") || hostname === "localhost";
    if (isAppDomain) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
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
      <AuthContext.Provider value={authValue}>
        <SystemModeProvider>
          <SystemModeGate isSuperRoute={isSuperRoute} />
          <AuthGuard subscription={subscription}>
            <Outlet />
          </AuthGuard>
        </SystemModeProvider>
        <Toaster position="top-center" richColors />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
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
