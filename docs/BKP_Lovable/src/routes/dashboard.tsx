import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Star,
  ArrowUpRight,
  Trophy,
  Medal,
  Award,
  Flame,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SuaAgenda.Pro" },
      { name: "description", content: "Visão geral do seu negócio." },
    ],
  }),
  component: DashboardPage,
});

const kpis = [
  {
    key: "faturamento",
    label: "Faturamento",
    value: "R$ 4.820",
    delta: "+12%",
    up: true,
    icon: DollarSign,
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
  },
  {
    key: "agendamentos",
    label: "Agendamentos",
    value: "128",
    delta: "+8%",
    up: true,
    icon: Calendar,
    bg: "bg-gradient-to-br from-violet-500 to-violet-700",
  },
  {
    key: "clientes",
    label: "Novas clientes",
    value: "14",
    delta: "+3",
    up: true,
    icon: Users,
    bg: "bg-gradient-to-br from-pink-500 to-pink-700",
  },
  {
    key: "ocupacao",
    label: "Ocupação",
    value: "78%",
    delta: "-4%",
    up: false,
    icon: Clock,
    bg: "bg-gradient-to-br from-amber-500 to-amber-700",
  },
];

const weekData = [
  { day: "Seg", value: 42 },
  { day: "Ter", value: 68 },
  { day: "Qua", value: 55 },
  { day: "Qui", value: 88 },
  { day: "Sex", value: 96 },
  { day: "Sáb", value: 72 },
  { day: "Dom", value: 24 },
];

const data14 = [
  { day: "S1", value: 38 }, { day: "S2", value: 52 }, { day: "S3", value: 47 },
  { day: "S4", value: 71 }, { day: "S5", value: 64 }, { day: "S6", value: 58 },
  { day: "S7", value: 30 }, { day: "S8", value: 42 }, { day: "S9", value: 68 },
  { day: "S10", value: 55 }, { day: "S11", value: 88 }, { day: "S12", value: 96 },
  { day: "S13", value: 72 }, { day: "S14", value: 24 },
];

const data30 = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  value: Math.round(30 + Math.sin(i / 2.2) * 22 + Math.cos(i / 1.4) * 14 + (i % 5) * 6 + 20),
}));

const periods = [
  { id: "7", label: "7 dias", data: weekData },
  { id: "14", label: "14 dias", data: data14 },
  { id: "30", label: "30 dias", data: data30 },
] as const;

const peakDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const peakSlots = ["09h", "11h", "13h", "15h", "17h", "19h"];
// rows = slots, cols = days; 0-10 intensity
const peakMatrix: number[][] = [
  [3, 4, 3, 5, 6, 8], // 09h
  [5, 6, 5, 7, 8, 9], // 11h
  [2, 3, 2, 4, 5, 6], // 13h
  [6, 7, 6, 8, 9, 7], // 15h
  [7, 8, 8, 9, 10, 9], // 17h
  [5, 6, 7, 8, 9, 6], // 19h
];
const peakTop = [
  { day: "Sex", slot: "17h", count: 14 },
  { day: "Sáb", slot: "11h", count: 12 },
  { day: "Qui", slot: "17h", count: 11 },
];




const topServices = [
  { name: "Cílios volume russo", count: 38, revenue: "R$ 1.520" },
  { name: "Design de sobrancelhas", count: 27, revenue: "R$ 540" },
  { name: "Manutenção de cílios", count: 22, revenue: "R$ 660" },
  { name: "Henna sobrancelhas", count: 14, revenue: "R$ 280" },
];

const topClients = [
  { name: "Ana Paula Ribeiro", visits: 12, spent: "R$ 1.840" },
  { name: "Bruna Lima", visits: 9, spent: "R$ 1.260" },
  { name: "Carla Souza", visits: 7, spent: "R$ 980" },
  { name: "Daniela Martins", visits: 6, spent: "R$ 820" },
];

const upcoming = [
  { time: "09:00", client: "Ana Paula", service: "Cílios volume russo" },
  { time: "10:30", client: "Bruna Lima", service: "Design + henna" },
  { time: "13:00", client: "Carla Souza", service: "Manutenção" },
];

const rankIcons = [Trophy, Medal, Award];
const rankColors = [
  "text-amber-500 bg-amber-100",
  "text-slate-500 bg-slate-200",
  "text-orange-500 bg-orange-100",
];

