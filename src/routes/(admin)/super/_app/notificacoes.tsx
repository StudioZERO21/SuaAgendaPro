import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Bell, RefreshCw, Play, Send, Clock, Mail, MessageSquare,
  CheckCircle2, XCircle, Hourglass, Settings, Inbox, Save, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import { withSuperToken } from "@/lib/super-client";
import {
  getNotificationFeed, getNotificationQueue, getNotificationSettings,
  saveNotificationSettings, triggerSubscriptionCron, triggerNotificationWorker,
  type NotifRow, type NotifSettings,
} from "@/lib/super-notifications.functions";

export const Route = createFileRoute("/(admin)/super/_app/notificacoes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Notificações — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NotificacoesPage,
});

const KIND_LABEL: Record<string, string> = {
  trial_3d: "Trial em 3 dias", trial_1d: "Trial amanhã", trial_expired: "Trial encerrado",
  billing_3d: "Fatura em 3 dias", billing_1d: "Fatura amanhã", suspended_overdue: "Suspensão por atraso",
};
const KINDS = Object.keys(KIND_LABEL);

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: "Na fila",  cls: "bg-amber-100 text-amber-700",     icon: Hourglass },
  sent:    { label: "Enviado",  cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  failed:  { label: "Falhou",   cls: "bg-rose-100 text-rose-700",       icon: XCircle },
  skipped: { label: "Pulado",   cls: "bg-zinc-100 text-zinc-500",       icon: XCircle },
};

const CHANNEL_OPTS = [
  { v: "email",    label: "Só Email" },
  { v: "whatsapp", label: "Só WhatsApp" },
  { v: "both",     label: "Email + WhatsApp" },
  { v: "off",      label: "Desligado" },
];

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

type Tab = "enviadas" | "fila" | "config";

function NotificacoesPage() {
  const [tab, setTab] = useState<Tab>("enviadas");
  const [running, setRunning] = useState(false);

  async function runCron() {
    setRunning(true);
    try {
      const r: any = await triggerSubscriptionCron({ data: withSuperToken() });
      toast.success(`Cron executado: ${r?.queued ?? 0} enfileirados, ${r?.suspended ?? 0} suspensos`);
    } catch (e: any) { toast.error("Erro no cron: " + (e?.message ?? "")); }
    finally { setRunning(false); }
  }
  async function runWorker() {
    setRunning(true);
    try {
      const r: any = await triggerNotificationWorker({ data: withSuperToken() });
      if (r?.skipped) toast.message(`Worker: fora da janela de envio (hora ${r.hour}h)`);
      else toast.success(`Worker: ${r?.sent ?? 0} enviados, ${r?.failed ?? 0} falhas`);
    } catch (e: any) { toast.error("Erro no worker: " + (e?.message ?? "")); }
    finally { setRunning(false); }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Bell className="h-3.5 w-3.5" /> Motor de envios
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Notificações</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Avisos de trial e cobrança: o que foi enviado, o que está na fila e como configurar.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runCron} disabled={running}>
            <Play className="h-3.5 w-3.5" /> Rodar cron
          </Button>
          <Button size="sm" variant="outline" onClick={runWorker} disabled={running}>
            <Send className="h-3.5 w-3.5" /> Rodar worker
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {([
          { id: "enviadas", label: "Enviadas", icon: Send },
          { id: "fila",     label: "Próximos envios", icon: Inbox },
          { id: "config",   label: "Configurações", icon: Settings },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "enviadas" && <FeedTab />}
      {tab === "fila"     && <QueueTab />}
      {tab === "config"   && <ConfigTab />}
    </div>
  );
}

// ─── Aba: Enviadas ────────────────────────────────────────────────────────────

function FeedTab() {
  const [rows, setRows]       = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("todos");
  const [channel, setChannel] = useState("todos");
  const [kind, setKind]       = useState("todos");
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getNotificationFeed({ data: withSuperToken({ status, channel, kind, from: from || undefined, to: to || undefined }) });
      setRows(r);
    } catch (e: any) { toast.error("Erro: " + (e?.message ?? "")); }
    finally { setLoading(false); }
  }, [status, channel, kind, from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Status" value={status} onChange={setStatus} opts={[["todos","Todos"],["sent","Enviado"],["pending","Na fila"],["failed","Falhou"]]} />
        <Select label="Canal" value={channel} onChange={setChannel} opts={[["todos","Todos"],["email","Email"],["whatsapp","WhatsApp"]]} />
        <Select label="Tipo" value={kind} onChange={setKind} opts={[["todos","Todos"], ...KINDS.map((k) => [k, KIND_LABEL[k]] as [string,string])]} />
        <div><label className="mb-1 block text-[11px] font-semibold text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" /></div>
        <div><label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" /></div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /></Button>
        <Button size="sm" variant="outline" disabled={rows.length === 0}
          onClick={() => downloadCSV(`notificacoes-${new Date().toISOString().slice(0,10)}`, rows.map((r) => ({
            profissional: r.userName, destinatario: r.target ?? r.userEmail, tipo: r.kind, canal: r.channel,
            status: r.status, enviado_em: r.sentAt ? new Date(r.sentAt).toLocaleString("pt-BR") : "",
            criado_em: new Date(r.createdAt).toLocaleString("pt-BR"), erro: r.error ?? "",
          })))}>
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <NotifTable rows={rows} loading={loading} showWhen="sentAt" />
    </div>
  );
}

