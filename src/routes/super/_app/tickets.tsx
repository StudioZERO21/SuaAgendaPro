import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TicketCheck, Clock, AlertTriangle, CheckCircle2, XCircle, Search,
  RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon,
  MessageSquare, User, Calendar, Tag, Zap, TrendingUp, BarChart2,
  ArrowUpDown, ArrowDown, ArrowUp, X, ExternalLink,
  StickyNote, ArrowRightLeft, BarChart as BarChartIcon, Plus, Send,
} from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { withSuperToken } from "@/lib/super-client";
import {
  getSuperTickets, updateSuperTicket, getTicketStats,
  type SupportTicket, type TicketStats, type TicketNote,
} from "@/lib/super-tickets.functions";

export const Route = createFileRoute("/super/_app/tickets")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tickets — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TicketsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  open:         { label: "Aberto",           color: "bg-amber-100 text-amber-700",   icon: Clock        },
  in_progress:  { label: "Em atendimento",   color: "bg-blue-100 text-blue-700",     icon: Zap          },
  waiting_user: { label: "Aguard. usuário",  color: "bg-violet-100 text-violet-700", icon: MessageSquare},
  resolved:     { label: "Resolvido",        color: "bg-emerald-100 text-emerald-700",icon: CheckCircle2 },
  closed:       { label: "Encerrado",        color: "bg-zinc-100 text-zinc-500",     icon: XCircle      },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  low:      { label: "Baixa",    color: "bg-zinc-100 text-zinc-500"   },
  medium:   { label: "Média",    color: "bg-sky-100 text-sky-700"     },
  high:     { label: "Alta",     color: "bg-orange-100 text-orange-700"},
  critical: { label: "Crítico",  color: "bg-rose-100 text-rose-700"   },
};

const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug", billing: "Cobrança", feature: "Sugestão", other: "Outro",
};

const SLA_CFG = {
  ok:      { label: "No prazo",  color: "text-emerald-600", dot: "bg-emerald-500" },
  warning: { label: "Em risco",  color: "text-amber-600",   dot: "bg-amber-500"   },
  breached:{ label: "Vencido",   color: "text-rose-600",    dot: "bg-rose-500"    },
};

