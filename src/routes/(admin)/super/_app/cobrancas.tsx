import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock, RefreshCw, AlertTriangle, Clock, ShieldOff,
  CheckCircle2, XCircle, Mail, MessageSquare, DollarSign, X,
  RotateCw, Ban, Unlock, Activity, Search, Download, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import { withSuperToken } from "@/lib/super-client";
import {
  getBillingOverview, getUserBillingDetail, getCronRuns, adminRenewSubscription,
  type BillingRow, type TimelineItem, type CronRun,
} from "@/lib/super-billing.functions";
import { adminSuspendUser, adminUnblockUser, adminGrantTrial } from "@/lib/super-admin.functions";

export const Route = createFileRoute("/(admin)/super/_app/cobrancas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cobranças — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CobrancasPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  trial:     { label: "Acesso Livre", color: "bg-sky-100 text-sky-700" },
  active:    { label: "Ativo",        color: "bg-emerald-100 text-emerald-700" },
  overdue:   { label: "Vencido",      color: "bg-orange-100 text-orange-700" },
  suspended: { label: "Suspenso",     color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelado",    color: "bg-zinc-100 text-zinc-500" },
  especial:  { label: "Especial",     color: "bg-violet-100 text-violet-700" },
};

const NOTIF_LABEL: Record<string, string> = {
  trial_3d:          "Aviso: trial em 3 dias",
  trial_1d:          "Aviso: trial amanhã",
  trial_expired:     "Trial encerrado",
  billing_3d:        "Aviso: fatura em 3 dias",
  billing_1d:        "Aviso: fatura amanhã",
  suspended_overdue: "Suspenso por inadimplência",
};

const EVENT_LABEL: Record<string, string> = {
  payment_confirmed: "Pagamento confirmado",
  payment_received:  "Pagamento recebido",
  payment_overdue:   "Pagamento vencido",
  payment_refunded:  "Pagamento estornado",
  subscription_created: "Assinatura criada",
  subscription_renewed: "Assinatura renovada",
  subscription_cancelled: "Assinatura cancelada",
};

function brl(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function daysBadge(row: BillingRow): { text: string; cls: string } {
  if (row.status === "especial") return { text: "Vitalício", cls: "bg-violet-50 text-violet-600" };
  if (row.isBlocked)             return { text: "Bloqueado", cls: "bg-rose-100 text-rose-700" };
  const d = row.daysToBlock;
  if (d === null)                return { text: "—", cls: "bg-zinc-100 text-zinc-500" };
  if (d <= 0)                    return { text: "Hoje", cls: "bg-rose-100 text-rose-700" };
  if (d <= 3)                    return { text: `${d}d`, cls: "bg-amber-100 text-amber-700" };
  if (d <= 7)                    return { text: `${d}d`, cls: "bg-yellow-50 text-yellow-700" };
  return { text: `${d}d`, cls: "bg-zinc-100 text-zinc-600" };
}

type FilterId = "todos" | "venc3" | "venc7" | "bloqueados" | "trial" | "ativos";

// ─── Página ───────────────────────────────────────────────────────────────────

function CobrancasPage() {
  const [rows, setRows]       = useState<BillingRow[]>([]);
  const [crons, setCrons]     = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterId>("todos");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<BillingRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        getBillingOverview({ data: withSuperToken() }),
        getCronRuns({ data: withSuperToken() }),
      ]);
      setRows(r);
      setCrons(c);
    } catch (e: any) {
      toast.error("Erro ao carregar: " + (e?.message ?? ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    venc3:      rows.filter((r) => !r.isBlocked && r.daysToBlock !== null && r.daysToBlock <= 3 && r.status !== "especial").length,
    venc7:      rows.filter((r) => !r.isBlocked && r.daysToBlock !== null && r.daysToBlock <= 7 && r.status !== "especial").length,
    bloqueados: rows.filter((r) => r.isBlocked).length,
    trial:      rows.filter((r) => r.status === "trial").length,
    ativos:     rows.filter((r) => r.status === "active").length,
  }), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "venc3")      list = list.filter((r) => !r.isBlocked && r.daysToBlock !== null && r.daysToBlock <= 3 && r.status !== "especial");
    else if (filter === "venc7") list = list.filter((r) => !r.isBlocked && r.daysToBlock !== null && r.daysToBlock <= 7 && r.status !== "especial");
    else if (filter === "bloqueados") list = list.filter((r) => r.isBlocked);
    else if (filter === "trial")      list = list.filter((r) => r.status === "trial");
    else if (filter === "ativos")     list = list.filter((r) => r.status === "active");

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    return list;
  }, [rows, filter, search]);

  const lastCron = crons[0];

  const FILTERS: { id: FilterId; label: string; count?: number }[] = [
    { id: "todos",      label: "Todos" },
    { id: "venc3",      label: "Vence ≤3d", count: counts.venc3 },
    { id: "venc7",      label: "Vence ≤7d", count: counts.venc7 },
    { id: "bloqueados", label: "Bloqueados", count: counts.bloqueados },
    { id: "trial",      label: "Trial", count: counts.trial },
    { id: "ativos",     label: "Ativos", count: counts.ativos },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> Assinaturas
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Cobranças</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quem vai bloquear, notificações enviadas, pagamentos e ações manuais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadCSV(`cobrancas-${new Date().toISOString().slice(0,10)}`, filtered.map((r) => ({
            nome: r.name, email: r.email, telefone: r.phone, plano: r.planName,
            valor: (r.priceCents / 100).toFixed(2), status: r.status,
            proximo_evento: r.nextEventLabel, data: r.nextEventAt ? new Date(r.nextEventAt).toLocaleDateString("pt-BR") : "",
            dias_para_bloquear: r.daysToBlock ?? "", bloqueado: r.isBlocked ? "sim" : "não",
          })))} disabled={loading || filtered.length === 0}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </header>

      {/* Health do cron */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <Activity className="h-4 w-4 text-primary" />
        <span className="font-semibold">Cron de assinaturas</span>
        {lastCron ? (
          <>
            <span className="text-muted-foreground">última execução {timeAgo(lastCron.createdAt)}</span>
            <span className="text-emerald-600">{lastCron.notified} notificados</span>
            <span className="text-rose-600">{lastCron.suspended} suspensos</span>
            {lastCron.errors > 0 && <span className="text-orange-600">{lastCron.errors} erros</span>}
          </>
        ) : (
          <span className="text-orange-600">nenhuma execução registrada ainda</span>
        )}
      </div>

      {/* Cards resumo */}
      <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
        {[
          { label: "Vence em ≤3 dias", value: counts.venc3, icon: AlertTriangle, tone: "text-amber-600" },
          { label: "Bloqueados",       value: counts.bloqueados, icon: ShieldOff, tone: "text-rose-600" },
          { label: "Em trial",         value: counts.trial, icon: Clock, tone: "text-sky-600" },
          { label: "Ativos",           value: counts.ativos, icon: CheckCircle2, tone: "text-emerald-600" },
        ].map((c) => (
          <div key={c.label} className="flex flex-col gap-2 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.tone)} />
            </div>
            <p className="font-display text-2xl font-bold tabular-nums">{loading ? "—" : c.value}</p>
          </div>
        ))}
      </section>

      {/* Filtros + busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filter === f.id ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary",
              )}
            >
              {f.label}
              {f.count !== undefined && (
                <span className={cn("rounded-full px-1.5 text-[10px]", filter === f.id ? "bg-background/20" : "bg-muted text-muted-foreground")}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou email" className="pl-9" />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1.1fr_0.7fr_auto] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Profissional</span><span>Plano</span><span>Status</span><span>Próximo evento</span><span>Faltam</span><span className="text-right">Ações</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum resultado.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const st = STATUS_CFG[r.status] ?? { label: r.status, color: "bg-muted text-muted-foreground" };
              const db = daysBadge(r);
              return (
                <li key={r.userId} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[1.6fr_1fr_0.8fr_1.1fr_0.7fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{r.planName}</span>
                    {r.priceCents > 0 && <span className="ml-1 text-xs text-muted-foreground">{brl(r.priceCents)}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", st.color)}>{st.label}</span>
                    {r.notes?.includes("Reentrada") && (
                      <span className="inline-flex rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">reentrada</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">{r.nextEventLabel !== "—" ? r.nextEventLabel + ": " : ""}</span>
                    {fmtDate(r.nextEventAt)}
                  </div>
                  <div>
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-bold tabular-nums", db.cls)}>{db.text}</span>
                  </div>
                  <div className="flex justify-start gap-1.5 md:justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSelected(r)}>Detalhes</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <DetailDialog row={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}
    </div>
  );
}

// ─── Drawer de detalhe ────────────────────────────────────────────────────────

function DetailDialog({ row, onClose, onChanged }: { row: BillingRow; onClose: () => void; onChanged: () => void }) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [granting, setGranting] = useState(false);
  const [reason, setReason]     = useState("");

  useEffect(() => {
    getUserBillingDetail({ data: withSuperToken({ userId: row.userId }) })
      .then((d) => setTimeline(d.timeline))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [row.userId]);

  async function act(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      onChanged();
      onClose();
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? ""));
    } finally {
      setBusy(false);
    }
  }

  const st = STATUS_CFG[row.status] ?? { label: row.status, color: "bg-muted text-muted-foreground" };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold">{row.name}</h2>
              <p className="truncate text-xs text-muted-foreground">{row.email}{row.phone ? ` · ${row.phone}` : ""}</p>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("inline-flex rounded-full px-2 py-0.5 font-bold", st.color)}>{st.label}</span>
            <span className="text-muted-foreground">{row.planName}{row.priceCents > 0 ? ` · ${brl(row.priceCents)}` : ""}</span>
            {row.nextEventAt && <span className="text-muted-foreground">· {row.nextEventLabel}: {fmtDate(row.nextEventAt)}</span>}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
          <Button size="sm" disabled={busy}
            onClick={() => act(() => adminRenewSubscription({ data: withSuperToken({ userId: row.userId, userEmail: row.email, days: 30 }) }), "Renovado +30 dias")}>
            <RotateCw className="h-3.5 w-3.5" /> Renovar +30d
          </Button>
          {row.isBlocked || row.status === "suspended" ? (
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => act(() => adminUnblockUser({ data: withSuperToken({ userId: row.userId, userEmail: row.email }) }), "Desbloqueado")}>
              <Unlock className="h-3.5 w-3.5" /> Desbloquear
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => act(() => adminSuspendUser({ data: withSuperToken({ userId: row.userId, userEmail: row.email }) }), "Suspenso")}>
              <Ban className="h-3.5 w-3.5" /> Suspender
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setGranting((g) => !g)}>
            <Gift className="h-3.5 w-3.5" /> Liberar trial
          </Button>
        </div>

        {/* Painel: liberar trial com justificativa obrigatória */}
        {granting && (
          <div className="space-y-2 border-b border-border bg-amber-50/50 px-5 py-3">
            <label className="text-xs font-semibold text-amber-800">
              Justifique a liberação do Acesso Livre (obrigatório)
            </label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Ex: cliente entrou em contato, conta anterior foi engano…" className="text-sm" />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setGranting(false); setReason(""); }}>Cancelar</Button>
              <Button size="sm" disabled={busy || reason.trim().length < 5}
                onClick={() => act(() => adminGrantTrial({ data: withSuperToken({ userId: row.userId, userEmail: row.email, reason: reason.trim(), days: 7 }) }), "Acesso Livre liberado (7 dias)")}>
                <Gift className="h-3.5 w-3.5" /> Liberar 7 dias
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Histórico</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : timeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sem pagamentos ou notificações registrados.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((it) => (
                <li key={`${it.kind}-${it.id}`} className="flex gap-3">
                  <div className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    it.kind === "payment" ? "bg-emerald-100 text-emerald-600" :
                    it.status === "sent" ? "bg-sky-100 text-sky-600" : "bg-rose-100 text-rose-600",
                  )}>
                    {it.kind === "payment" ? <DollarSign className="h-4 w-4" />
                      : it.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {it.kind === "payment" ? (
                      <>
                        <p className="text-sm font-medium">{EVENT_LABEL[it.eventType] ?? it.eventType}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.amountCents > 0 ? brl(it.amountCents) + " · " : ""}
                          {it.statusBefore && it.statusAfter ? `${it.statusBefore} → ${it.statusAfter} · ` : ""}
                          {fmtDateTime(it.at)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {NOTIF_LABEL[it.notifKind] ?? it.notifKind}
                          {it.status === "sent"
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            : <XCircle className="h-3.5 w-3.5 text-rose-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {it.channel === "email" ? "Email" : "WhatsApp"}
                          {it.target ? ` · ${it.target}` : ""} · {fmtDateTime(it.at)}
                          {it.error ? ` · ${it.error}` : ""}
                        </p>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
