import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Calendar, Users, DollarSign, Clock,
  Star, ArrowUpRight, Trophy, Medal, Award, Flame, Loader2,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { useDashboard, pctDelta, PEAK_DAYS, PEAK_SLOTS } from "@/hooks/useDashboard";
import { formatPrice } from "@/hooks/useServicos";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
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
      bg: "bg-gradient-to-br from-pink-500 to-pink-700",
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
                  <motion.div
                    key={k.key}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "relative overflow-visible rounded-lg p-4 pb-3 text-white shadow-card",
                      k.bg,
                      k.premium && "ring-2 ring-pink-300/60 shadow-[0_8px_28px_-6px_rgba(236,72,153,0.55)]",
                    )}
                  >
                    {k.premium && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 260 }}
                        className="pointer-events-none absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-pink-600 shadow-md"
                      >
                        <Star className="h-2.5 w-2.5 fill-pink-500 text-pink-500" /> Premium
                      </motion.span>
                    )}
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Trend className="h-3 w-3" /> {k.delta}
                      </span>
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="mt-4 font-display text-3xl font-bold leading-none tracking-tight"
                    >
                      {k.value}
                    </motion.p>
                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-white/20">{k.label}</p>
                    <motion.div
                      initial={{ y: 24, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 180, damping: 14 }}
                      className="pointer-events-none absolute -bottom-3 -right-3"
                    >
                      <Icon
                        className={cn("h-16 w-16", k.premium ? "text-white/30 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "text-white/15")}
                        strokeWidth={1.2}
                      />
                    </motion.div>
                  </motion.div>
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "" : `R$${Math.round((v as number) / 100)}`} />
                    <Tooltip
                      formatter={(v) => [formatPrice(v as number), "Receita"]}
                      labelStyle={{ fontSize: 11, fontWeight: 600 }}
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: "var(--primary)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* ── Heatmap ── */}
          <section className="mt-6 px-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pico de atendimento</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                <Flame className="h-3 w-3" /> Alta demanda
              </span>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              {d.peakTop[0]?.count === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Ainda sem dados de atendimento para calcular picos.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {d.peakTop.map((p, i) => (
                      <motion.div key={`${p.day}-${p.slot}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                        className={cn("rounded-md p-3", i === 0 ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white" : "bg-muted text-foreground")}
                      >
                        <p className={cn("text-[9px] font-semibold uppercase tracking-wider", i === 0 ? "text-white/70" : "text-muted-foreground")}>{p.day}</p>
                        <p className="mt-1 font-display text-lg font-bold leading-none">{p.slot}</p>
                        <p className={cn("mt-2 text-[10px] font-semibold", i === 0 ? "text-white/80" : "text-muted-foreground")}>{p.count} atend.</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8" />
                      <div className="grid flex-1 grid-cols-6 gap-1">
                        {PEAK_DAYS.map((day) => (
                          <span key={day} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {d.peakMatrix.map((row, ri) => (
                        <div key={PEAK_SLOTS[ri]} className="flex items-center gap-2">
                          <span className="w-8 text-[10px] font-semibold text-muted-foreground">{PEAK_SLOTS[ri]}</span>
                          <div className="grid flex-1 grid-cols-6 gap-1">
                            {row.map((v, ci) => {
                              const op    = 0.12 + (v / 10) * 0.88;
                              const isMax = v >= 9;
                              return (
                                <motion.div
                                  key={`${ri}-${ci}`}
                                  initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: (ri * 6 + ci) * 0.012, type: "spring", stiffness: 260, damping: 22 }}
                                  className={cn("relative aspect-square rounded-sm", isMax && "ring-2 ring-pink-400")}
                                  style={{ backgroundColor: `rgba(236, 72, 153, ${op})` }}
                                  title={`${PEAK_DAYS[ci]} ${PEAK_SLOTS[ri]} — ${v}/10`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Menos</span>
                      {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
                        <span key={o} className="h-2.5 w-3 rounded-sm" style={{ backgroundColor: `rgba(236, 72, 153, ${o})` }} />
                      ))}
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Mais</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

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
                <p className="text-sm text-muted-foreground">Nenhuma cliente cadastrada ainda.</p>
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
