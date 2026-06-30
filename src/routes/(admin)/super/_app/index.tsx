import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Users, DollarSign, ArrowUpRight, Activity, Clock,
  ShieldOff, Sparkles, TrendingDown, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Shield, BarChart2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart,
} from "recharts";
import { getSuperAdminMetrics, type SuperMetrics } from "@/lib/super-admin.functions";
import { getMetricsHistory, type MetricsPoint } from "@/lib/super-billing.functions";
import { getAuditLog } from "@/lib/super-audit.functions";
import { withSuperToken } from "@/lib/super-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(admin)/super/_app/")({
  ssr: false,
  loader: async () => ({}),
  head: () => ({
    meta: [
      { title: "Dashboard — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuperDashboard,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditEntry = {
  id: string;
  action: string;
  target_user_email: string | null;
  details: Record<string, unknown>;
  performed_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const actionLabel: Record<string, string> = {
  suspend_user:    "Suspendeu usuário",
  unblock_user:    "Reativou usuário",
  grant_especial:  "Concedeu Especial",
  cancel_sub:      "Cancelou assinatura",
  change_plan:     "Alterou plano",
};

const actionColor: Record<string, string> = {
  suspend_user:   "bg-rose-100 text-rose-700",
  unblock_user:   "bg-emerald-100 text-emerald-700",
  grant_especial: "bg-violet-100 text-violet-700",
  cancel_sub:     "bg-zinc-100 text-zinc-500",
  change_plan:    "bg-blue-100 text-blue-700",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

const STATUS_COLORS = [
  "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#d1d5db",
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

function SuperDashboard() {
  const [metrics, setMetrics]   = useState<SuperMetrics | null>(null);
  const [audit,   setAudit]     = useState<AuditEntry[]>([]);
  const [history, setHistory]   = useState<MetricsPoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, auditResult, hist] = await Promise.all([
        getSuperAdminMetrics({ data: withSuperToken() }),
        getAuditLog({ data: withSuperToken({ limit: 20, offset: 0 }) }),
        getMetricsHistory({ data: withSuperToken() }).catch(() => [] as MetricsPoint[]),
      ]);
      setMetrics(m);
      setAudit(auditResult.entries);
      setHistory(hist);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const m = metrics;

  const statusBreakdown = m ? [
    { name: "Ativos",     v: m.activeUsers,    color: STATUS_COLORS[0] },
    { name: "Trial",      v: m.trialUsers,     color: STATUS_COLORS[1] },
    { name: "Suspensos",  v: m.suspendedUsers, color: STATUS_COLORS[2] },
    { name: "Cancelados", v: m.cancelledUsers, color: STATUS_COLORS[3] },
    { name: "Especial",   v: m.specialUsers,   color: STATUS_COLORS[4] },
  ].filter((s) => s.v > 0) : [];

  const CARDS = [
    {
      label: "Usuários ativos",
      value: m ? m.activeUsers : null,
      sub: m ? `${m.trialUsers} em trial` : null,
      icon: Users,
      tone: "text-primary",
    },
    {
      label: "MRR",
      value: m ? `R$ ${m.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null,
      sub: m ? `${m.churnThisMonth} churn este mês` : null,
      icon: DollarSign,
      tone: "text-emerald-600",
    },
    {
      label: "Suspensos",
      value: m ? m.suspendedUsers : null,
      sub: m ? `${m.cancelledUsers} cancelados` : null,
      icon: ShieldOff,
      tone: "text-rose-600",
    },
    {
      label: "Especial / Gratuito",
      value: m ? m.specialUsers : null,
      sub: "acesso vitalício",
      icon: Sparkles,
      tone: "text-violet-600",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Visão geral
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Atualizado às {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
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
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Link
            to="/super/usuarios"
            className="inline-flex shrink-0 items-center gap-1.5 bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background transition hover:bg-foreground/85"
          >
            Ver usuários <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Metric cards */}
      <section className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex flex-col gap-4 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {c.label}
              </p>
              <c.icon className={cn("h-4 w-4", c.tone)} />
            </div>
            <div>
              <p className="font-display text-3xl font-bold tabular-nums">
                {c.value !== null ? String(c.value) : (
                  <span className="animate-pulse text-muted-foreground">—</span>
                )}
              </p>
              {c.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              )}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Evolução (analytics histórico) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border border-border bg-card p-5 shadow-sm"
      >
        <header className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Evolução</p>
            <h2 className="mt-1 font-display text-lg font-bold">MRR e usuários ativos ao longo do tempo</h2>
          </div>
        </header>
        {history.length < 2 ? (
          <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
            Coletando dados diários — o gráfico aparece a partir de 2 dias de histórico.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history.map((h) => ({
                  date: new Date(h.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                  mrr: Math.round(h.mrrCents / 100),
                  ativos: h.active,
                }))}
                margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="l" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number, n: string) => n === "mrr" ? [`R$ ${v}`, "MRR"] : [v, "Ativos"]} />
                <Line yAxisId="l" type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="ativos" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> MRR (R$)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-600" /> Usuários ativos</span>
        </div>
      </motion.section>

      {/* Charts + Audit */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status breakdown bar chart */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Distribuição real
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">
                Usuários por status de assinatura
              </h2>
            </div>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </header>
          {statusBreakdown.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                  />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900}>
                    {statusBreakdown.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Carregando…" : "Sem dados"}
            </div>
          )}
          {statusBreakdown.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-4">
              {statusBreakdown.map((s) => (
                <li key={s.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="font-medium">{s.name}</span>
                  <span className="font-mono text-muted-foreground">{s.v}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.article>

        {/* Pie: status share */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Proporção
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">Mix de planos</h2>
            </div>
          </header>
          {statusBreakdown.length > 0 ? (
            <>
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(v: number, n: string) => [`${v}`, n]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                    />
                    <Pie data={statusBreakdown} dataKey="v" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive animationDuration={900}>
                      {statusBreakdown.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display text-2xl font-bold">{m?.totalUsers ?? "—"}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">total</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {statusBreakdown.map((s) => {
                  const pct = m?.totalUsers ? Math.round((s.v / m.totalUsers) * 100) : 0;
                  return (
                    <li key={s.name} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="flex-1 font-medium">{s.name}</span>
                      <span className="font-mono text-muted-foreground">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Carregando…" : "Sem dados"}
            </div>
          )}
        </motion.article>
      </section>

      {/* Audit feed + MRR box */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Audit feed */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Auditoria
              </p>
              <h2 className="mt-1 font-display text-lg font-bold">Ações administrativas recentes</h2>
            </div>
            <Link
              to="/super/auditoria"
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              Ver tudo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>
          {audit.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              <Shield className="h-8 w-8 opacity-30" />
              {loading ? "Carregando auditoria…" : "Nenhuma ação registrada ainda."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {audit.slice(0, 8).map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          actionColor[a.action] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {actionLabel[a.action] ?? a.action}
                      </span>
                    </p>
                    {a.target_user_email && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        → {a.target_user_email}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(a.performed_at)}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.article>

        {/* Quick stats */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="flex flex-col gap-4 border border-border bg-card p-5 shadow-sm"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Saúde financeira
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">Resumo do mês</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">MRR atual</span>
              </div>
              <span className="font-mono text-sm font-bold">
                {m ? `R$ ${m.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Assinantes pagantes</span>
              </div>
              <span className="font-mono text-sm font-bold">{m?.activeUsers ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Em trial</span>
              </div>
              <span className="font-mono text-sm font-bold">{m?.trialUsers ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium">Churn este mês</span>
              </div>
              <span className="font-mono text-sm font-bold">{m?.churnThisMonth ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Inadimplentes</span>
              </div>
              <span className="font-mono text-sm font-bold">{m?.suspendedUsers ?? "—"}</span>
            </div>
          </div>

          <Link
            to="/super/financeiro"
            className="mt-auto flex items-center justify-center gap-1.5 border border-border py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary"
          >
            Ver financeiro <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.article>
      </section>
    </div>
  );
}

