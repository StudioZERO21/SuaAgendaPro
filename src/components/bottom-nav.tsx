import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, Users, Scissors, Menu, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { key: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "clientes", to: "/clientes", label: "Clientes", icon: Users },
  { key: "agenda", to: "/app", label: "Agenda", icon: Calendar },
  { key: "servicos", to: "/servicos", label: "Serviços", icon: Scissors },
  { key: "mais", to: "/mais", label: "Mais", icon: Menu },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 py-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.to === pathname;
          const isCenter = it.key === "agenda";

          return (
            <Link
              key={it.key}
              to={it.to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  isCenter ? "h-12 w-12 -mt-5" : "h-9 w-9",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className={cn(
                      "absolute inset-0 gradient-primary shadow-glow",
                      isCenter ? "rounded-2xl ring-4 ring-background" : "rounded-xl",
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 transition-colors",
                    isCenter ? "h-6 w-6" : "h-[18px] w-[18px]",
                    active ? "text-white" : "",
                  )}
                />
              </div>
              <span className={cn(isCenter && "mt-0")}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
