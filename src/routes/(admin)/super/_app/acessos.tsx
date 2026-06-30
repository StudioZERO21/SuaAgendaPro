import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, RefreshCw, Download, Search, LogIn, LogOut, ShieldAlert, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/csv";
import { withSuperToken } from "@/lib/super-client";
import { getProfessionalActivity } from "@/lib/activity.functions";

export const Route = createFileRoute("/(admin)/super/_app/acessos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Acessos — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AcessosPage,
});

type Row = Awaited<ReturnType<typeof getProfessionalActivity>>[number];

const EVENT_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  login_success:  { label: "Login",            cls: "bg-emerald-100 text-emerald-700", icon: LogIn },
  login_failed:   { label: "Senha errada",     cls: "bg-rose-100 text-rose-700",       icon: KeyRound },
  session_kicked: { label: "Sessão derrubada", cls: "bg-amber-100 text-amber-700",     icon: ShieldAlert },
  logout:         { label: "Saiu",             cls: "bg-zinc-100 text-zinc-500",       icon: LogOut },
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AcessosPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent]     = useState("todos");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getProfessionalActivity({ data: withSuperToken({ event, limit: 800 }) }));
    } catch (e: any) { toast.error("Erro: " + (e?.message ?? "")); }
    finally { setLoading(false); }
  }, [event]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => (r.email ?? "").toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const counts = useMemo(() => ({
    logins:  rows.filter((r) => r.event === "login_success").length,
    falhas:  rows.filter((r) => r.event === "login_failed").length,
    kicks:   rows.filter((r) => r.event === "session_kicked").length,
  }), [rows]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Logs
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Acessos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Logins, senha errada e sessões — por aparelho/navegador (sem IP). Registrado na VPS.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={filtered.length === 0}
            onClick={() => downloadCSV(`acessos-${new Date().toISOString().slice(0,10)}`, filtered.map((r) => ({
              email: r.email ?? "", evento: EVENT_CFG[r.event]?.label ?? r.event,
              aparelho: r.device ?? "", navegador: r.browser ?? "", sistema: r.os ?? "",
              data: new Date(r.createdAt).toLocaleString("pt-BR"),
            })))}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-px overflow-hidden border border-border bg-border">
        {[
          { label: "Logins", value: counts.logins, tone: "text-emerald-600" },
          { label: "Senha errada", value: counts.falhas, tone: "text-rose-600" },
          { label: "Sessões derrubadas", value: counts.kicks, tone: "text-amber-600" },
        ].map((c) => (
          <div key={c.label} className="bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
            <p className={cn("mt-1 font-display text-2xl font-bold tabular-nums", c.tone)}>{loading ? "—" : c.value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[["todos","Todos"],["login_success","Login"],["login_failed","Senha errada"],["session_kicked","Sessão derrubada"],["logout","Saiu"]].map(([v, l]) => (
            <button key={v} onClick={() => setEvent(v)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                event === v ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-secondary")}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email" className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Email</span><span>Evento</span><span>Aparelho</span><span>Navegador / SO</span><span>Quando</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum acesso registrado.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const cfg = EVENT_CFG[r.event] ?? { label: r.event, cls: "bg-muted text-muted-foreground", icon: LogIn };
              return (
                <li key={r.id} className="grid grid-cols-1 gap-1 px-4 py-2.5 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] md:items-center">
                  <span className="truncate font-medium">{r.email ?? "—"}</span>
                  <span><span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", cfg.cls)}><cfg.icon className="h-3 w-3" />{cfg.label}</span></span>
                  <span className="text-xs text-muted-foreground">{r.device ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{[r.browser, r.os].filter((x) => x && x !== "—").join(" · ") || "—"}</span>
                  <span className="text-xs text-muted-foreground">{fmtDT(r.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
