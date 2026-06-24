import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Repeat,
  Percent,
  TrendingUp,
} from "lucide-react";
import { getSuperAdminMetrics, type SuperMetrics } from "@/lib/super-admin.functions";
import { withSuperToken } from "@/lib/super-client";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/super/_app/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PlanosPage,
});

type Metric = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: typeof Clock;
  spark: number[];
  tone: "neutral" | "success" | "warning" | "danger";
};

const METRICS: Metric[] = [
  {
    label: "Em período de teste",
    value: "182",
    delta: "+14,6%",
    trend: "up",
    icon: Clock,
    tone: "neutral",
    spark: [110, 118, 124, 132, 128, 140, 146, 152, 160, 168, 174, 182],
  },
  {
    label: "Profissionais ativos",
    value: "1.284",
    delta: "+8,2%",
    trend: "up",
    icon: CheckCircle2,
    tone: "success",
    spark: [980, 1010, 1040, 1075, 1110, 1140, 1170, 1198, 1220, 1248, 1266, 1284],
  },
  {
    label: "Inadimplentes",
    value: "67",
    delta: "+4,1%",
    trend: "up",
    icon: AlertTriangle,
    tone: "warning",
    spark: [42, 44, 48, 50, 54, 57, 58, 60, 61, 63, 65, 67],
  },
  {
    label: "Cancelaram (mês)",
    value: "39",
    delta: "−12,5%",
    trend: "down",
    icon: UserMinus,
    tone: "danger",
    spark: [62, 60, 58, 55, 54, 51, 49, 47, 45, 43, 41, 39],
  },
];

// Cadastros vs assinaturas pagas — comparativo mensal
const COMPARATIVO = [
  { m: "Jul", cadastros: 142, pagantes: 96 },
  { m: "Ago", cadastros: 168, pagantes: 118 },
  { m: "Set", cadastros: 184, pagantes: 132 },
  { m: "Out", cadastros: 210, pagantes: 158 },
  { m: "Nov", cadastros: 232, pagantes: 176 },
  { m: "Dez", cadastros: 248, pagantes: 188 },
  { m: "Jan", cadastros: 264, pagantes: 204 },
  { m: "Fev", cadastros: 278, pagantes: 220 },
  { m: "Mar", cadastros: 296, pagantes: 238 },
  { m: "Abr", cadastros: 312, pagantes: 254 },
  { m: "Mai", cadastros: 328, pagantes: 270 },
  { m: "Jun", cadastros: 346, pagantes: 290 },
];

const CONVERSAO = [
  { etapa: "Cadastros", v: 346 },
  { etapa: "Iniciou teste", v: 298 },
  { etapa: "Concluiu teste", v: 246 },
  { etapa: "Assinou", v: 204 },
  { etapa: "Renovou (M2)", v: 178 },
];

function toneClasses(tone: Metric["tone"]) {
  switch (tone) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-600";
    case "danger":
      return "text-rose-600";
    default:
      return "text-foreground";
  }
}

