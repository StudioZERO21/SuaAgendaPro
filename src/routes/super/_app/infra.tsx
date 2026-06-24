import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server, Database, CheckCircle2, XCircle, AlertCircle, RefreshCw, HardDrive } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { withSuperToken } from "@/lib/super-client";
import { getInfraStats, type InfraStats } from "@/lib/super-infra.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/super/_app/infra")({
  ssr: false,
  head: () => ({ meta: [{ title: "Infraestrutura — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: InfraPage,
});

type ApiStatus = "ok" | "error" | "unconfigured";

function StatusIcon({ status }: { status: ApiStatus | "ok" }) {
  if (status === "ok")           return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "error")        return <XCircle      className="h-5 w-5 text-rose-500" />;
  return                                <AlertCircle  className="h-5 w-5 text-amber-400" />;
}

function statusLabel(s: ApiStatus | "ok") {
  return s === "ok" ? "Conectado" : s === "error" ? "Erro" : "Não configurado";
}

function statusBadge(s: ApiStatus | "ok") {
  return s === "ok"
    ? "bg-emerald-100 text-emerald-700"
    : s === "error"
    ? "bg-rose-100 text-rose-700"
    : "bg-amber-100 text-amber-700";
}

function InfraPage() {
  const [stats, setStats]     = useState<InfraStats | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getInfraStats({ data: withSuperToken() })
      .then(setStats)
      .catch((e) => toast.error("Erro ao carregar infra: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const apis = stats ? [
    { name: "Supabase",    status: stats.apiHealth.supabase  as ApiStatus | "ok" },
    { name: "Asaas",       status: stats.apiHealth.asaas     as ApiStatus | "ok" },
    { name: "Resend",      status: stats.apiHealth.resend    as ApiStatus | "ok" },
    { name: "Evolution",   status: stats.apiHealth.evolution as ApiStatus | "ok" },
  ] : [];

  const envVars = stats ? [
    { key: "ASAAS_API_KEY",    ok: stats.envConfigured.ASAAS_API_KEY    },
    { key: "RESEND_API_KEY",   ok: stats.envConfigured.RESEND_API_KEY   },
    { key: "EVOLUTION_API_URL",ok: stats.envConfigured.EVOLUTION_API_URL },
    { key: "EVOLUTION_API_KEY",ok: stats.envConfigured.EVOLUTION_API_KEY },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Sistema</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Infraestrutura</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Saúde das APIs, banco de dados e variáveis de ambiente.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {/* API Status */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-none border border-border bg-muted" />
            ))
          : apis.map((api, i) => (
              <motion.div
                key={api.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{api.name}</p>
                  <StatusIcon status={api.status} />
                </div>
                <span className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", statusBadge(api.status))}>
                  {statusLabel(api.status)}
                </span>
              </motion.div>
            ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Env vars */}
        <section className="border border-border bg-card shadow-sm">
          <header className="border-b border-border p-4">
            <h2 className="font-semibold">Variáveis de Ambiente</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configuradas no arquivo .env</p>
          </header>
          <ul className="divide-y divide-border">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-12 animate-pulse bg-muted/30" />)
              : envVars.map((v) => (
                  <li key={v.key} className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-xs">{v.key}</span>
                    {v.ok
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Configurado</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><AlertCircle className="h-3 w-3" /> Não configurado</span>
                    }
                  </li>
                ))
            }
          </ul>
        </section>

        {/* Storage */}
        <section className="border border-border bg-card shadow-sm">
          <header className="border-b border-border p-4">
            <h2 className="font-semibold">Storage (Buckets)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Supabase Storage</p>
          </header>
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Carregando…</p>
          ) : (stats?.storageBuckets?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
              <HardDrive className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhum bucket configurado</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats!.storageBuckets.map((b) => (
                <li key={b} className="flex items-center gap-3 px-4 py-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{b}</span>
                  <span className="ml-auto inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">bucket</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* DB Tables */}
      <section className="border border-border bg-card shadow-sm">
        <header className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Tabelas do Banco de Dados</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Contagem de registros por tabela</p>
        </header>
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Carregando…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Tabela</th>
                <th className="px-4 py-3 text-right font-semibold">Registros</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.tables ?? []).map((t) => (
                <tr key={t.name} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{t.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {t.rows < 0 ? <span className="text-muted-foreground">—</span> : t.rows.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
