import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { configureSuperFetch } from "@/lib/super-client";
import { getAuditLog, type AuditLogEntry } from "@/lib/super-audit.functions";

export const Route = createFileRoute("/super/_app/auditoria")({
  ssr: false,
  head: () => ({ meta: [{ title: "Auditoria — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AuditoriaPage,
});

const ACTION_STYLES: Record<string, string> = {
  suspend_user:        "bg-rose-100   text-rose-700",
  unblock_user:        "bg-emerald-100 text-emerald-700",
  grant_especial:      "bg-violet-100  text-violet-700",
  cancel_subscription: "bg-zinc-100    text-zinc-500",
  change_plan:         "bg-blue-100    text-blue-700",
};
const ACTION_LABELS: Record<string, string> = {
  suspend_user:        "Suspenso",
  unblock_user:        "Reativado",
  grant_especial:      "Especial",
  cancel_subscription: "Cancelado",
  change_plan:         "Plano alterado",
};

const PAGE_SIZE = 20;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function AuditoriaPage() {
  const [entries, setEntries]   = useState<AuditLogEntry[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function load(p = 1) {
    setLoading(true);
    configureSuperFetch();
    getAuditLog({ data: { limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE } })
      .then(({ entries: e, total: t }) => { setEntries(e); setTotal(t); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(page); }, [page]);

  const filtered = useMemo(() => {
    if (!q.trim()) return entries;
    const term = q.toLowerCase();
    return entries.filter(
      (e) =>
        e.action.includes(term) ||
        (e.target_user_email ?? "").toLowerCase().includes(term) ||
        JSON.stringify(e.details).toLowerCase().includes(term),
    );
  }, [entries, q]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="border-b border-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Segurança</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Auditoria</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Histórico completo de ações executadas pelo super admin.</p>
      </header>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ação, e-mail…" className="pl-9" />
        </div>
        <p className="text-xs text-muted-foreground">{total} evento{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="border border-border bg-card">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground animate-pulse">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ShieldCheck className="h-10 w-10 opacity-20" />
            <p className="text-sm">Nenhum evento de auditoria encontrado.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Data/Hora</th>
                  <th className="px-4 py-3 text-left font-semibold">Ação</th>
                  <th className="px-4 py-3 text-left font-semibold">Usuário</th>
                  <th className="px-4 py-3 text-right font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <>
                    <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(e.performed_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", ACTION_STYLES[e.action] ?? "bg-zinc-100 text-zinc-500")}>
                          {ACTION_LABELS[e.action] ?? e.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{e.target_user_email || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {Object.keys(e.details ?? {}).length > 0 && (
                          <button
                            onClick={() => toggleExpand(e.id)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {expanded.has(e.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {expanded.has(e.id) ? "Ocultar" : "Ver"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded.has(e.id) && (
                      <tr key={`${e.id}-detail`} className="border-t border-border bg-muted/10">
                        <td colSpan={4} className="px-4 py-3">
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono">
                            {JSON.stringify(e.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
