import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/super/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuperDashboard,
});

type Metric = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: typeof Users;
  spark: number[];
};

const METRICS: Metric[] = [
  {
    label: "Profissionais ativos",
    value: "1.284",
    delta: "+8,2%",
    trend: "up",
    icon: Users,
    spark: [12, 18, 14, 22, 19, 28, 26, 32, 30, 38, 36, 44],
  },
  {
    label: "Agendamentos (30d)",
    value: "24.910",
    delta: "+12,4%",
    trend: "up",
    icon: Calendar,
    spark: [20, 24, 22, 30, 28, 34, 33, 40, 42, 48, 46, 54],
  },
  {
    label: "Receita estimada",
    value: "R$ 487k",
    delta: "+5,1%",
    trend: "up",
    icon: DollarSign,
    spark: [30, 28, 33, 31, 36, 34, 39, 37, 42, 40, 45, 47],
  },
  {
    label: "Churn mensal",
    value: "1,8%",
    delta: "−0,3pp",
    trend: "down",
    icon: TrendingUp,
    spark: [22, 20, 24, 19, 21, 18, 20, 17, 19, 16, 18, 15],
  },
];

const GROWTH = Array.from({ length: 30 }).map((_, i) => ({
  d: `${i + 1}`,
  contas: Math.round(120 + Math.sin(i / 2.6) * 30 + i * 4.2),
  receita: Math.round(80 + Math.cos(i / 3.1) * 22 + i * 3.6),
}));

const SERVICES = [
  { name: "Cabelo", v: 4820 },
  { name: "Unhas", v: 3910 },
  { name: "Estética", v: 3110 },
  { name: "Barba", v: 2480 },
  { name: "Massagem", v: 1720 },
  { name: "Outros", v: 980 },
];

const NICHES = [
  { name: "Cabelo", v: 412 },
  { name: "Unhas", v: 318 },
  { name: "Estética", v: 264 },
  { name: "Barba", v: 158 },
  { name: "Massagem", v: 92 },
  { name: "Outros", v: 40 },
];

const NICHE_COLORS = [
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--foreground) / 0.7)",
  "hsl(var(--muted-foreground) / 0.7)",
  "hsl(var(--foreground) / 0.45)",
  "hsl(var(--muted-foreground) / 0.45)",
];

const ACTIVITY = [
  { who: "Maria Souza", what: "criou uma conta", when: "há 2 min", tag: "novo" },
  { who: "Studio Glamour", what: "publicou novo serviço", when: "há 14 min", tag: "serviço" },
  { who: "Bruno R.", what: "atualizou permissões da equipe", when: "há 32 min", tag: "admin" },
  { who: "Lash Studio", what: "completou onboarding", when: "há 1 h", tag: "onboarding" },
  { who: "Camila A.", what: "fez upgrade para PRO", when: "há 2 h", tag: "upgrade" },
];

function SuperDashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Visão geral
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Saúde da plataforma em tempo real — atualizado agora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-emerald-500" />
            </span>
            Ao vivo
          </div>
          <Link
            to="/super/usuarios"
            className="inline-flex shrink-0 items-center gap-1.5 bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background transition hover:bg-foreground/85"
          >
            Ver usuários <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m, idx) => (
          <MetricCard key={m.label} metric={m} index={idx} />
        ))}
      </section>

      {/* Charts row */}
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
                Performance
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">
                Crescimento de contas & receita
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-primary" /> Contas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-foreground/70" /> Receita
              </span>
            </div>
          </header>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gContas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
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
                  dataKey="receita"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#gReceita)"
                  isAnimationActive
                  animationDuration={1100}
                />
                <Area
                  type="monotone"
                  dataKey="contas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#gContas)"
                  isAnimationActive
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Tempo real
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">Atividade</h2>
            </div>
            <button
              aria-label="Mais"
              className="grid h-8 w-8 place-items-center border border-border text-muted-foreground hover:bg-secondary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </header>
          <ul className="divide-y divide-border">
            {ACTIVITY.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                className="flex items-start gap-3 py-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-secondary text-xs font-bold text-secondary-foreground">
                  {a.who[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {a.tag}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{a.when}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.article>
      </section>

      {/* Services + system */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Distribuição
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">
                Serviços mais agendados
              </h2>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              30 dias
            </span>
          </header>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SERVICES} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="v"
                  fill="hsl(var(--primary))"
                  isAnimationActive
                  animationDuration={1100}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="v"
                    position="top"
                    fill="hsl(var(--foreground))"
                    style={{ fontSize: 11, fontWeight: 600 }}
                    formatter={(value: number) => value.toLocaleString("pt-BR")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Distribuição
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">
                Profissionais por nicho
              </h2>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
          </header>
          <div className="relative h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}`, name]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Pie
                  data={NICHES}
                  dataKey="v"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={1.5}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={1100}
                  label={{ fill: "hsl(var(--background))", fontSize: 10, fontWeight: 700 }}
                  labelLine={{ stroke: "hsl(var(--background) / 0.6)" }}
                >
                  {NICHES.map((_, i) => (
                    <Cell key={i} fill={NICHE_COLORS[i % NICHE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-2xl font-bold tabular-nums">
                {NICHES.reduce((a, b) => a + b.v, 0).toLocaleString("pt-BR")}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                profissionais
              </p>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {NICHES.map((n, i) => (
              <li key={n.name} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-2 w-2 shrink-0"
                  style={{ background: NICHE_COLORS[i % NICHE_COLORS.length] }}
                />
                <span className="flex-1 truncate font-medium">{n.name}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{n.v}</span>
              </li>
            ))}
          </ul>
        </motion.article>



        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sistema
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">Saúde técnica</h2>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </header>
          <ul className="space-y-4">
            {[
              { label: "API", value: 99.98, tone: "bg-emerald-500" },
              { label: "Banco de dados", value: 99.82, tone: "bg-emerald-500" },
              { label: "Pagamentos", value: 98.4, tone: "bg-amber-500" },
              { label: "Notificações", value: 96.1, tone: "bg-amber-500" },
            ].map((s, i) => (
              <li key={s.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold">{s.label}</span>
                  <span className="font-mono text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
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

      {/* Background icon — cropped, anchored bottom-right */}
      <div className="pointer-events-none absolute -bottom-5 -right-5 text-foreground/[0.05]">
        <Icon className="h-36 w-36 stroke-1" />
      </div>

      {/* Label */}
      <p className="relative z-10 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {metric.label}
      </p>

      {/* Value */}
      <div className="relative z-10 flex flex-1 items-center justify-center py-1">
        <p className="text-center font-display text-5xl font-bold tracking-tight tabular-nums">
          {metric.value}
        </p>
      </div>

      {/* Footer: trend + sparkline */}
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
