import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Server, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  HardDrive, Cpu, MemoryStick, WifiOff, Loader2,
  Clock, Globe, MessageSquare, Activity, Send,
  Database, Users, Layers, FolderOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { withSuperToken } from "@/lib/super-client";
import {
  getInfraStats, getVpsStats, getEvolutionStats, sendEvolutionMessage, getSupabaseStats,
  type InfraStats, type VpsStats, type EvolutionStats, type SupabaseStats,
} from "@/lib/super-infra.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(admin)/super/_app/infra")({
  ssr: false,
  head: () => ({ meta: [{ title: "Infraestrutura — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: InfraPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ApiStatus = "ok" | "error" | "unconfigured";

function fmt(bytes: number, unit: "GB" | "MB" = "GB"): string {
  const div = unit === "GB" ? 1073741824 : 1048576;
  return (bytes / div).toFixed(1);
}

function fmtUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ProgressBar({ pct, tone }: { pct: number; tone: "green" | "yellow" | "red" }) {
  const color = tone === "green" ? "bg-emerald-500" : tone === "yellow" ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function tone(pct: number): "green" | "yellow" | "red" {
  if (pct < 60) return "green";
  if (pct < 85) return "yellow";
  return "red";
}

function StatusIcon({ status }: { status: ApiStatus | "ok" }) {
  if (status === "ok")    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "error") return <XCircle      className="h-4 w-4 text-rose-500"    />;
  return                         <AlertCircle  className="h-4 w-4 text-amber-400"   />;
}

function statusBadge(s: ApiStatus | "ok") {
  return s === "ok" ? "bg-emerald-100 text-emerald-700"
    : s === "error" ? "bg-rose-100 text-rose-700"
    : "bg-amber-100 text-amber-700";
}
function statusLabel(s: ApiStatus | "ok") {
  return s === "ok" ? "OK" : s === "error" ? "Erro" : "Não configurado";
}

const evoStateColor: Record<string, string> = {
  open:       "bg-emerald-100 text-emerald-700",
  close:      "bg-zinc-100 text-zinc-500",
  connecting: "bg-amber-100 text-amber-700",
};
const evoStateLabel: Record<string, string> = {
  open:       "Conectado",
  close:      "Desconectado",
  connecting: "Conectando…",
};

// ─── Component ────────────────────────────────────────────────────────────────

function InfraPage() {
  const [infra,      setInfra]     = useState<InfraStats | null>(null);
  const [vps,        setVps]       = useState<VpsStats | null>(null);
  const [evolution,  setEvolution] = useState<EvolutionStats | null>(null);
  const [supa,       setSupa]      = useState<SupabaseStats | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [sendingMsg, setSendingMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [i, v, e, s] = await Promise.allSettled([
      getInfraStats({ data: withSuperToken() }),
      getVpsStats({ data: withSuperToken() }),
      getEvolutionStats({ data: withSuperToken() }),
      getSupabaseStats({ data: withSuperToken() }),
    ]);
    if (i.status === "fulfilled") setInfra(i.value);
    else toast.error("APIs: " + i.reason?.message);
    if (v.status === "fulfilled") setVps(v.value);
    else toast.error("VPS: " + v.reason?.message);
    if (e.status === "fulfilled") setEvolution(e.value);
    else toast.error("Evolution: " + e.reason?.message);
    if (s.status === "fulfilled") setSupa(s.value);
    else toast.error("Supabase: " + s.reason?.message);
    setLoading(false);
  }

  async function testSendMessage(instanceName: string) {
    setSendingMsg(instanceName);
    try {
      const result = await sendEvolutionMessage({
        data: { ...withSuperToken(), instanceName, to: "5521997051225", text: "Teste de mensagem — SuaAgenda Pro ✅" },
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + (e?.message ?? "desconhecido"));
    } finally {
      setSendingMsg(null);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Computed values ─────────────────────────────────────────────────────────

  const diskTotalGB  = vps ? vps.diskMB / 1024 : 0;
  const diskUsedGB   = vps ? vps.diskUsedBytes / 1073741824 : 0;
  const diskPct      = diskTotalGB > 0 ? (diskUsedGB / diskTotalGB) * 100 : 0;

  const ramTotalGB   = vps ? vps.memoryMB / 1024 : 0;
  const ramUsedGB    = vps ? vps.ramUsedBytes / 1073741824 : 0;
  const ramPct       = ramTotalGB > 0 ? (ramUsedGB / ramTotalGB) * 100 : 0;

  const cpuPct       = vps?.cpuPercent ?? 0;
  const bwTB         = vps ? (vps.bandwidthMB / 1024 / 1024).toFixed(0) : "—";

  const apis = infra ? [
    { name: "Supabase", status: infra.apiHealth.supabase  as ApiStatus },
    { name: "Asaas",    status: infra.apiHealth.asaas     as ApiStatus },
    { name: "Resend",   status: infra.apiHealth.resend    as ApiStatus },
    { name: "Evolution",status: infra.apiHealth.evolution as ApiStatus },
  ] : [];

  const envVars = infra ? [
    { key: "ASAAS_API_KEY",       ok: infra.envConfigured.ASAAS_API_KEY       },
    { key: "RESEND_API_KEY",      ok: infra.envConfigured.RESEND_API_KEY      },
    { key: "EVOLUTION_API_URL",   ok: infra.envConfigured.EVOLUTION_API_URL   },
    { key: "EVOLUTION_API_KEY",   ok: infra.envConfigured.EVOLUTION_API_KEY   },
    { key: "HOSTINGER_API_TOKEN", ok: infra.envConfigured.HOSTINGER_API_TOKEN },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Sistema</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Infraestrutura</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">VPS, APIs e variáveis de ambiente.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {/* ── VPS Hero Card ───────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border bg-card shadow-sm"
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">VPS Hostinger</h2>
            {vps?.configured && (
              <span className={cn(
                "ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                vps.state === "running" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
              )}>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  vps.state === "running" ? "bg-emerald-500 animate-pulse" : "bg-rose-500",
                )} />
                {vps.state === "running" ? "Running" : vps.state}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-28 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : vps?.error ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <XCircle className="h-8 w-8 text-rose-400 opacity-60" />
            <p className="font-medium text-rose-600">{vps.error}</p>
            <p className="text-xs">Gere o token em <code className="rounded bg-muted px-1 font-mono">hpanel.hostinger.com</code> → Perfil → API</p>
          </div>
        ) : !vps?.configured ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p>Adicione <code className="rounded bg-muted px-1 font-mono text-xs">HOSTINGER_API_TOKEN</code> no <code className="rounded bg-muted px-1 font-mono text-xs">.env</code> para ver os dados da VPS.</p>
            <p className="text-xs">Gere em <code className="rounded bg-muted px-1 font-mono">hpanel.hostinger.com</code> → Perfil → API</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {[
              { label: "Plano",    value: vps.plan                },
              { label: "IP",       value: vps.ipv4                },
              { label: "OS",       value: vps.template            },
              { label: "Uptime",   value: fmtUptime(vps.uptimeSeconds), icon: Clock },
            ].map((item) => (
              <div key={item.label} className="bg-card px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Resource Gauges ─────────────────────────────────────────────────── */}
      {(loading || vps?.configured) && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* CPU */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CPU</p>
              </div>
              <span className="font-mono text-lg font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">—</span> : `${cpuPct.toFixed(1)}%`}
              </span>
            </div>
            <ProgressBar pct={cpuPct} tone={tone(cpuPct)} />
            <p className="mt-2 text-xs text-muted-foreground">
              {vps ? `${vps.cpus} vCPUs disponíveis` : "—"}
            </p>
          </motion.div>

          {/* RAM */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RAM</p>
              </div>
              <span className="font-mono text-lg font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">—</span> : `${ramPct.toFixed(0)}%`}
              </span>
            </div>
            <ProgressBar pct={ramPct} tone={tone(ramPct)} />
            <p className="mt-2 text-xs text-muted-foreground">
              {vps ? `${ramUsedGB.toFixed(1)} GB / ${ramTotalGB.toFixed(0)} GB` : "—"}
            </p>
          </motion.div>

          {/* Disco */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disco</p>
              </div>
              <span className="font-mono text-lg font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">—</span> : `${diskPct.toFixed(0)}%`}
              </span>
            </div>
            <ProgressBar pct={diskPct} tone={tone(diskPct)} />
            <p className="mt-2 text-xs text-muted-foreground">
              {vps ? `${diskUsedGB.toFixed(1)} GB / ${diskTotalGB.toFixed(0)} GB` : "—"}
            </p>
          </motion.div>
        </section>
      )}

      {/* ── Bandwidth Card ──────────────────────────────────────────────────── */}
      {(loading || vps?.configured) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Banda Mensal</p>
          </div>
          <p className="mt-2 font-display text-2xl font-bold">
            {loading ? <span className="animate-pulse text-muted-foreground">—</span> : `${bwTB} TB`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Limite mensal incluído no plano {vps?.plan ?? ""}</p>
        </motion.div>
      )}

      {/* ── Evolution Go ────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="border border-border bg-card shadow-sm"
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Evolution Go — WhatsApp</h2>
            {evolution?.configured && evolution.version && (
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">v{evolution.version}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !evolution?.configured ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p>Configure <code className="rounded bg-muted px-1 font-mono text-xs">EVOLUTION_API_URL</code> e <code className="rounded bg-muted px-1 font-mono text-xs">EVOLUTION_API_KEY</code> no <code className="rounded bg-muted px-1 font-mono text-xs">.env</code>.</p>
          </div>
        ) : evolution.error ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <XCircle className="h-8 w-8 text-rose-400 opacity-60" />
            <p className="text-sm font-medium text-rose-600">{evolution.error}</p>
            <p className="text-xs text-muted-foreground">Verifique a URL e a chave da Evolution API no .env</p>
          </div>
        ) : evolution.instances.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
            <WifiOff className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhuma instância criada ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {evolution.instances.map((inst) => (
              <li key={inst.name} className="flex items-center gap-4 px-4 py-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {inst.profilePicture ? (
                    <img src={inst.profilePicture} alt={inst.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                    inst.state === "open"       ? "bg-emerald-500"
                    : inst.state === "connecting" ? "bg-amber-400"
                    : "bg-zinc-400",
                  )} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{inst.name}</p>
                  {inst.profileName && (
                    <p className="truncate text-xs text-muted-foreground">{inst.profileName}</p>
                  )}
                  {inst.number && (
                    <p className="truncate font-mono text-[11px] text-muted-foreground">+{inst.number}</p>
                  )}
                </div>

                {/* Status */}
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  evoStateColor[inst.state] ?? "bg-zinc-100 text-zinc-500",
                )}>
                  {evoStateLabel[inst.state] ?? inst.state}
                </span>

                {/* Botão de teste — só aparece se conectado */}
                {inst.state === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 gap-1.5 px-2 text-[11px]"
                    disabled={sendingMsg === inst.name}
                    onClick={() => testSendMessage(inst.name)}
                  >
                    {sendingMsg === inst.name
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Send className="h-3 w-3" />
                    }
                    Testar envio
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* ── Supabase ────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Supabase</h2>
          {supa && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
              {supa.plan}
            </span>
          )}
          {supa && (
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{supa.region}</span>
          )}
        </div>

        {/* Gauges: DB, Storage, Connections, Users */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Database size */}
          <div className="border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Banco de Dados</p>
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {loading || !supa ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-1.5 w-full rounded bg-muted" />
              </div>
            ) : (() => {
              const pct = (supa.dbBytes / supa.limits.dbBytes) * 100;
              return (
                <>
                  <p className="mt-2 font-mono text-xl font-bold">{fmt(supa.dbBytes, "MB")} MB</p>
                  <ProgressBar pct={pct} tone={tone(pct)} />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    de {fmt(supa.limits.dbBytes, "MB")} MB ({pct.toFixed(1)}%)
                  </p>
                </>
              );
            })()}
          </div>

          {/* Storage */}
          <div className="border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Storage</p>
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {loading || !supa ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-1.5 w-full rounded bg-muted" />
              </div>
            ) : (() => {
              const pct = (supa.storageTotalBytes / supa.limits.storageBytes) * 100;
              const mb = supa.storageTotalBytes / 1048576;
              const limitGB = supa.limits.storageBytes / 1073741824;
              return (
                <>
                  <p className="mt-2 font-mono text-xl font-bold">{mb.toFixed(1)} MB</p>
                  <ProgressBar pct={pct} tone={tone(pct)} />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    de {limitGB} GB ({pct.toFixed(2)}%)
                  </p>
                </>
              );
            })()}
          </div>

          {/* Connections */}
          <div className="border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Conexões DB</p>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {loading || !supa ? (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-1.5 w-full rounded bg-muted" />
              </div>
            ) : (() => {
              const pct = (supa.totalConnections / supa.limits.connections) * 100;
              return (
                <>
                  <p className="mt-2 font-mono text-xl font-bold">{supa.totalConnections}</p>
                  <ProgressBar pct={pct} tone={tone(pct)} />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {supa.activeConnections} ativas · {supa.idleConnections} idle · limite {supa.limits.connections}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Auth users */}
          <div className="border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Usuários Auth</p>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {loading || !supa ? (
              <div className="mt-3 animate-pulse">
                <div className="h-8 w-12 rounded bg-muted" />
              </div>
            ) : (
              <>
                <p className="mt-2 font-mono text-3xl font-bold">{supa.authUsers}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">contas registradas</p>
              </>
            )}
          </div>
        </div>

        {/* Tables + Buckets side by side */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top tables */}
          <div className="border border-border bg-card shadow-sm">
            <header className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Tabelas — tamanho</h3>
              </div>
            </header>
            {loading || !supa ? (
              <div className="space-y-px">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse bg-muted/30" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {supa.tables.map((t) => {
                  const kb = (t.sizeBytes / 1024).toFixed(0);
                  const pct = supa.dbBytes > 0 ? (t.sizeBytes / supa.dbBytes) * 100 : 0;
                  return (
                    <li key={t.tableName} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">{t.tableName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {t.rowCount.toLocaleString("pt-BR")} linhas
                      </span>
                      <span className="shrink-0 w-14 text-right font-mono text-xs font-medium">{kb} kB</span>
                      <div className="w-16 h-1.5 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/40"
                          style={{ width: `${Math.min(100, pct * 10)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Storage buckets */}
          <div className="border border-border bg-card shadow-sm">
            <header className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Buckets de Storage</h3>
              </div>
            </header>
            {loading || !supa ? (
              <div className="space-y-px">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse bg-muted/30" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {supa.buckets.map((b) => {
                  const mb = (b.sizeBytes / 1048576).toFixed(2);
                  const pct = supa.limits.storageBytes > 0
                    ? (b.sizeBytes / supa.limits.storageBytes) * 100
                    : 0;
                  return (
                    <li key={b.bucket} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium">{b.bucket}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {b.fileCount} arquivo{b.fileCount !== 1 ? "s" : ""} · {mb} MB
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-violet-500/50"
                          style={{ width: `${Math.min(100, pct * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── API Health + Env Vars ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Health */}
        <section className="border border-border bg-card shadow-sm">
          <header className="border-b border-border p-4">
            <h2 className="font-semibold">Status das APIs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Resultado do último probe</p>
          </header>
          <ul className="divide-y divide-border">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-12 animate-pulse bg-muted/30" />)
              : apis.map((api) => (
                  <li key={api.name} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">{api.name}</span>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statusBadge(api.status))}>
                      <StatusIcon status={api.status} />
                      {statusLabel(api.status)}
                    </span>
                  </li>
                ))
            }
          </ul>
        </section>

        {/* Env vars */}
        <section className="border border-border bg-card shadow-sm">
          <header className="border-b border-border p-4">
            <h2 className="font-semibold">Variáveis de Ambiente</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Configuradas no .env</p>
          </header>
          <ul className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-12 animate-pulse bg-muted/30" />)
              : envVars.map((v) => (
                  <li key={v.key} className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-xs">{v.key}</span>
                    {v.ok
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Configurado</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><AlertCircle className="h-3 w-3" /> Ausente</span>
                    }
                  </li>
                ))
            }
          </ul>
        </section>
      </div>


    </div>
  );
}