function PlanosPage() {
  const [metrics, setMetrics] = useState<SuperMetrics | null>(null);

  useEffect(() => {
    getSuperAdminMetrics({ data: withSuperToken() }).then(setMetrics).catch(console.error);
  }, []);

  const m = metrics;
  const LIVE: Metric[] = [
    { label: "Em trial",          value: m ? String(m.trialUsers)     : "—", delta: "", trend: "up"   as const, icon: Clock,        tone: "neutral", spark: [] },
    { label: "Ativos (Premium)",  value: m ? String(m.activeUsers)    : "—", delta: "", trend: "up"   as const, icon: CheckCircle2, tone: "success", spark: [] },
    { label: "Suspensos",         value: m ? String(m.suspendedUsers) : "—", delta: "", trend: "down" as const, icon: AlertTriangle, tone: "warning", spark: [] },
    { label: "Churn mês",         value: m ? String(m.churnThisMonth) : "—", delta: "", trend: "down" as const, icon: UserMinus,    tone: "danger",  spark: [] },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Assinaturas
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Planos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acompanhe a base de assinantes do plano único — conversão, retenção
            e inadimplência.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex">
            <span className="h-2 w-2 bg-foreground" />
            Plano único · R$ 89/mês
          </div>
        </div>
      </header>

      {/* Métricas principais */}
      <section className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {LIVE.map((m, i) => (
          <MetricCard key={m.label} metric={m} index={i} />
        ))}
      </section>

      {/* Comparativo cadastros x pagantes */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Comparativo
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">
                Cadastros vs assinantes pagantes
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-primary" /> Cadastros
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-foreground/70" /> Pagantes
              </span>
            </div>
          </header>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COMPARATIVO} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cadastros"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#gCad)"
                  isAnimationActive
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="pagantes"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#gPag)"
                  isAnimationActive
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        {/* KPIs do plano */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Indicadores do plano
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">
              Receita e retenção
            </h2>
          </header>
          <ul className="space-y-4">
            {[
              {
                label: "MRR",
                value: "R$ 114.276",
                hint: "+6,8% vs mês anterior",
                icon: DollarSign,
                trend: "up" as const,
              },
              {
                label: "ARPU",
                value: "R$ 89,00",
                hint: "Plano único",
                icon: Percent,
                trend: "up" as const,
              },
              {
                label: "Conversão teste → pago",
                value: "68,4%",
                hint: "+2,1pp",
                icon: TrendingUp,
                trend: "up" as const,
              },
              {
                label: "Churn mensal",
                value: "2,9%",
                hint: "−0,4pp",
                icon: Repeat,
                trend: "down" as const,
              },
            ].map((k) => (
              <li
                key={k.label}
                className="flex items-center gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center border border-border bg-secondary/50 text-muted-foreground">
                  <k.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="font-display text-xl font-bold tabular-nums leading-tight">
                    {k.value}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                    k.trend === "up" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {k.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {k.hint}
                </span>
              </li>
            ))}
          </ul>
        </motion.article>
      </section>

      {/* Funil + distribuição */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Funil
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">
              Do cadastro à renovação
            </h2>
          </header>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONVERSAO} margin={{ top: 18, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="etapa" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary) / 0.5)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="v" fill="hsl(var(--foreground))" isAnimationActive animationDuration={900}>
                  <LabelList
                    dataKey="v"
                    position="top"
                    fill="hsl(var(--foreground))"
                    fontSize={11}
                    fontWeight={600}
                    formatter={(v: number) => v.toLocaleString("pt-BR")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Distribuição
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">Base atual</h2>
          </header>
          <ul className="space-y-3">
            {[
              { label: "Pagantes ativos", v: 1284, pct: 82, tone: "bg-foreground" },
              { label: "Em teste", v: 182, pct: 12, tone: "bg-muted-foreground" },
              { label: "Inadimplentes", v: 67, pct: 4, tone: "bg-amber-500" },
              { label: "Cancelados (mês)", v: 39, pct: 2, tone: "bg-rose-500" },
            ].map((s, i) => (
              <li key={s.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold">{s.label}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {s.v.toLocaleString("pt-BR")} · {s.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    className={`h-full ${s.tone}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.article>
      </section>
    </div>
  );
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const Icon = metric.icon;
  const max = Math.max(...metric.spark);
  const min = Math.min(...metric.spark);
  const range = max - min || 1;
  const points = metric.spark
    .map((v, i) => {
      const x = (i / (metric.spark.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
      className="group relative flex h-[158px] flex-col overflow-hidden bg-card p-5 transition-colors hover:bg-secondary/30"
    >
      <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100" />

      <div className="pointer-events-none absolute -bottom-5 -right-5 text-foreground/[0.05]">
        <Icon className="h-36 w-36 stroke-1" />
      </div>

      <p className={`relative z-10 text-center text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses(metric.tone)}`}>
        {metric.label}
      </p>

      <div className="relative z-10 flex flex-1 items-center justify-center py-1">
        <p className="text-center font-display text-5xl font-bold tracking-tight tabular-nums">
          {metric.value}
        </p>
      </div>

      <div className="relative z-10 mt-auto flex h-[17px] items-start justify-between border-t border-border pt-[2px]">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold leading-none ${
            metric.trend === "up" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {metric.trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {metric.delta}
        </span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-4 w-20 opacity-70">
          <motion.polyline
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 + index * 0.08, ease: "easeOut" }}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="square"
            points={points}
          />
        </svg>
      </div>
    </motion.article>
  );
}
