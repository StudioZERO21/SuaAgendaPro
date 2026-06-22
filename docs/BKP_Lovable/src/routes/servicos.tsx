import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Scissors, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { useServices, serviceCategories, categoryMeta } from "@/lib/services-store";
import type { ServiceCategory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — SuaAgenda.Pro" },
      { name: "description", content: "Catálogo de serviços do seu studio." },
    ],
  }),
  component: ServicosPage,
});

type Filter = "all" | ServiceCategory;

function ServicosPage() {
  const navigate = useNavigate();
  const services = useServices();
  const [active, setActive] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      services.filter((s) => {
        if (active !== "all" && s.category !== active) return false;
        if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [services, active, query],
  );

  const total = services.reduce((sum, s) => sum + s.price, 0);
  const avg = services.length ? total / services.length : 0;

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
            className="h-11 rounded-2xl gradient-primary px-4 text-sm font-semibold shadow-glow"
          >
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
        </div>

        {/* Hero stats card */}
        <div className="relative mt-5 overflow-hidden rounded-3xl gradient-primary p-5 text-white shadow-glow">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              Ticket médio
            </p>
            <p className="mt-1 font-display text-3xl font-bold">
              R$ {avg.toFixed(0)},00
            </p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <div>
                <p className="text-white/75">Serviços ativos</p>
                <p className="font-display text-lg font-bold">{services.length}</p>
              </div>
              <div className="text-right">
                <p className="text-white/75">Receita potencial</p>
                <p className="font-display text-lg font-bold">R$ {total.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* search */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar serviço..."
            className="h-12 rounded-2xl border-border bg-card pl-11 text-sm shadow-card focus-visible:ring-primary"
          />
        </div>

        {/* categories */}
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={active === "all"} onClick={() => setActive("all")}>
            <span>✨</span> Todos
          </FilterChip>
          {serviceCategories.map((c) => (
            <FilterChip
              key={c.id}
              active={active === c.id}
              onClick={() => setActive(c.id)}
            >
              <span>{c.emoji}</span> {c.label}
            </FilterChip>
          ))}
        </div>
      </header>

      <main className="mt-5 flex-1 space-y-3 px-5 pb-6">
        {filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-soft text-primary">
              <Scissors className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold">Nenhum serviço</p>
            <p className="text-sm text-muted-foreground">
              {services.length === 0 ? "Crie o primeiro do catálogo." : "Tente outro filtro."}
            </p>
            <Button
              onClick={() => navigate({ to: "/servico/novo" })}
              className="mt-2 h-11 rounded-2xl gradient-primary px-5 text-sm font-semibold shadow-glow"
            >
              <Plus className="mr-1 h-4 w-4" /> Criar serviço
            </Button>
          </div>
        )}

        {filtered.map((s, i) => {
          const cat = categoryMeta(s.category);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to="/servico/$id"
                params={{ id: s.id }}
                className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-soft text-2xl">
                    {cat.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold leading-tight">{s.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.duration} min
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {cat.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-gradient">
                      R$ {s.price.toFixed(0)}
                    </p>
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition group-hover:bg-secondary group-hover:text-primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </main>

      <BottomNav />
    </MobileShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
        active
          ? "gradient-primary border-transparent text-white shadow-glow"
          : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
