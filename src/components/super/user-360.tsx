import { useEffect, useState } from "react";
import { Ticket, Share2, DollarSign, CalendarClock, Mail, MessageSquare, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { withSuperToken } from "@/lib/super-client";
import { getUser360, type User360 as User360Data } from "@/lib/super-billing.functions";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  trial_3d: "Trial 3d", trial_1d: "Trial 1d", trial_expired: "Trial encerrado",
  billing_3d: "Fatura 3d", billing_1d: "Fatura 1d", suspended_overdue: "Suspensão",
};
const EVENT_LABEL: Record<string, string> = {
  payment_confirmed: "Pagamento", payment_received: "Pagamento", payment_overdue: "Vencido",
  subscription_created: "Assinatura criada", subscription_renewed: "Renovação",
};

function brl(c: number) { return `R$ ${(c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`; }
function fmt(iso: string | null) { return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function fmtDT(iso: string) { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

export function User360({ userId }: { userId: string }) {
  const [data, setData]     = useState<User360Data | null>(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    setLoad(true);
    getUser360({ data: withSuperToken({ userId }) })
      .then(setData).catch(() => {}).finally(() => setLoad(false));
  }, [userId]);

  if (loading) return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Carregando visão 360…</div>;
  if (!data)   return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem dados.</div>;

  const cards = [
    { label: "Dias p/ bloquear", value: data.daysToBlock === null ? "—" : `${data.daysToBlock}d`, icon: CalendarClock, tone: "text-amber-600" },
    { label: "Tickets abertos", value: `${data.ticketsOpen}/${data.ticketsTotal}`, icon: Ticket, tone: "text-blue-600" },
    { label: "Indicações", value: String(data.referralsCount), icon: Share2, tone: "text-violet-600" },
    { label: "Recebido de clientes", value: brl(data.clientPaidCents), icon: DollarSign, tone: "text-emerald-600", sub: `${data.clientPaidCount} pagto(s)` },
  ];

  return (
    <div className="space-y-4">
      {/* Assinatura */}
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span><span className="text-muted-foreground">Plano:</span> <strong>{data.planName}</strong></span>
          <span><span className="text-muted-foreground">Fim do trial:</span> {fmt(data.trialEndsAt)}</span>
          <span><span className="text-muted-foreground">Vencimento:</span> {fmt(data.currentPeriodEnd)}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-3.5 w-3.5", c.tone)} />
            </div>
            <p className="mt-1 font-display text-lg font-bold tabular-nums">{c.value}</p>
            {c.sub && <p className="text-[10px] text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Pagamentos recentes */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pagamentos da assinatura</p>
        {data.recentEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum evento.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.recentEvents.map((e, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm">
                <span>{EVENT_LABEL[e.type] ?? e.type}</span>
                <span className="text-xs text-muted-foreground">{e.amountCents > 0 ? brl(e.amountCents) + " · " : ""}{fmtDT(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notificações recentes */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notificações recentes</p>
        {data.recentNotifs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma notificação.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.recentNotifs.map((n, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm">
                <span className="flex items-center gap-1.5">
                  {n.channel === "email" ? <Mail className="h-3.5 w-3.5 text-muted-foreground" /> : <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                  {KIND_LABEL[n.kind] ?? n.kind}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {n.status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : n.status === "pending" ? <Hourglass className="h-3.5 w-3.5 text-amber-500" />
                    : <XCircle className="h-3.5 w-3.5 text-rose-500" />}
                  {fmtDT(n.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