function fmtHours(h: number) {
  if (h < 1)  return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const PAGE_SIZE = 12;

// ─── Note timeline entry ──────────────────────────────────────────────────────

function NoteEntry({ note }: { note: TicketNote }) {
  const isStatus   = note.type === "status";
  const isPriority = note.type === "priority";
  const isNote     = note.type === "note";

  const icon = isStatus   ? <ArrowRightLeft className="h-3.5 w-3.5" />
              : isPriority ? <BarChartIcon className="h-3.5 w-3.5" />
              : <StickyNote className="h-3.5 w-3.5" />;

  const dotColor = isStatus   ? "bg-blue-500"
                 : isPriority ? "bg-orange-500"
                 : "bg-primary";

  const bgColor  = isStatus   ? "bg-blue-50 border-blue-100"
                 : isPriority ? "bg-orange-50 border-orange-100"
                 : "bg-card border-border";

  const textColor = isStatus   ? "text-blue-700"
                  : isPriority ? "text-orange-700"
                  : "text-foreground";

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm", dotColor)}>
          {icon}
        </div>
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      {/* Content */}
      <div className={cn("mb-3 flex-1 rounded-xl border p-3 text-sm", bgColor)}>
        <p className={cn("font-medium leading-snug", textColor)}>{note.content}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(note.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<SupportTicket>) => void;
}) {
  const [tab,         setTab]         = useState<"atendimento" | "historico">("atendimento");
  const [status,      setStatus]      = useState(ticket.status);
  const [priority,    setPriority]    = useState(ticket.priority);
  const [notes,       setNotes]       = useState<TicketNote[]>(ticket.notes ?? []);
  const [noteInput,   setNoteInput]   = useState("");
  const [addingNote,  setAddingNote]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [lightbox,    setLightbox]    = useState<string | null>(null);

  // Newest first
  const sortedNotes = useMemo(() => [...notes].reverse(), [notes]);
  const recentNotes = sortedNotes.slice(0, 2);

  const hasChanges = status !== ticket.status || priority !== ticket.priority;

  async function saveChanges() {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const result = await updateSuperTicket({
        data: withSuperToken({
          id:       ticket.id,
          status:   status !== ticket.status ? status : undefined,
          priority: priority !== ticket.priority ? priority : undefined,
        }),
      });
      const updatedNotes = (result as any)?.notes ?? notes;
      setNotes(updatedNotes);
      onUpdate(ticket.id, { status, priority, notes: updatedNotes });
      toast.success("Ticket atualizado!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!noteInput.trim()) return;
    setSaving(true);
    try {
      const result = await updateSuperTicket({
        data: withSuperToken({ id: ticket.id, noteContent: noteInput.trim() }),
      });
      const updatedNotes = (result as any)?.notes ?? notes;
      setNotes(updatedNotes);
      onUpdate(ticket.id, { notes: updatedNotes });
      setNoteInput("");
      setAddingNote(false);
      toast.success("Nota adicionada!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const sla = SLA_CFG[ticket.slaStatus];

  // ── Tab: Atendimento ─────────────────────────────────────────────────────────
  const tabAtendimento = (
    <div className="space-y-5">
      {/* User + Meta */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-semibold">{ticket.userName || "—"}</p>
            <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Aberto em</p>
            <p className="font-semibold">{fmtDate(ticket.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Categoria</p>
            <p className="font-semibold">{CATEGORY_LABEL[ticket.category] ?? ticket.category}</p>
          </div>
        </div>
      </div>

      {/* SLA */}
      <div className={cn("flex items-center justify-between rounded-xl border px-4 py-3",
        ticket.slaStatus === "ok"       && "border-emerald-200 bg-emerald-50",
        ticket.slaStatus === "warning"  && "border-amber-200 bg-amber-50",
        ticket.slaStatus === "breached" && "border-rose-200 bg-rose-50",
      )}>
        <div className="flex items-center gap-2">
          <span className={cn("flex h-2.5 w-2.5 rounded-full", sla.dot)} />
          <span className={cn("text-sm font-semibold", sla.color)}>SLA: {sla.label}</span>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">Resposta: </span>
            {ticket.firstResponseAt
              ? <span className="text-emerald-600 font-medium">{fmtHours(ticket.responseElapsedH)} ✓</span>
              : <span className={ticket.slaStatus === "breached" ? "text-rose-600 font-medium" : ""}>{fmtHours(ticket.responseElapsedH)} (em aberto)</span>
            }
          </span>
          {ticket.resolvedAt && (
            <span>
              <span className="font-medium text-foreground">Resolução: </span>
              {fmtHours((new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) / 3_600_000)}
            </span>
          )}
        </div>
      </div>

      {/* Subject + Description */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assunto</p>
        <p className="font-semibold text-base">{ticket.subject}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
        <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ocorreu em</p>
        <p className="text-sm">{fmtDate(ticket.occurredAt)}</p>
      </div>

      {/* Attachments */}
      {ticket.attachments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Anexos ({ticket.attachments.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {ticket.attachments.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightbox(url)}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted/30 transition hover:ring-2 hover:ring-primary"
              >
                <img src={url} alt={`Anexo ${i + 1}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20">
                  <ExternalLink className="h-4 w-4 text-white opacity-0 transition hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status + Priority */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_CFG).map(([s, cfg]) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold transition",
                  status === s ? cfg.color + " ring-2 ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >{cfg.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prioridade</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PRIORITY_CFG).map(([p, cfg]) => (
              <button key={p} onClick={() => setPriority(p)}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold transition",
                  priority === p ? cfg.color + " ring-2 ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >{cfg.label}</button>
            ))}
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button size="sm" onClick={saveChanges} disabled={saving} className="gradient-primary text-white shadow-glow">
            {saving ? "Salvando…" : "Salvar status / prioridade"}
          </Button>
        </div>
      )}

      {/* Recent notes preview (2 most recent) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Última atividade
            {notes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">{notes.length}</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {notes.length > 2 && (
              <button
                onClick={() => setTab("historico")}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Ver histórico completo →
              </button>
            )}
            <Button size="sm" variant="outline" onClick={() => setAddingNote((v) => !v)} className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Adicionar nota
            </Button>
          </div>
        </div>

        {/* New note input */}
        {addingNote && (
          <div className="mb-3 flex gap-2">
            <Textarea
              autoFocus
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Escreva uma nota interna… (Ctrl+Enter para enviar)"
              rows={3}
              className="flex-1 rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote();
                if (e.key === "Escape") { setAddingNote(false); setNoteInput(""); }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleAddNote} disabled={saving || !noteInput.trim()} className="gradient-primary text-white shadow-glow h-8 w-8 p-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAddingNote(false); setNoteInput(""); }} className="h-8 w-8 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          {recentNotes.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Nenhuma ação registrada ainda.
            </p>
          ) : (
            <div>
              {recentNotes.map((n, i) => (
                <div key={n.id} className={cn(i === recentNotes.length - 1 && "[&>div>div:last-child>div]:hidden")}>
                  <NoteEntry note={n} />
                </div>
              ))}
              {notes.length > 2 && (
                <button
                  onClick={() => setTab("historico")}
                  className="mt-1 w-full rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  + {notes.length - 2} entrada{notes.length - 2 > 1 ? "s" : ""} mais antiga{notes.length - 2 > 1 ? "s" : ""} — ver histórico completo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Tab: Histórico ───────────────────────────────────────────────────────────
  const tabHistorico = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length === 0
            ? "Nenhuma ação registrada."
            : `${notes.length} entrada${notes.length > 1 ? "s" : ""} — mais recentes primeiro`}
        </p>
        <Button size="sm" variant="outline" onClick={() => setAddingNote((v) => !v)} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Adicionar nota
        </Button>
      </div>

      {addingNote && (
        <div className="flex gap-2">
          <Textarea
            autoFocus
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Escreva uma nota interna… (Ctrl+Enter para enviar)"
            rows={3}
            className="flex-1 rounded-xl text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote();
              if (e.key === "Escape") { setAddingNote(false); setNoteInput(""); }
            }}
          />
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={handleAddNote} disabled={saving || !noteInput.trim()} className="gradient-primary text-white shadow-glow h-8 w-8 p-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAddingNote(false); setNoteInput(""); }} className="h-8 w-8 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        {sortedNotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
        ) : (
          <div>
            {sortedNotes.map((n, i) => (
              <div key={n.id} className={cn(i === sortedNotes.length - 1 && "[&>div>div:last-child>div]:hidden")}>
                <NoteEntry note={n} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TicketCheck className="h-4 w-4 text-primary" />
            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-border">
          {(["atendimento", "historico"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setAddingNote(false); }}
              className={cn(
                "relative px-4 py-2.5 text-sm font-semibold capitalize transition",
                tab === t
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "atendimento" ? "Atendimento" : (
                <span className="inline-flex items-center gap-1.5">
                  Histórico
                  {notes.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{notes.length}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-1 py-4">
          {tab === "atendimento" ? tabAtendimento : tabHistorico}
        </div>

        <div className="shrink-0 flex justify-end border-t border-border pt-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
            <button className="absolute right-4 top-4 text-white hover:text-white/70" onClick={() => setLightbox(null)}>
              <X className="h-7 w-7" />
            </button>
            <img src={lightbox} alt="Anexo" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats,   setStats]   = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortField, setSortField] = useState<"createdAt" | "priority" | "slaStatus">("createdAt");
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("desc");
  const [page,     setPage]    = useState(1);
  const [viewing,  setViewing] = useState<SupportTicket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        getSuperTickets({ data: withSuperToken() }),
        getTicketStats({ data: withSuperToken() }),
      ]);
      setTickets(t);
      setStats(s);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tickets
      .filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (term && !t.subject.toLowerCase().includes(term) && !t.userEmail.toLowerCase().includes(term) && !t.userName.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const sOrder = { breached: 0, warning: 1, ok: 2 };
        if (sortField === "priority") {
          const diff = (pOrder[a.priority as keyof typeof pOrder] ?? 2) - (pOrder[b.priority as keyof typeof pOrder] ?? 2);
          return sortDir === "asc" ? diff : -diff;
        }
        if (sortField === "slaStatus") {
          const diff = (sOrder[a.slaStatus]) - (sOrder[b.slaStatus]);
          return sortDir === "asc" ? diff : -diff;
        }
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === "asc" ? diff : -diff;
      });
  }, [tickets, q, statusFilter, priorityFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }

  function handleUpdate(id: string, patch: Partial<SupportTicket>) {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  }

  const s = stats;

  // KPI cards
  const KPIS = [
    { label: "Total",           value: s?.total ?? 0,       icon: TicketCheck,  tone: "text-primary"       },
    { label: "Abertos",         value: (s?.open ?? 0) + (s?.inProgress ?? 0), icon: Clock, tone: "text-amber-600"     },
    { label: "SLA Vencido",     value: s?.slaBreached ?? 0, icon: AlertTriangle,tone: "text-rose-600"       },
    { label: "Resolvidos",      value: (s?.resolved ?? 0) + (s?.closed ?? 0),  icon: CheckCircle2, tone: "text-emerald-600"  },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Suporte</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão completa dos chamados de suporte com SLA.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border xl:grid-cols-4">
        {KPIS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex flex-col gap-3 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.tone)} />
            </div>
            <p className="font-display text-3xl font-bold tabular-nums">
              {loading ? <span className="animate-pulse text-muted-foreground">—</span> : c.value}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Charts + Monthly summary */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart — 14 dias */}
        <motion.article
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <header className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Últimos 14 dias</p>
              <h2 className="mt-1 font-display text-lg font-bold">Tickets abertos vs resolvidos</h2>
            </div>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </header>
          {s && s.byDay.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => fmtShort(v + "T00:00:00")} tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 11 }}
                    formatter={(v: number, name: string) => [v, name === "abertos" ? "Abertos" : "Resolvidos"]}
                  />
                  <Bar dataKey="abertos"    fill="#f59e0b" radius={[3, 3, 0, 0]} name="abertos" />
                  <Bar dataKey="resolvidos" fill="#10b981" radius={[3, 3, 0, 0]} name="resolvidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Carregando…" : "Sem dados"}
            </div>
          )}
          <ul className="mt-3 flex gap-4">
            <li className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span>Abertos</span></li>
            <li className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span>Resolvidos</span></li>
          </ul>
        </motion.article>

        {/* Monthly summary */}
        <motion.article
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
          className="border border-border bg-card p-5 shadow-sm"
        >
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Este mês</p>
              <h2 className="mt-1 font-display text-lg font-bold">Resumo mensal</h2>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </header>
          {s ? (
            <ul className="space-y-3">
              {[
                { label: "Tickets abertos",    value: String(s.thisMonth.total)                                       },
                { label: "Resolvidos",         value: `${s.thisMonth.resolved} (${s.thisMonth.openRate}%)`            },
                { label: "Tempo médio resposta", value: s.thisMonth.avgResponseH > 0 ? fmtHours(s.thisMonth.avgResponseH) : "—" },
                { label: "SLA vencido",        value: String(s.thisMonth.slaBreached),
                  warn: s.thisMonth.slaBreached > 0 },
                { label: "Tempo médio resolução", value: s.avgResolutionH > 0 ? fmtHours(s.avgResolutionH) : "—"    },
              ].map((item) => (
                <li key={item.label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn("text-sm font-bold", item.warn && "text-rose-600")}>{item.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{loading ? "Carregando…" : "—"}</p>
          )}

          {/* By category */}
          {s && s.byCategory.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Por categoria</p>
              <ul className="space-y-1.5">
                {s.byCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.round((c.count / s.total) * 60)}px` }} />
                      <span className="font-semibold tabular-nums w-4 text-right">{c.count}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.article>
      </section>

      {/* Ticket list */}
      <div className="rounded-2xl border border-border bg-card shadow-card">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por assunto, usuário…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "open", "in_progress", "waiting_user", "resolved", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {s === "all" ? "Todos" : (STATUS_CFG[s]?.label ?? s)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setPriorityFilter(p); setPage(1); }}
                className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                  priorityFilter === p
                    ? p === "all" ? "bg-primary text-primary-foreground" : (PRIORITY_CFG[p]?.color ?? "bg-primary text-primary-foreground") + " ring-1 ring-offset-1"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {p === "all" ? "Todas" : (PRIORITY_CFG[p]?.label ?? p)}
              </button>
            ))}
          </div>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Usuário</th>
                <th className="px-4 py-3 text-left font-semibold">Assunto</th>
                <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th className="cursor-pointer px-4 py-3 text-left font-semibold select-none hover:text-foreground" onClick={() => toggleSort("priority")}>
                  <span className="inline-flex items-center gap-1">Prioridade <SortIcon field="priority" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="cursor-pointer px-4 py-3 text-left font-semibold select-none hover:text-foreground" onClick={() => toggleSort("slaStatus")}>
                  <span className="inline-flex items-center gap-1">SLA <SortIcon field="slaStatus" /></span>
                </th>
                <th className="cursor-pointer px-4 py-3 text-left font-semibold select-none hover:text-foreground" onClick={() => toggleSort("createdAt")}>
                  <span className="inline-flex items-center gap-1">Data <SortIcon field="createdAt" /></span>
                </th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => {
                const sc  = STATUS_CFG[t.status]   ?? STATUS_CFG.open;
                const pc  = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.medium;
                const sla = SLA_CFG[t.slaStatus];
                const StatusIcon = sc.icon;
                return (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.userName || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{t.userEmail}</p>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate font-medium">{t.subject}</p>
                      {t.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <ImageIcon className="h-3 w-3" /> {t.attachments.length} anexo{t.attachments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{CATEGORY_LABEL[t.category] ?? t.category}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", pc.color)}>{pc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", sc.color)}>
                        <StatusIcon className="h-3 w-3" />{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", sla.color)}>
                        <span className={cn("h-2 w-2 rounded-full", sla.dot)} />{sla.label}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{fmtHours(t.responseElapsedH)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtShort(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setViewing(t)}>
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && <p className="p-8 text-center text-sm text-muted-foreground">Carregando…</p>}
        {!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum ticket encontrado.</p>}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> de <span className="font-semibold text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("h-8 min-w-8 rounded-md px-2 text-xs font-semibold", safePage === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{i + 1}</button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {viewing && (
        <TicketDetailModal
          ticket={viewing}
          onClose={() => setViewing(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