// ─── Aba: Fila ────────────────────────────────────────────────────────────────

function QueueTab() {
  const [rows, setRows]       = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await getNotificationQueue({ data: withSuperToken() })); }
    catch (e: any) { toast.error("Erro: " + (e?.message ?? "")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{loading ? "…" : `${rows.length} aviso(s) aguardando envio`}</p>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Atualizar</Button>
      </div>
      <NotifTable rows={rows} loading={loading} showWhen="scheduledFor" />
    </div>
  );
}

// ─── Aba: Configurações ───────────────────────────────────────────────────────

function ConfigTab() {
  const [cfg, setCfg]     = useState<NotifSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getNotificationSettings({ data: withSuperToken() }).then(setCfg).catch(() => {}); }, []);

  if (!cfg) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  function setChannel(kind: string, v: string) {
    setCfg((c) => c ? { ...c, channels: { ...c.channels, [kind]: v as any } } : c);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    try {
      await saveNotificationSettings({ data: withSuperToken({
        channels: cfg.channels, windowStartHour: cfg.windowStartHour, windowEndHour: cfg.windowEndHour,
        throttlePerRun: cfg.throttlePerRun, sendDelayMs: cfg.sendDelayMs,
      }) });
      toast.success("Configurações salvas");
    } catch (e: any) { toast.error("Erro: " + (e?.message ?? "")); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Canal por tipo */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-base font-bold">Canal por tipo de aviso</h3>
        <p className="mb-4 text-xs text-muted-foreground">Escolha por onde cada aviso é enviado.</p>
        <div className="space-y-2.5">
          {KINDS.map((k) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-sm">{KIND_LABEL[k]}</span>
              <select value={cfg.channels[k] ?? "off"} onChange={(e) => setChannel(k, e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                {CHANNEL_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Janela e throttle */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-base font-bold">Janela de horário e ritmo</h3>
        <p className="mb-4 text-xs text-muted-foreground">Evita spam e bloqueio de número. Horário em {cfg.timezone}.</p>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Enviar a partir de (h)" value={cfg.windowStartHour} min={0} max={23} onChange={(v) => setCfg((c) => c && { ...c, windowStartHour: v })} />
          <NumField label="Enviar até (h)" value={cfg.windowEndHour} min={1} max={24} onChange={(v) => setCfg((c) => c && { ...c, windowEndHour: v })} />
          <NumField label="Máx. por execução do worker" value={cfg.throttlePerRun} min={1} max={100} onChange={(v) => setCfg((c) => c && { ...c, throttlePerRun: v })} />
          <NumField label="Intervalo entre envios (ms)" value={cfg.sendDelayMs} min={0} max={30000} onChange={(v) => setCfg((c) => c && { ...c, sendDelayMs: v })} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          O worker roda a cada poucos minutos e envia no máximo {cfg.throttlePerRun} por vez, com {cfg.sendDelayMs}ms entre cada — espalhando os envios.
        </p>
      </section>

      <Button onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar configurações"}</Button>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function NotifTable({ rows, loading, showWhen }: { rows: NotifRow[]; loading: boolean; showWhen: "sentAt" | "scheduledFor" }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="hidden grid-cols-[1.5fr_1.1fr_0.8fr_0.8fr_1fr] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <span>Profissional</span><span>Tipo</span><span>Canal</span><span>Status</span><span>{showWhen === "sentAt" ? "Enviado em" : "Agendado p/"}</span>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro.</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const st = STATUS_CFG[r.status] ?? { label: r.status, cls: "bg-muted text-muted-foreground", icon: Clock };
            return (
              <li key={r.id} className="grid grid-cols-1 gap-1 px-4 py-2.5 text-sm md:grid-cols-[1.5fr_1.1fr_0.8fr_0.8fr_1fr] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.target ?? r.userEmail}</p>
                </div>
                <span className="text-xs">{KIND_LABEL[r.kind] ?? r.kind}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {r.channel === "email" ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  {r.channel === "email" ? "Email" : "WhatsApp"}
                </span>
                <span><span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", st.cls)}><st.icon className="h-3 w-3" />{st.label}</span></span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(showWhen === "sentAt" ? (r.sentAt ?? r.createdAt) : r.scheduledFor)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Select({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function NumField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</label>
      <Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value || "0", 10))))} className="h-9" />
    </div>
  );
}
