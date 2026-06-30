import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Scissors, Search, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useServices, useToggleService, formatPrice, formatDuration } from "@/hooks/useServicos";

export const Route = createFileRoute("/(app)/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — SuaAgenda.Pro" },
      { name: "description", content: "Catálogo de serviços do seu studio." },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const navigate = useNavigate();
  const { data: services = [], isLoading } = useServices();
  const toggleService = useToggleService();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (filter === "active" && !s.is_active) return false;
      if (filter === "inactive" && s.is_active) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [services, filter, query]);

  const activeServices = services.filter((s) => s.is_active);
  const avgPrice = activeServices.length
    ? activeServices.reduce((sum, s) => sum + s.price_cents, 0) / activeServices.length
    : 0;

  async function handleToggle(id: string, current: boolean) {
    try {
      await toggleService.mutateAsync({ id, is_active: !current });
      toast.success(current ? "Serviço desativado" : "Serviço ativado");
    } catch {
      toast.error("Erro ao alterar serviço.");
    }
  }

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Catálogo
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight">Serviços</h1>
          </div>
          <Button
            onClick={() => navigate({ to: "/servico/novo" })}
            className="h-11 rounded-2xl gradient-primary px-4 text-sm font-semibold text-white shadow-glow"
          >
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
        </div>

        {/* Hero stats */}
        <div className="relative mt-5 overflow-hidden rounded-3xl gradient-primary p-5 text-white shadow-glow">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              Ticket médio
            </p>
            <p className="mt-1 font-display text-3xl font-bold">
              {isLoading ? "—" : formatPrice(Math.round(avgPrice))}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <div>
                <p className="text-white/75">Serviços ativos</p>
                <p className="font-display text-lg font-bold">{activeServices.length}</p>
              </div>
              <div className="text-right">
                <p className="text-white/75">Total no catálogo</p>
                <p className="font-display text-lg font-bold">{services.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar serviço..."
            className="h-12 rounded-2xl border-border bg-card pl-11 text-sm shadow-card focus-visible:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2">
          {([
            { id: "all",      label: "Todos" },
            { id: "active",   label: "Ativos" },
            { id: "inactive", label: "Inativos" },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                filter === f.id
                  ? "gradient-primary border-transparent text-white shadow-glow"
                  : "border-border bg-card text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mt-5 flex-1 space-y-3 px-5 pb-6">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && services.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-soft text-primary">
              <Scissors className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold">Nenhum serviço ainda</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro do seu catálogo e comece a receber agendamentos.
            </p>
            <Button
              onClick={() => navigate({ to: "/servico/novo" })}
              className="mt-2 h-11 rounded-2xl gradient-primary px-5 text-sm font-semibold text-white shadow-glow"
            >
              <Plus className="mr-1 h-4 w-4" /> Criar serviço
            </Button>
          </div>
        )}

        {/* Filter empty state */}
        {!isLoading && services.length > 0 && filtered.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
          </div>
        )}

        {/* Services list */}
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn("transition-opacity", !s.is_active && "opacity-60")}
          >
            <div
              className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card"
              onClick={() => navigate({ to: "/servico/$id", params: { id: s.id } })}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-soft text-2xl">
                  <Scissors className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold leading-tight">{s.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(s.duration_minutes)}
                    </span>
                    {s.deposit_type !== "none" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Sinal: {s.deposit_type === "percent"
                          ? `${s.deposit_value}%`
                          : formatPrice(s.deposit_value)}
                      </span>
                    )}
                    {!s.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-display text-lg font-bold text-gradient">
                    {formatPrice(s.price_cents)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggle(s.id, s.is_active); }}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-secondary"
                    aria-label={s.is_active ? "Desativar" : "Ativar"}
                  >
                    {toggleService.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : s.is_active ? (
                      <ToggleRight className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              {s.description && (
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{s.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </main>

      <BottomNav />
    </MobileShell>
  );
}