function DashboardPage() {
  const [periodId, setPeriodId] = useState<"7" | "14" | "30">("7");
  const chartData = useMemo(
    () => periods.find((p) => p.id === periodId)!.data,
    [periodId],
  );
  const maxVal = Math.max(...chartData.map((d) => d.value));
  const total = chartData.reduce((s, d) => s + d.value, 0);
  const peak = chartData.find((d) => d.value === maxVal)!;

  // Build line path in 0..100 coord space (we'll use preserveAspectRatio="none")
  const linePath = chartData
    .map((d, i) => {
      const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 100;
      const y = 100 - (d.value / maxVal) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");


  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Visão geral
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Como o seu negócio está indo essa semana.</p>
      </header>

      {/* KPI grid */}
      <section className="mt-5 px-5">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            const Trend = k.up ? TrendingUp : TrendingDown;
            const isPremium = k.key === "clientes";
            return (
              <motion.div
                key={k.key}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i * 0.08,
                  type: "spring",
                  stiffness: 220,
                  damping: 22,
                }}
                whileHover={{ y: -2 }}
                className={`relative overflow-visible rounded-lg p-4 pb-3 text-white shadow-card ${k.bg} ${
                  isPremium ? "ring-2 ring-pink-300/60 shadow-[0_8px_28px_-6px_rgba(236,72,153,0.55)]" : ""
                }`}
              >
                {isPremium && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 260 }}
                    className="pointer-events-none absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-pink-600 shadow-md"
                  >
                    <Star className="h-2.5 w-2.5 fill-pink-500 text-pink-500" />
                    Premium
                  </motion.span>
                )}
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    <Trend className="h-3 w-3" />
                    {k.delta}
                  </span>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                  className="mt-4 font-display text-3xl font-bold leading-none tracking-tight"
                >
                  {k.value}
                </motion.p>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-white/20">
                  {k.label}
                </p>
                {/* Icon: rises in from below, looks cut by card edge */}
                <motion.div
                  initial={{ y: 24, opacity: 0, rotate: -8 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.08,
                    type: "spring",
                    stiffness: 180,
                    damping: 14,
                  }}
                  className="pointer-events-none absolute -bottom-3 -right-3"
                >
                  <Icon
                    className={`h-16 w-16 ${isPremium ? "text-white/30 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "text-white/15"}`}
                    strokeWidth={1.2}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Upcoming */}
      <section className="mt-8 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Próximos hoje
          </h2>
          <Link to="/app" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
            Agenda <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {upcoming.map((u) => (
            <div
              key={u.time + u.client}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg gradient-primary text-white shadow-glow">
                <span className="font-display text-sm font-bold leading-none">{u.time}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.client}</p>
                <p className="truncate text-[11px] text-muted-foreground">{u.service}</p>
              </div>
              <Star className="h-4 w-4 text-amber-400" />
            </div>
          ))}
        </div>
      </section>

      {/* Week chart with background color */}
      <section className="mt-6 px-5">
        <div className="rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Período
              </p>
              <p className="mt-1 font-display text-lg font-bold">Atendimentos</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold backdrop-blur-sm">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>

          {/* Period selector */}
          <div className="mt-4 inline-flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
            {periods.map((p) => {
              const active = p.id === periodId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodId(p.id)}
                  className={`relative rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    active ? "text-violet-700" : "text-white/80 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="periodPill"
                      className="absolute inset-0 rounded-full bg-white shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bars + Line overlay */}
          <div key={periodId} className="relative mt-5 h-44 w-full">
            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between gap-[3px]">
              {chartData.map((d, i) => {
                const h = (d.value / maxVal) * 100;
                const isPeak = d.value === maxVal;
                return (
                  <motion.div
                    key={`${periodId}-bar-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${h}%`, opacity: 1 }}
                    transition={{
                      delay: i * (chartData.length > 14 ? 0.02 : 0.05),
                      type: "spring",
                      stiffness: 110,
                      damping: 18,
                    }}
                    className={`flex-1 rounded-t-sm ${
                      isPeak
                        ? "bg-gradient-to-t from-pink-300/80 to-white"
                        : "bg-gradient-to-t from-white/15 to-white/55"
                    }`}
                  />
                );
              })}
            </div>

            {/* Animated line overlay */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              <motion.path
                key={`${periodId}-area`}
                d={`${linePath} L100,100 L0,100 Z`}
                fill="url(#lineFill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
              <motion.path
                key={`${periodId}-line`}
                d={linePath}
                fill="none"
                stroke="#fde68a"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 4px rgba(253,224,71,0.6))" }}
              />
            </svg>
          </div>

          {/* Quick stats under chart */}
          <motion.div
            key={`${periodId}-stats`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4"
          >
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">Total</p>
              <p className="mt-0.5 font-display text-lg font-bold leading-none">{total}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">Pico</p>
              <p className="mt-0.5 font-display text-lg font-bold leading-none">{peak.day}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">Média</p>
              <p className="mt-0.5 font-display text-lg font-bold leading-none">
                {Math.round(total / chartData.length)}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pico de atendimento — heatmap dia x horário */}
      <section className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pico de atendimento
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
            <Flame className="h-3 w-3" /> Alta demanda
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          {/* Top 3 horários */}
          <div className="grid grid-cols-3 gap-2">
            {peakTop.map((p, i) => (
              <motion.div
                key={`${p.day}-${p.slot}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                className={`rounded-md p-3 ${
                  i === 0
                    ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className={`text-[9px] font-semibold uppercase tracking-wider ${i === 0 ? "text-white/70" : "text-muted-foreground"}`}>
                  {p.day}
                </p>
                <p className="mt-1 font-display text-lg font-bold leading-none">{p.slot}</p>
                <p className={`mt-2 text-[10px] font-semibold ${i === 0 ? "text-white/80" : "text-muted-foreground"}`}>
                  {p.count} atend.
                </p>
              </motion.div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8" />
              <div className="grid flex-1 grid-cols-6 gap-1">
                {peakDays.map((d) => (
                  <span key={d} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1.5 space-y-1">
              {peakMatrix.map((row, ri) => (
                <div key={peakSlots[ri]} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-semibold text-muted-foreground">
                    {peakSlots[ri]}
                  </span>
                  <div className="grid flex-1 grid-cols-6 gap-1">
                    {row.map((v, ci) => {
                      const op = 0.12 + (v / 10) * 0.88;
                      const isMax = v >= 9;
                      return (
                        <motion.div
                          key={`${ri}-${ci}`}
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (ri * 6 + ci) * 0.012, type: "spring", stiffness: 260, damping: 22 }}
                          className={`relative aspect-square rounded-sm ${isMax ? "ring-2 ring-pink-400" : ""}`}
                          style={{ backgroundColor: `rgba(236, 72, 153, ${op})` }}
                          title={`${peakDays[ci]} ${peakSlots[ri]} — ${v} atend.`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-center justify-end gap-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Menos
              </span>
              {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
                <span
                  key={o}
                  className="h-2.5 w-3 rounded-sm"
                  style={{ backgroundColor: `rgba(236, 72, 153, ${o})` }}
                />
              ))}
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mais
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* Top services ranking */}
      <section className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top serviços
          </h2>
          <Link to="/servicos" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
            Ver todos <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {topServices.map((s, i) => {
            const RankIcon = rankIcons[i] ?? Award;
            const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
            return (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
              >
                <span className="font-display text-lg font-bold tabular-nums text-muted-foreground w-5 text-center">
                  {i + 1}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${rankColor}`}
                >
                  <RankIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.count} atendimentos</p>
                </div>
                <span className="text-sm font-bold text-emerald-700">{s.revenue}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top clients ranking */}
      <section className="mt-6 px-5 pb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Top clientes
          </h2>
          <Link to="/clientes" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {topClients.map((c, i) => {
            const RankIcon = rankIcons[i] ?? Award;
            const rankColor = rankColors[i] ?? "text-muted-foreground bg-muted";
            const initials = c.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("");
            return (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
              >
                <span className="font-display text-lg font-bold tabular-nums text-muted-foreground w-5 text-center">
                  {i + 1}
                </span>
                <span
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-soft text-[11px] font-bold text-primary`}
                >
                  {initials}
                  <span
                    className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${rankColor}`}
                  >
                    <RankIcon className="h-2.5 w-2.5" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.visits} visitas</p>
                </div>
                <span className="text-sm font-bold text-emerald-700">{c.spent}</span>
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
