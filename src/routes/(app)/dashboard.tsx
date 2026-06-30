import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import {
  TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock,
  Star, ArrowUpRight, Trophy, Medal, Award, Loader2,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { useDashboard, pctDelta } from "@/hooks/useDashboard";
import { formatPrice } from "@/hooks/useServicos";
import { cn } from "@/lib/utils";
import { PeakHeatmapSection } from "@/components/dashboard/peak-heatmap";
import { ThemeTimeBadge } from "@/components/dashboard/theme-time-badge";

const RevenueChart = lazy(() =>
  import("@/components/dashboard/revenue-chart").then((m) => ({
    default: m.RevenueChart,
  })),
);

export const Route = createFileRoute("/(app)/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SuaAgenda.Pro" },
      { name: "description", content: "Visão geral do seu negócio." },
    ],
  }),
  component: DashboardPage,
});

// ── Constants ─────────────────────────────────────────────────

const rankIcons  = [Trophy, Medal, Award];
const rankColors = [
  "text-amber-500 bg-amber-100",
  "text-slate-500 bg-slate-200",
  "text-orange-500 bg-orange-100",
];

const periods = ["7", "14", "30"] as const;
type Period = (typeof periods)[number];
const periodLabel: Record<Period, string> = { "7": "7 dias", "14": "14 dias", "30": "30 dias" };

// ── Page ─────────────────────────────────────────────────────

function DashboardPage() {
  const { data: d, isLoading } = useDashboard();
  const [periodId, setPeriodId] = useState<Period>("7");

  const chartData = periodId === "7" ? d.chart7 : periodId === "14" ? d.chart14 : d.chart30;

  const revenueD   = pctDelta(d.revenueCents,   d.lastRevenueCents);
  const apptD      = pctDelta(d.apptCount,       d.lastApptCount);
  const nowMonth   = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const kpis = [
    {
      key: "faturamento", label: "Faturamento",
      subtitle: "serviços concluídos",
      value: formatPrice(d.revenueCents),
      delta: revenueD.delta, up: revenueD.up,
      icon: DollarSign,
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    },
    {
      key: "agendamentos", label: "Agendamentos",
      value: String(d.apptCount),
      delta: apptD.delta, up: apptD.up,
      icon: Calendar,
      bg: "bg-gradient-to-br from-violet-500 to-violet-700",
    },
    {
      key: "clientes", label: "Novas clientes",
      value: String(d.newClients),
      delta: "este mês", up: true,
      icon: Users,
      bg: "gradient-primary text-white",
      premium: true,
    },
    {
      key: "ocupacao", label: "Ocupação",
      value: `${d.occupancyPct}%`,
      delta: "este mês", up: d.occupancyPct >= 50,
      icon: Clock,
      bg: "bg-gradient-to-br from-amber-500 to-amber-700",
    },
  ];

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Visão geral</p>
        <h1 className="font-display text-3xl font-bold leading-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{nowMonth}</p>
      </header>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── KPI grid ── */}
          <section className="mt-5 px-5">
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((k, i) => {
                const Icon  = k.icon;
                const Trend = k.up ? TrendingUp : TrendingDown;
                return (
                  <div
                    key={k.key}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className={cn(
                      "relative overflow-visible rounded-lg p-4 pb-3 text-white shadow-card animate-sa-fade-in-up hover-lift",
                      k.bg,
                      k.premium && "ring-2 ring-primary/30 shadow-glow",
                    )}
                  >
                    {k.premium && (
                      <span
                        style={{ animationDelay: `${350 + i * 80}ms` }}
                        className="pointer-events-none absolute -top-2 left-3 inline-flex animate-sa-scale-in items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary shadow-md"
                      >
                        <Star className="h-2.5 w-2.5 fill-primary text-primary" /> Premium
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Trend className="h-3 w-3" /> {k.delta}
                      </span>
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold leading-none tracking-tight">
                      {k.value}
                    </p>
                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-white/20">{k.label}</p>
                    {"subtitle" in k && k.subtitle && (
                      <p className="text-[9px] text-white/30 mt-0.5">{k.subtitle as string}</p>
                    )}
                    <div className="pointer-events-none absolute -bottom-3 -right-3">
                      <Icon
                        className={cn("h-16 w-16", k.premium ? "text-white/30 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "text-white/15")}
                        strokeWidth={1.2}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Ticket médio ── */}
          {d.ticketMedioCents > 0 && (
            <section className="mt-3 px-5">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Ticket médio</span>
                </div>
                <span className="font-display text-base font-bold text-primary">{formatPrice(d.ticketMedioCents)}</span>
              </div>
            </section>
          )}

          {/* ── Upcoming today ── */}
          <section className="mt-8 px-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Próximos hoje</h2>
              <Link to="/app" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                Agenda <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {d.upcoming.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-4 py-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">Nenhum agendamento pendente para hoje.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {d.upcoming.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
                    <ThemeTimeBadge time={u.time} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{u.client}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{u.service}</p>
                    </div>
                    <Star className="h-4 w-4 text-amber-400" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Chart de receita ── */}
          <section className="mt-6 px-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Receita no período</p>
                  <p className="font-display text-lg font-bold">{formatPrice(d.revenueCents)}</p>
                </div>
                <div className="inline-flex rounded-full bg-muted p-1">
                  {periods.map((p) => {
                    const active = p === periodId;
                    return (
                      <button key={p} type="button" onClick={() => setPeriodId(p)}
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                          active ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {periodLabel[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 h-40">
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  }
                >
                  <RevenueChart data={chartData} />
                </Suspense>
              </div>
            </div>
          </section>

          <PeakHeatmapSection peakTop={d.peakTop} peakMatrix={d.peakMatrix} />

          {/* ── Top serviços ── */}
          <section className="mt-6 px-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top serviços</h2>
              <Link to="/servicos" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                Ver todos <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {d.topServices.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-4 py-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">Nenhum atendimento registrado este mês.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {d.topServices.map((s, i) => {
                  const RankIcon  = rankIcons[i]  ?? Award;
                  const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
                  return (
                    <div key={s.name} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
                      <span className="w-5 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", rankColor)}>
                        <RankIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.count} atendimento{s.count !== 1 ? "s" : ""}</p>
                      </div>
                      {s.revenueCents > 0 && (
                        <span className="text-sm font-bold text-emerald-700">{formatPrice(s.revenueCents)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Top clientes ── */}
          <section className="mt-6 px-5 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top clientes</h2>
              <Link to="/clientes" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                Ver todas <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {d.topClients.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-4 py-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {d.topClients.map((c, i) => {
                  const RankIcon  = rankIcons[i]  ?? Award;
                  const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
                      <span className="w-5 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-soft text-[11px] font-bold text-primary">
                        {c.initials}
                        <span className={cn("absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full", rankColor)}>
                          <RankIcon className="h-2.5 w-2.5" />
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.totalAppointments} visita{c.totalAppointments !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">{formatPrice(c.totalSpentCents)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <BottomNav />
    </MobileShell>
  );
}
