import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, CreditCard, RefreshCw } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listPaymentTransactions,
  syncMercadoPagoTransactions,
  updatePaymentTransactionStatus,
  type PaymentTransaction,
} from "@/lib/payments.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/transacoes")({
  head: () => ({
    meta: [
      { title: "Histórico de transações — SuaAgenda.Pro" },
      { name: "description", content: "Acompanhe transações Pix e Mercado Pago." },
    ],
  }),
  component: HistoricoTransacoesPage,
});

function centsToCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status: PaymentTransaction["status"]) {
  switch (status) {
    case "paid":
      return "Pago";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    case "refunded":
      return "Estornado";
    default:
      return "Pendente";
  }
}

function HistoricoTransacoesPage() {
  const navigate = useNavigate();
  const fetchTransactions = useServerFn(listPaymentTransactions);
  const updateStatus = useServerFn(updatePaymentTransactionStatus);
  const syncMp = useServerFn(syncMercadoPagoTransactions);
  const [rows, setRows] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        toast.message("Entre na conta para ver o histórico.");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchTransactions({ data: { limit: 100 } });
        if (active) setRows(data);
      } catch {
        toast.error("Não foi possível carregar o histórico.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchTransactions]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, tx) => {
        if (tx.status === "paid") acc.paid += tx.amount_cents;
        if (tx.status === "pending") acc.pending += tx.amount_cents;
        return acc;
      },
      { paid: 0, pending: 0 },
    );
  }, [rows]);

  async function markPaid(tx: PaymentTransaction) {
    try {
      const updated = await updateStatus({ data: { id: tx.id, status: "paid" } });
      setRows((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Status atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const result = await syncMp();
      if (result.unavailable) {
        toast.error("Mercado Pago indisponível no momento.");
        return;
      }
      const updated = await fetchTransactions({ data: { limit: 100 } });
      setRows(updated);
      toast.success(`${result.imported} transações sincronizadas.`);
    } catch {
      toast.error("Não foi possível sincronizar o Mercado Pago.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <MobileShell>
      <header className="flex items-center gap-2 px-5 pt-6">
        <button
          onClick={() => navigate({ to: "/pagamentos" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pagamentos
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight">Histórico</h1>
        </div>
      </header>

      <main className="mt-5 flex-1 space-y-5 px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recebido</p>
            <p className="mt-1 font-display text-xl font-bold text-emerald-700">{centsToCurrency(totals.paid)}</p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pendente</p>
            <p className="mt-1 font-display text-xl font-bold text-amber-700">{centsToCurrency(totals.pending)}</p>
          </section>
        </div>

        <Button variant="outline" onClick={sync} disabled={syncing} className="h-11 w-full rounded-2xl text-sm">
          <RefreshCw className="mr-2 h-4 w-4" /> {syncing ? "Sincronizando..." : "Sincronizar Mercado Pago"}
        </Button>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando transações...</p>
        ) : rows.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">Sem transações</p>
            <p className="mt-1 text-xs text-muted-foreground">Cobranças Pix e Mercado Pago serão listadas aqui.</p>
          </section>
        ) : (
          <div className="space-y-3">
            {rows.map((tx) => (
              <section key={tx.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold">{tx.client_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tx.service_name || (tx.method === "mercado_pago" ? "Mercado Pago" : "Pix manual")}</p>
                  </div>
                  <Badge className={tx.status === "paid" ? "bg-emerald-600" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                    {statusLabel(tx.status)}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-bold">{centsToCurrency(tx.amount_cents)}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(tx.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {tx.status !== "paid" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid(tx)} className="h-9 rounded-full text-xs">
                      <Check className="mr-1 h-3.5 w-3.5" /> Recebido
                    </Button>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </MobileShell>
  );
}