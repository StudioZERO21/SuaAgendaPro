import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { DollarSign, TrendingDown, AlertTriangle, Users, Download, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { withSuperToken } from "@/lib/super-client";
import { getSuperAdminMetrics, getSuperAdminUsers, getBillingEvents, type SuperMetrics, type SuperUser, type BillingEvent } from "@/lib/super-admin.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/(admin)/super/_app/financeiro")({
  ssr: false,
  head: () => ({ meta: [{ title: "Financeiro — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FinanceiroPage,
});

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const EVENT_LABELS: Record<string, string> = {
  payment_received:    "Pagamento recebido",
  payment_pending:     "Pagamento pendente",
  payment_overdue:     "Pagamento vencido",
  payment_refunded:    "Estorno",
  subscription_created:"Assinatura criada",
  subscription_cancelled: "Assinatura cancelada",
  trial_started:       "Trial iniciado",
  trial_expired:       "Trial expirado",
};

const EVENT_STYLE: Record<string, string> = {
  payment_received:    "bg-emerald-100 text-emerald-700",
  payment_pending:     "bg-amber-100   text-amber-700",
  payment_overdue:     "bg-rose-100    text-rose-700",
  payment_refunded:    "bg-orange-100  text-orange-700",
  subscription_created:"bg-blue-100    text-blue-700",
  subscription_cancelled:"bg-zinc-100  text-zinc-500",
  trial_started:       "bg-violet-100  text-violet-700",
  trial_expired:       "bg-zinc-100    text-zinc-500",
};

const statusStyle: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  trial:     "bg-amber-100  text-amber-700",
  suspended: "bg-rose-100   text-rose-700",
  overdue:   "bg-orange-100 text-orange-700",
  cancelled: "bg-zinc-100   text-zinc-500",
  especial:  "bg-violet-100 text-violet-700",
};
const statusLabel: Record<string, string> = {
  active: "Ativo", trial: "Trial", suspended: "Suspenso",
  overdue: "Inadimplente", cancelled: "Cancelado", especial: "Especial",
};

const PAGE_SIZE = 20;

function FinanceiroPage() {
  const [metrics, setMetrics]   = useState<SuperMetrics | null>(null);
  const [users, setUsers]       = useState<SuperUser[]>([]);
  const [events, setEvents]     = useState<BillingEvent[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filtros de transações
  const [q, setQ]               = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [evtFilter, setEvtFilter] = useState("todos");
  const [page, setPage]         = useState(1);

  function load() {
    setLoading(true);
    Promise.all([
      getSuperAdminMetrics({ data: withSuperToken() }).catch((e) => { toast.error("Métricas: " + e.message); return null; }),
      getSuperAdminUsers({ data: withSuperToken() }).catch(() => [] as SuperUser[]),
      getBillingEvents({ data: withSuperToken({ from: dateFrom || undefined, to: dateTo || undefined, eventType: evtFilter }) })
        .catch((e) => { toast.error("Eventos: " + e.message); return [] as BillingEvent[]; }),
    ]).then(([m, u, ev]) => {
      if (m) setMetrics(m);
      setUsers((u ?? []).filter((u) => ["active", "overdue", "suspended"].includes(u.status)));
      setEvents(ev ?? []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEvents = useMemo(() => {
    if (!q.trim()) return events;
    const lq = q.toLowerCase();
    return events.filter((e) =>
      e.userName.toLowerCase().includes(lq) ||
      e.userEmail.toLowerCase().includes(lq) ||
      (e.asaasPaymentId ?? "").toLowerCase().includes(lq),
    );
  }, [events, q]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filteredEvents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function exportCSV() {
    const header = "Data,Usuário,E-mail,Evento,Valor,Status Antes,Status Depois,ID Asaas";
    const rows = filteredEvents.map((e) =>
      [
        fmtDate(e.createdAt),
        e.userName,
        e.userEmail,
        EVENT_LABELS[e.eventType] ?? e.eventType,
        (e.amountCents / 100).toFixed(2),
        e.statusBefore ?? "",
        e.statusAfter ?? "",
        e.asaasPaymentId ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "MRR",             value: metrics ? fmt(metrics.mrr * 100)        : null, icon: DollarSign,   color: "text-emerald-600", sub: "receita recorrente mensal" },
    { label: "Ativos pagantes", value: metrics ? String(metrics.activeUsers)    : null, icon: Users,         color: "text-blue-600",    sub: "com plano pago ativo" },
    { label: "Inadimplentes",   value: metrics ? String(metrics.suspendedUsers) : null, icon: AlertTriangle, color: "text-orange-600",  sub: "pagamento em atraso" },
    { label: "Churn/mês",       value: metrics ? String(metrics.churnThisMonth) : null, icon: TrendingDown,  color: "text-rose-600",    sub: "cancelamentos neste mês" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Receita &amp; contábil</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Financeiro</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Visão de receita: MRR, assinantes e histórico de cobranças. Para gestão operacional
            (quem vai bloquear, renovar, suspender), use{" "}
            <Link to="/super/cobrancas" className="font-semibold text-primary hover:underline">Cobranças</Link>.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" disabled={filteredEvents.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex flex-col gap-4 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <div>
              <p className="font-display text-3xl font-bold tabular-nums">
                {c.value !== null ? c.value : <span className="animate-pulse text-muted-foreground">—</span>}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Assinantes */}
      <section className="border border-border bg-card shadow-sm">
        <header className="border-b border-border p-4">
          <h2 className="font-semibold">Assinantes com faturamento</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ativos, suspensos e inadimplentes</p>
        </header>
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Carregando…</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum assinante encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Usuário</th>
                  <th className="px-4 py-3 text-left font-semibold">Plano</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Venc. período</th>
                  <th className="px-4 py-3 text-right font-semibold">Desde</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.planName}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", statusStyle[u.status] ?? "bg-zinc-100 text-zinc-500")}>
                        {statusLabel[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.currentPeriodEnd)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Histórico de cobranças */}
      <section className="border border-border bg-card shadow-sm">
        <header className="border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Histórico de cobranças</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por nome, e-mail ou ID…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 text-xs" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 text-xs" />
              <Button size="sm" onClick={() => { setPage(1); load(); }}>Filtrar</Button>
              {(dateFrom || dateTo) && (
                <Button size="sm" variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); load(); }}>Limpar</Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {(["todos", "payment_received", "payment_pending", "payment_overdue", "subscription_created", "trial_started", "trial_expired"] as const).map((v) => (
                <button key={v} onClick={() => { setEvtFilter(v); setPage(1); }}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                    evtFilter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}>
                  {v === "todos" ? "Todos" : EVENT_LABELS[v] ?? v}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Carregando eventos…</p>
        ) : filteredEvents.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Data</th>
                    <th className="px-4 py-3 text-left font-semibold">Usuário</th>
                    <th className="px-4 py-3 text-left font-semibold">Evento</th>
                    <th className="px-4 py-3 text-left font-semibold">Valor</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">ID Asaas</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((e) => (
                    <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">{e.userName}</p>
                        <p className="text-[11px] text-muted-foreground">{e.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", EVENT_STYLE[e.eventType] ?? "bg-zinc-100 text-zinc-500")}>
                          {EVENT_LABELS[e.eventType] ?? e.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {e.amountCents > 0 ? fmt(e.amountCents) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {e.statusBefore && e.statusAfter ? `${e.statusBefore} → ${e.statusAfter}` : e.statusAfter ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.asaasPaymentId
                          ? <span className="font-mono text-[10px] text-muted-foreground">{e.asaasPaymentId.slice(0, 20)}…</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredEvents.length)}</span> de <span className="font-semibold text-foreground">{filteredEvents.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>‹</Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={cn("h-8 min-w-8 rounded-md px-2 text-xs font-semibold",
                        safePage === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      )}>{i + 1}</button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
