import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState, memo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock,
  Star, ArrowUpRight, Trophy, Medal, Award, Loader2,
  XCircle, RotateCcw, FileDown, FileSpreadsheet,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { useDashboard, pctDelta, buildPeriod, type DashboardPeriod } from "@/hooks/useDashboard";
import { formatPrice } from "@/hooks/useServicos";
import { cn } from "@/lib/utils";
import { ThemeTimeBadge } from "@/components/dashboard/theme-time-badge";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import {
  DASH_EASE,
  dashTransition,
  listContainerVariants,
  listItemVariants,
  useDashboardMotion,
} from "@/lib/dashboard-motion";

const RevenueChart = lazy(() =>
  import("@/components/dashboard/revenue-chart").then((m) => ({
    default: m.RevenueChart,
  })),
);

const PeakHeatmapSection = lazy(() =>
  import("@/components/dashboard/peak-heatmap").then((m) => ({
    default: m.PeakHeatmapSection,
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

const rankIcons  = [Trophy, Medal, Award];
const rankColors = [
  "text-amber-500 bg-amber-100",
  "text-slate-500 bg-slate-200",
  "text-orange-500 bg-orange-100",
];

const chartPeriods = ["7", "14", "30"] as const;
type ChartPeriod = (typeof chartPeriods)[number];
const chartPeriodLabel: Record<ChartPeriod, string> = { "7": "7 dias", "14": "14 dias", "30": "30 dias" };

type KpiItem = {
  key: string;
  label: string;
  subtitle?: string;
  value: string;
  delta: string;
  up: boolean;
  icon: typeof DollarSign;
  bg: string;
  premium?: boolean;
};

const KpiGrid = memo(function KpiGrid({ kpis }: { kpis: KpiItem[] }) {
  const { reduced } = useDashboardMotion();

  return (
    <motion.div
      className="grid grid-cols-2 gap-3"
      variants={listContainerVariants(reduced)}
      initial="hidden"
      animate="show"
    >
      {kpis.map((k) => {
        const Icon  = k.icon;
        const Trend = k.up ? TrendingUp : TrendingDown;
        return (
          <motion.div
            key={k.key}
            variants={listItemVariants(reduced)}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            transition={dashTransition(reduced)}
            className={cn(
              "relative overflow-visible rounded-lg p-4 pb-3 text-white shadow-card",
              k.bg,
              k.premium && "ring-2 ring-primary/30 shadow-glow",
            )}
          >
            {k.premium && (
              <span className="pointer-events-none absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary shadow-md">
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
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-white/20">
              {k.label}
            </p>
            {k.subtitle && (
              <p className="mt-0.5 text-[9px] text-white/30">{k.subtitle}</p>
            )}
            <div className="pointer-events-none absolute -bottom-3 -right-3">
              <Icon
                className={cn(
                  "h-16 w-16",
                  k.premium ? "text-white/30 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "text-white/15",
                )}
                strokeWidth={1.2}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>(() => buildPeriod("mes"));
  const { data: d, isLoading } = useDashboard(period);
  const [chartPeriodId, setChartPeriodId] = useState<ChartPeriod>("7");
  const [exportingPdf, setExportingPdf] = useState(false);
  const { reduced } = useDashboardMotion();

  const chartData = chartPeriodId === "7" ? d.chart7 : chartPeriodId === "14" ? d.chart14 : d.chart30;

  const revenueD   = pctDelta(d.revenueCents, d.lastRevenueCents);
  const apptD      = pctDelta(d.apptCount, d.lastApptCount);
  const cancelD    = pctDelta(d.cancelados, d.lastCancelados);

  const kpis = useMemo<KpiItem[]>(() => [
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
      bg: "bg-gradient-to-br from-sky-500 to-sky-700",
    },
    {
      key: "clientes", label: "Novas clientes",
      value: String(d.newClients),
      delta: period.label, up: true,
      icon: Users,
      bg: "gradient-primary text-white",
      premium: true,
    },
    {
      key: "ocupacao", label: "Ocupação",
      value: `${d.occupancyPct}%`,
      delta: period.label, up: d.occupancyPct >= 50,
      icon: Clock,
      bg: "bg-gradient-to-br from-amber-500 to-amber-700",
    },
    {
      key: "cancelamentos", label: "Cancelamentos",
      value: String(d.cancelados),
      delta: cancelD.delta, up: !cancelD.up,
      icon: XCircle,
      bg: d.cancelados > 0
        ? "bg-gradient-to-br from-rose-500 to-rose-700"
        : "bg-gradient-to-br from-slate-500 to-slate-700",
    },
    {
      key: "retencao", label: "Taxa de retenção",
      subtitle: "clientes que voltaram",
      value: `${d.taxaRetencaoPct}%`,
      delta: `${d.clientesRecorrentes} recorrentes`, up: d.taxaRetencaoPct >= 50,
      icon: RotateCcw,
      bg: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    },
  ], [d, revenueD, apptD, cancelD, period.label]);

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const [{ pdf }, { DashboardPDFDocument }, { createElement }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/dashboard/pdf-report"),
        import("react"),
      ]);
      const props = {
        period:       period.label,
        revenue:      formatPrice(d.revenueCents),
        revenueDelta: revenueD.delta,
        revenueUp:    revenueD.up,
        appts:        d.apptCount,
        apptsDelta:   apptD.delta,
        apptsUp:      apptD.up,
        cancelados:   d.cancelados,
        taxaRetencao: d.taxaRetencaoPct,
        ticketMedio:  formatPrice(d.ticketMedioCents),
        newClients:   d.newClients,
        topServices:  d.topServices.map((s) => ({
          name: s.name, count: s.count, revenue: formatPrice(s.revenueCents),
        })),
        topClients: d.topClients.map((c) => ({
          name: c.name, visits: c.totalAppointments, spent: formatPrice(c.totalSpentCents),
        })),
        chartData: d.chart30,
        generatedAt: new Date().toLocaleString("pt-BR"),
      };
      const blob = await pdf(createElement(DashboardPDFDocument, props)).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `relatorio-${period.from.toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportCsv() {
    const rows: (string | number)[][] = [
      ["Métrica", "Valor", "Período anterior", "Variação"],
      ["Faturamento (R$)", (d.revenueCents / 100).toFixed(2), (d.lastRevenueCents / 100).toFixed(2), revenueD.delta],
      ["Atendimentos", d.apptCount, d.lastApptCount, apptD.delta],
      ["Cancelamentos", d.cancelados, d.lastCancelados, cancelD.delta],
      ["Novas clientes", d.newClients, "", ""],
      ["Clientes recorrentes", d.clientesRecorrentes, "", ""],
      ["Taxa de retenção (%)", d.taxaRetencaoPct, "", ""],
      ["Ticket médio (R$)", (d.ticketMedioCents / 100).toFixed(2), "", ""],
      [],
      ["Serviço", "Atendimentos", "Receita (R$)"],
      ...d.topServices.map((s) => [s.name, s.count, (s.revenueCents / 100).toFixed(2)]),
      [],
      ["Cliente", "Visitas", "Total gasto (R$)"],
      ...d.topClients.map((c) => [c.name, c.totalAppointments, (c.totalSpentCents / 100).toFixed(2)]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `relatorio-${period.from.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visão geral
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted active:scale-95"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 rounded-full gradient-primary px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-opacity active:scale-95 disabled:opacity-60"
            >
              {exportingPdf
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FileDown className="h-3.5 w-3.5" />
              }
              PDF
            </button>
          </div>
        </div>

        <div className="mt-4">
          <PeriodFilter period={period} onChange={setPeriod} />
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={dashTransition(reduced)}
          >
            <DashboardSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={dashTransition(reduced)}
          >
            <section className="mt-5 px-5">
              <KpiGrid kpis={kpis} />
            </section>

            <AnimatePresence>
              {d.ticketMedioCents > 0 && (
                <motion.section
                  key="ticket"
                  className="mt-3 px-5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={dashTransition(reduced)}
                >
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Ticket médio</span>
                    </div>
                    <span className="font-display text-base font-bold text-primary">
                      {formatPrice(d.ticketMedioCents)}
                    </span>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <section className="mt-8 px-5 [content-visibility:auto]">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Próximos hoje
                </h2>
                <Link to="/app" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
                  Agenda <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {d.upcoming.length === 0 ? (
                  <motion.div
                    key="empty-upcoming"
                    {...fadeBlock(reduced)}
                    className="rounded-lg border border-border bg-card px-4 py-6 text-center shadow-card"
                  >
                    <p className="text-sm text-muted-foreground">
                      Nenhum agendamento pendente para hoje.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list-upcoming"
                    className="space-y-2"
                    variants={listContainerVariants(reduced)}
                    initial="hidden"
                    animate="show"
                  >
                    {d.upcoming.map((u) => (
                      <motion.div
                        key={u.id}
                        variants={listItemVariants(reduced)}
                        layout={!reduced}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                      >
                        <ThemeTimeBadge time={u.time} className="h-12 w-12" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{u.client}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{u.service}</p>
                        </div>
                        <Star className="h-4 w-4 text-amber-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="mt-6 px-5 [content-visibility:auto]">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Receita no período
                    </p>
                    <p className="font-display text-lg font-bold">{formatPrice(d.revenueCents)}</p>
                  </div>
                  <div className="inline-flex rounded-full bg-muted p-1">
                    {chartPeriods.map((p) => {
                      const active = p === chartPeriodId;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setChartPeriodId(p)}
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-150",
                            active ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {chartPeriodLabel[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={chartPeriodId}
                    className="mt-4 h-40"
                    initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduced ? 0 : -4 }}
                    transition={{ duration: reduced ? 0 : 0.18, ease: DASH_EASE }}
                  >
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      }
                    >
                      <RevenueChart data={chartData} />
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>

            <Suspense
              fallback={
                <div className="mt-6 px-5">
                  <div className="h-48 animate-pulse rounded-lg bg-muted/60" />
                </div>
              }
            >
              <PeakHeatmapSection peakTop={d.peakTop} peakMatrix={d.peakMatrix} />
            </Suspense>

            <RankSection
              title="Top serviços"
              linkTo="/servicos"
              linkLabel="Ver todos"
              empty="Nenhum atendimento registrado no período."
              isEmpty={d.topServices.length === 0}
              reduced={reduced}
            >
              {d.topServices.map((s, i) => {
                const RankIcon  = rankIcons[i]  ?? Award;
                const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
                return (
                  <motion.div
                    key={s.name}
                    variants={listItemVariants(reduced)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                  >
                    <span className="w-5 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", rankColor)}>
                      <RankIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.count} atendimento{s.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {s.revenueCents > 0 && (
                      <span className="text-sm font-bold text-emerald-700">
                        {formatPrice(s.revenueCents)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </RankSection>

            <RankSection
              title="Top clientes"
              linkTo="/clientes"
              linkLabel="Ver todas"
              empty="Nenhum cliente cadastrado ainda."
              isEmpty={d.topClients.length === 0}
              reduced={reduced}
              className="pb-6"
            >
              {d.topClients.map((c, i) => {
                const RankIcon  = rankIcons[i]  ?? Award;
                const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
                return (
                  <motion.div
                    key={c.id}
                    variants={listItemVariants(reduced)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                  >
                    <span className="w-5 text-center font-display text-lg font-bold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-soft text-[11px] font-bold text-primary">
                      {c.initials}
                      <span className={cn("absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full", rankColor)}>
                        <RankIcon className="h-2.5 w-2.5" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.totalAppointments} visita{c.totalAppointments !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatPrice(c.totalSpentCents)}
                    </span>
                  </motion.div>
                );
              })}
            </RankSection>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </MobileShell>
  );
}

function fadeBlock(reduced: boolean) {
  return {
    initial: { opacity: reduced ? 1 : 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: dashTransition(reduced),
  } as const;
}

const RankSection = memo(function RankSection({
  title,
  linkTo,
  linkLabel,
  empty,
  isEmpty,
  reduced,
  className,
  children,
}: {
  title: string;
  linkTo: "/servicos" | "/clientes";
  linkLabel: string;
  empty: string;
  isEmpty: boolean;
  reduced: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("mt-6 px-5 [content-visibility:auto]", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        <Link to={linkTo} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
          {linkLabel} <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      {isEmpty ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <motion.div
          className="space-y-2"
          variants={listContainerVariants(reduced)}
          initial="hidden"
          animate="show"
        >
          {children}
        </motion.div>
      )}
    </section>
  );
});
