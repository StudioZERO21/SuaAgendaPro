import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign, TrendingDown, AlertTriangle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { configureSuperFetch } from "@/lib/super-client";
import { getSuperAdminMetrics, getSuperAdminUsers, type SuperMetrics, type SuperUser } from "@/lib/super-admin.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/super/_app/financeiro")({
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

function FinanceiroPage() {
  const [metrics, setMetrics] = useState<SuperMetrics | null>(null);
  const [users, setUsers]     = useState<SuperUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureSuperFetch();
    Promise.all([
      getSuperAdminMetrics().catch((e) => { toast.error("Métricas: " + e.message); return null; }),
      getSuperAdminUsers().catch((e)   => { toast.error("Usuários: "  + e.message); return []; }),
    ]).then(([m, u]) => {
      if (m) setMetrics(m);
      setUsers((u ?? []).filter((u) => ["active", "overdue", "suspended"].includes(u.status)));
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: "MRR",           value: metrics ? fmt(metrics.mrr * 100) : "—", icon: DollarSign, color: "text-emerald-600" },
    { label: "Ativos pagantes", value: metrics ? String(metrics.activeUsers) : "—", icon: Users, color: "text-blue-600" },
    { label: "Inadimplentes", value: metrics ? String(metrics.suspendedUsers) : "—", icon: AlertTriangle, color: "text-orange-600" },
    { label: "Churn/mês",     value: metrics ? String(metrics.churnThisMonth) : "—", icon: TrendingDown, color: "text-rose-600" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="border-b border-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Receita</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Financeiro</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">MRR, assinantes e inadimplência da plataforma.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="border border-border bg-card shadow-sm">
        <header className="border-b border-border p-4">
          <h2 className="font-semibold">Assinantes com faturamento</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ativos, suspensos e inadimplentes</p>
        </header>
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando…</p>
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
    </div>
  );
}
