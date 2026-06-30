import { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldAlert, KeyRound, RefreshCw, CheckCircle2 } from "lucide-react";
import { withSuperToken } from "@/lib/super-client";
import { getProfessionalActivity } from "@/lib/activity.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof getProfessionalActivity>>[number];

const EVENT_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  login_success:  { label: "Login",                     cls: "bg-emerald-100 text-emerald-700", icon: LogIn },
  login_failed:   { label: "Senha errada",              cls: "bg-rose-100 text-rose-700",       icon: KeyRound },
  session_kicked: { label: "Sessão derrubada",          cls: "bg-amber-100 text-amber-700",     icon: ShieldAlert },
  logout:         { label: "Saiu",                      cls: "bg-zinc-100 text-zinc-500",       icon: LogOut },
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ProfessionalActivity({ email }: { email: string }) {
  const [rows, setRows]     = useState<Row[]>([]);
  const [loading, setLoad]  = useState(true);

  function load() {
    setLoad(true);
    getProfessionalActivity({ data: withSuperToken({ email, limit: 200 }) })
      .then(setRows).catch(() => setRows([])).finally(() => setLoad(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [email]);

  const lastLogin = rows.find((r) => r.event === "login_success");
  const failed24h = rows.filter((r) => r.event === "login_failed" && Date.now() - new Date(r.createdAt).getTime() < 86_400_000).length;
  const active7d  = lastLogin && Date.now() - new Date(lastLogin.createdAt).getTime() < 7 * 86_400_000;

  return (
    <div className="space-y-4 pt-1">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
          <p className={cn("mt-1 flex items-center gap-1 text-sm font-bold", active7d ? "text-emerald-600" : "text-muted-foreground")}>
            {active7d && <CheckCircle2 className="h-4 w-4" />}{active7d ? "Ativo" : "Inativo"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Último login</p>
          <p className="mt-1 text-xs font-medium">{lastLogin ? fmtDT(lastLogin.createdAt) : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Senha errada (24h)</p>
          <p className={cn("mt-1 text-sm font-bold", failed24h > 0 ? "text-rose-600" : "")}>{failed24h}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Histórico de acessos</p>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum acesso registrado ainda. Os logs aparecem a partir dos próximos logins.
        </div>
      ) : (
        <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto">
          {rows.map((r) => {
            const cfg = EVENT_CFG[r.event] ?? { label: r.event, cls: "bg-muted text-muted-foreground", icon: LogIn };
            return (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", cfg.cls)}>
                    <cfg.icon className="h-3 w-3" />{cfg.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[r.device, r.browser, r.os].filter((x) => x && x !== "—").join(" · ") || "—"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDT(r.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
