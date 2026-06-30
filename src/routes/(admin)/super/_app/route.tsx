import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperSidebar } from "@/components/super/super-sidebar";
import { clearSuperAuth, isSuperTokenValid } from "@/lib/super-auth";

export const Route = createFileRoute("/(admin)/super/_app")({
  beforeLoad: async () => {
    const { verifySuperSessionFn } = await import("@/lib/super-session.functions");
    const { ok } = await verifySuperSessionFn();
    if (!ok) {
      throw redirect({ to: "/super/login" });
    }
  },
  loader: async () => ({}),
  component: SuperLayout,
});

function SuperLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Guarda inicial
    if (!isSuperTokenValid()) {
      clearSuperAuth();
      navigate({ to: "/super/login", replace: true });
      return;
    }
    setReady(true);

    // Polling a cada 30s: redireciona silenciosamente ao expirar
    const interval = setInterval(() => {
      if (!isSuperTokenValid()) {
        clearSuperAuth();
        navigate({ to: "/super/login", replace: true });
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (!ready) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-dvh w-full bg-muted/30">
        <SuperSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
              <SidebarTrigger />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Super
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
