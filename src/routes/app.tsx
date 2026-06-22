import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CalendarDays, ChevronLeft, ChevronRight, Filter, LayoutGrid,
  ListChecks, MessageCircle, MoreHorizontal, Plus, Sparkles, Check,
  Clock, X, Search, Loader2, User,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationsModal } from "@/components/notifications-modal";
import { useNotifications } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAvailableSlots } from "@/lib/availability";
import {
  useAgendamentos, useAgendamentosRealtime, useCreateAgendamento,
  useUpdateStatus, useCancelAgendamento,
  type UIAppointment, type UIStatus,
} from "@/hooks/useAgendamentos";
import { useClientes, useCreateCliente, type UIClient } from "@/hooks/useClientes";
import { useServices, formatPrice, formatDuration } from "@/hooks/useServicos";
import { useWorkingHours, useBlockedDates } from "@/hooks/useHorarios";
import type { Service } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Agenda — SuaAgenda.Pro" },
      { name: "description", content: "Sua agenda do dia." },
    ],
  }),
  component: AgendaPage,
});

// ── Constants ─────────────────────────────────────────────────

const weekdayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const statusFilters: Array<{ key: "todos" | UIStatus; label: string; dot: string }> = [
  { key: "todos",     label: "Todos",      dot: "bg-primary"    },
  { key: "pendente",  label: "Pendentes",  dot: "bg-amber-400"  },
  { key: "confirmado",label: "Confirmados",dot: "bg-emerald-500"},
  { key: "concluido", label: "Concluídos", dot: "bg-sky-500"    },
  { key: "cancelado", label: "Cancelados", dot: "bg-zinc-400"   },
];

export function statusMeta(s: UIStatus) {
  switch (s) {
    case "confirmado": return { label: "Confirmado", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" };
    case "pendente":   return { label: "Pendente",   color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-400"  };
    case "concluido":  return { label: "Concluído",  color: "text-sky-700",     bg: "bg-sky-100",     dot: "bg-sky-500"    };
    case "cancelado":  return { label: "Cancelado",  color: "text-zinc-600",    bg: "bg-zinc-100",    dot: "bg-zinc-400"   };
  }
}

function todayMonday() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Lookup maps type ──────────────────────────────────────────

type DataMaps = {
  clientMap: Map<string, UIClient>;
  serviceMap: Map<string, Service>;
};

// ── Page ─────────────────────────────────────────────────────

function AgendaPage() {
  const [view, setView]               = useState<"timeline" | "grade">("timeline");
  const [notifOpen, setNotifOpen]     = useState(false);
  const [period, setPeriod]           = useState<"dia" | "semana" | "mes">("dia");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | UIStatus>("todos");
  const [detailAppt, setDetailAppt]   = useState<UIAppointment | null>(null);
  const [sheetOpen, setSheetOpen]     = useState(false);

  const { unreadCount } = useNotifications();

  const today          = useMemo(() => new Date(), []);
  const todayIdx       = (today.getDay() + 6) % 7;
  const [weekOffset, setWeekOffset]       = useState(0);
  const [activeDateIdx, setActiveDateIdx] = useState(todayIdx);

  const monday = useMemo(() => {
    const d = todayMonday();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const week = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }), [monday]);

  // ── Data ──────────────────────────────────────────────────
  const { data: appts   = [], isLoading: loadingAppts } = useAgendamentos();
  const { data: clients = [] }                           = useClientes();
  const { data: services = [] }                          = useServices();

  useAgendamentosRealtime();

  const clientMap  = useMemo(() => new Map(clients.map((c) => [c.id, c])),  [clients]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const maps: DataMaps = { clientMap, serviceMap };

  // ── Filters ───────────────────────────────────────────────
  const selectedDateStr = (() => {
    const d = week[activeDateIdx];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const filtered = useMemo(() => {
    return appts.filter((a) => {
      if (period === "dia" && a.date !== selectedDateStr) return false;
      if (selectedStatus !== "todos" && a.status !== selectedStatus) return false;
      return true;
    });
  }, [appts, period, selectedDateStr, selectedStatus]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.start.localeCompare(b.start)), [filtered]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { todos: 0, pendente: 0, confirmado: 0, concluido: 0, cancelado: 0 };
    const source = period === "dia"
      ? appts.filter((a) => a.date === selectedDateStr)
      : appts;
    source.forEach((a) => { base.todos++; base[a.status] = (base[a.status] ?? 0) + 1; });
    return base;
  }, [appts, period, selectedDateStr]);

  return (
    <TooltipProvider delayDuration={100}>
      <MobileShell withNav>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 pb-5 pt-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
              <h1 className="font-display mt-1 text-4xl font-bold leading-tight text-gradient">Agenda</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card"
                aria-label="Notificações"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-glow">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white shadow-glow">
                S
              </div>
            </div>
          </div>

          {/* View toggle */}
          <div className="px-6 pb-4">
            <div className="inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-card">
              {([
                { id: "timeline", label: "Timeline", icon: ListChecks },
                { id: "grade",    label: "Grade",    icon: LayoutGrid  },
              ] as const).map((v) => {
                const active = view === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={cn(
                      "relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200",
                      active ? "text-background" : "text-muted-foreground",
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="view-pill"
                        className="absolute inset-0 rounded-xl bg-foreground shadow-soft"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <v.icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Date strip */}
        <div className="mt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-card">
              <button
                onClick={() => { setWeekOffset((w) => w - 1); setActiveDateIdx(0); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setWeekOffset(0); setActiveDateIdx(todayIdx); setPeriod("dia"); }}
                className="flex flex-1 items-center justify-center gap-2 text-sm font-bold"
              >
                {weekOffset === 0 ? "Hoje" : (() => {
                  const s = monday;
                  const e = week[6];
                  return s.getMonth() === e.getMonth()
                    ? s.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                    : `${s.toLocaleDateString("pt-BR", { month: "short" })} / ${e.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
                })()}
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setWeekOffset((w) => w + 1); setActiveDateIdx(0); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => setSheetOpen(true)}
              className="h-12 rounded-2xl gradient-primary px-5 text-sm font-bold shadow-glow"
            >
              <Plus className="mr-1.5 h-[18px] w-[18px]" /> Novo
            </Button>
          </div>

          {/* Week strip */}
          <div className="mt-5 grid grid-cols-7 gap-2">
            {week.map((d, i) => {
              const active = i === activeDateIdx;
              const dayApptCount = appts.filter((a) => a.date === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`).length;
              return (
                <button
                  key={i}
                  onClick={() => { setActiveDateIdx(i); setPeriod("dia"); }}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-full text-center transition-all",
                    active ? "gradient-primary text-white shadow-glow" : "border border-border bg-card/60 backdrop-blur-sm shadow-card",
                  )}
                >
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mb-[-2px]", active ? "text-white/80" : "text-muted-foreground")}>
                    {weekdayLabels[i]}
                  </span>
                  <span className={cn("font-display text-2xl font-bold leading-none mt-[-2px]", active ? "text-white" : "text-foreground")}>
                    {d.getDate()}
                  </span>
                  {dayApptCount > 0 && (
                    <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", active ? "bg-white/70" : "bg-primary")} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Period + Status filters */}
        <div className="mt-5 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Período
          </div>
          <div className="inline-flex rounded-full bg-secondary p-1">
            {(["dia", "semana", "mes"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-colors duration-200",
                  period === p ? "text-white" : "text-muted-foreground",
                )}
              >
                {period === p && (
                  <motion.div
                    layoutId="period-pill"
                    className="absolute inset-0 rounded-full gradient-primary shadow-glow"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{p === "mes" ? "Mês" : p === "dia" ? "Dia" : "Semana"}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Status
          </div>
        </div>

        {/* Status chips */}
        <div className="mt-5 px-6">
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {statusFilters.map((s) => {
              const active = selectedStatus === s.key;
              const count  = counts[s.key] ?? 0;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedStatus(s.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                    active ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-card text-foreground",
                  )}
                >
                  {s.key !== "todos" && (
                    <span className={cn("h-2 w-2 rounded-full", active ? "bg-white" : s.dot)} />
                  )}
                  {s.label}
                  <span className={cn("rounded-full px-2 text-[10px] font-bold", active ? "bg-white/25 text-white" : "bg-secondary text-secondary-foreground")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="mt-7 flex-1 px-6 pb-8">
          {loadingAppts && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loadingAppts && sorted.length === 0 && (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-soft text-primary">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="font-display text-xl font-semibold">Nenhum agendamento</p>
              <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie um novo.</p>
              <Button onClick={() => setSheetOpen(true)} className="mt-1 h-11 rounded-2xl gradient-primary px-5 shadow-glow">
                <Plus className="mr-1 h-4 w-4" /> Novo agendamento
              </Button>
            </div>
          )}

          {!loadingAppts && sorted.length > 0 && (
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-gradient">
                {period === "dia" ? "Agendamentos do dia" : period === "semana" ? "Esta semana" : "Este mês"}
              </p>
              <span className="text-xs font-bold text-muted-foreground">{sorted.length} agendamento{sorted.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {view === "timeline" ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-3"
              >
                {sorted.map((a, i) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    delay={i * 0.05}
                    isLast={i === sorted.length - 1}
                    maps={maps}
                    onOpenDetail={() => setDetailAppt(a)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="grade"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={sorted.length === 0 ? "mt-6" : ""}
              >
                <GradeView
                  appointments={period === "semana" ? appts : sorted}
                  period={period}
                  week={week}
                  activeDateIdx={activeDateIdx}
                  maps={maps}
                  onSelectDay={(i) => { setActiveDateIdx(i); }}
                  onChangePeriod={setPeriod}
                  onOpenAppointment={(a) => setDetailAppt(a)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav />

        <NewAppointmentSheet open={sheetOpen} onOpenChange={setSheetOpen} />
        <AppointmentDetailSheet
          appointment={detailAppt}
          maps={maps}
          onOpenChange={(o) => !o && setDetailAppt(null)}
          onStatusChange={() => setDetailAppt(null)}
        />
        <NotificationsModal open={notifOpen} onOpenChange={setNotifOpen} />
      </MobileShell>
    </TooltipProvider>
  );
}

// ── Appointment Card ──────────────────────────────────────────

function AppointmentCard({
  appointment: a, delay = 0, isLast = false, maps, onOpenDetail,
}: {
  appointment: UIAppointment;
  delay?: number;
  isLast?: boolean;
  maps: DataMaps;
  onOpenDetail: () => void;
}) {
  const client  = maps.clientMap.get(a.clientId);
  const service = maps.serviceMap.get(a.serviceId);
  const meta    = statusMeta(a.status);
  const isDone  = a.status === "concluido";
  const [open, setOpen] = useState(false);

  const phone    = client?.phone?.replace(/\D/g, "") ?? "";
  const waMsg    = `Olá ${client?.name ?? ""}! Confirmando seu horário de ${service?.name ?? ""} às ${a.start}.`;
  const waUrl    = `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={cn("flex gap-3", isDone && "opacity-55 saturate-50")}
    >
      <div className="flex w-8 flex-col items-center shrink-0">
        <div className={cn("relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-glow ring-2 ring-background shrink-0", isDone ? "bg-zinc-400" : "gradient-primary")}>
          <Clock className="h-3.5 w-3.5" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gradient-to-b from-primary/30 via-border to-transparent min-h-[12px]" />}
      </div>

      <div className={cn("relative flex-1 overflow-hidden rounded-xl border shadow-card backdrop-blur-md", isDone ? "border-zinc-200/60 bg-white/30" : "border-white/40 bg-white/60")}>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="flex flex-col items-center text-center min-w-[2.75rem] shrink-0">
            <span className="font-display text-sm font-bold text-foreground leading-none">{a.start}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{a.durationMinutes}m</span>
          </div>
          <div className="h-9 w-px bg-border/70" />
          <div
            className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-soft", isDone && "grayscale")}
            style={isDone ? { background: "#a1a1aa" } : { background: `linear-gradient(135deg, ${client?.color ?? "#ec4899"}, var(--primary))` }}
          >
            {client?.initials ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold leading-tight text-foreground truncate">{client?.name ?? "—"}</p>
            <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.bg, meta.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all", open ? "gradient-primary border-transparent text-white shadow-glow rotate-45" : isDone ? "border-zinc-200 bg-zinc-100 text-zinc-400" : "border-border bg-secondary text-foreground")}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
              <div className="border-t border-border/60 px-3 py-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <Detail label="Serviço"  value={service?.name ?? "—"} />
                  <Detail label="Horário"  value={`${a.start} – ${a.end}`} />
                  <Detail label="Telefone" value={client?.phone ?? "—"} />
                  <Detail label="Valor"    value={formatPrice(a.priceCents)} highlight />
                </div>
                <div className="mt-3 flex gap-2">
                  {phone && (
                    <a href={waUrl} target="_blank" rel="noreferrer" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-soft transition hover:bg-emerald-600">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <button onClick={onOpenDetail} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-sm font-bold", highlight ? "text-gradient text-base" : "text-foreground")}>{value}</p>
    </div>
  );
}

// ── Grade View ────────────────────────────────────────────────

function GradeView({
  appointments, period, week, activeDateIdx, maps, onSelectDay, onChangePeriod, onOpenAppointment,
}: {
  appointments: UIAppointment[];
  period: "dia" | "semana" | "mes";
  week: Date[];
  activeDateIdx: number;
  maps: DataMaps;
  onSelectDay: (i: number) => void;
  onChangePeriod: (p: "dia" | "semana" | "mes") => void;
  onOpenAppointment: (a: UIAppointment) => void;
}) {
  const activeDate = week[activeDateIdx];
  const activeDateStr = `${activeDate.getFullYear()}-${String(activeDate.getMonth()+1).padStart(2,"0")}-${String(activeDate.getDate()).padStart(2,"0")}`;

  return (
    <div className="space-y-4">
      <StatusLegend />
      {period === "semana" ? (
        <WeekGrid appointments={appointments} week={week} activeDateIdx={activeDateIdx} maps={maps} onSelectDay={onSelectDay} onOpenAppointment={onOpenAppointment} />
      ) : period === "mes" ? (
        <MonthGrid appointments={appointments} onPickDay={(d) => { const idx = week.findIndex((w) => w.toDateString() === d.toDateString()); if (idx >= 0) onSelectDay(idx); onChangePeriod("dia"); }} />
      ) : (
        <DayGrid appointments={appointments.filter((a) => a.date === activeDateStr)} maps={maps} onOpenAppointment={onOpenAppointment} />
      )}
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-border bg-card/60 px-3 py-2 shadow-card backdrop-blur-md">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legenda</span>
      {(["confirmado", "pendente", "concluido", "cancelado"] as UIStatus[]).map((s) => {
        const m = statusMeta(s);
        return (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", m.dot)} />
            <span className="text-[11px] font-semibold text-foreground">{m.label.slice(0,5)}.</span>
          </span>
        );
      })}
    </div>
  );
}

function DayGrid({ appointments, maps, onOpenAppointment }: { appointments: UIAppointment[]; maps: DataMaps; onOpenAppointment: (a: UIAppointment) => void }) {
  const startHour = 7; const endHour = 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const pxPerHour = 72;

  const items = appointments.map((a) => {
    const [h, m] = a.start.split(":").map(Number);
    const [eh, em] = a.end.split(":").map(Number);
    const top    = ((h - startHour) * 60 + m) * (pxPerHour / 60);
    const height = Math.max(36, ((eh - h) * 60 + (em - m)) * (pxPerHour / 60) - 4);
    return { a, top, height };
  });

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-3 shadow-card">
      <div className="relative" style={{ height: hours.length * pxPerHour }}>
        {hours.map((h, i) => (
          <div key={h} className="absolute left-0 right-0 flex items-start gap-3" style={{ top: i * pxPerHour, height: pxPerHour }}>
            <span className="w-10 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{String(h).padStart(2,"0")}:00</span>
            <div className="mt-1.5 h-px flex-1 bg-border/60" />
          </div>
        ))}
        <div className="absolute inset-0 pl-[3.25rem] pr-1">
          {items.map(({ a, top, height }, i) => {
            const client  = maps.clientMap.get(a.clientId);
            const service = maps.serviceMap.get(a.serviceId);
            const meta    = statusMeta(a.status);
            return (
              <motion.button key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => onOpenAppointment(a)}
                className={cn("absolute left-0 right-0 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1.5 text-left shadow-card backdrop-blur-md transition-all active:scale-[0.98]", a.status === "concluido" ? "border-zinc-200/60 bg-white/30 opacity-55 saturate-50" : "border-white/40 bg-white/70")}
                style={{ top, height }}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-1 shrink-0 rounded-full", meta.dot)} style={{ height: Math.max(20, height - 16) }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-bold leading-tight text-foreground truncate">{client?.name ?? "—"}</p>
                    <p className="truncate text-[10px] font-semibold text-muted-foreground">{a.start}–{a.end} · {service?.name ?? "—"}</p>
                  </div>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      {appointments.length === 0 && <p className="py-8 text-center text-xs font-semibold text-muted-foreground">Sem horários neste dia.</p>}
    </div>
  );
}

function WeekGrid({ appointments, week, activeDateIdx, maps, onSelectDay, onOpenAppointment }: {
  appointments: UIAppointment[]; week: Date[]; activeDateIdx: number; maps: DataMaps;
  onSelectDay: (i: number) => void; onOpenAppointment: (a: UIAppointment) => void;
}) {
  const today = new Date();
  const byDay: UIAppointment[][] = Array.from({ length: 7 }, () => []);
  appointments.forEach((a) => {
    const idx = week.findIndex((w) => {
      const ws = `${w.getFullYear()}-${String(w.getMonth()+1).padStart(2,"0")}-${String(w.getDate()).padStart(2,"0")}`;
      return ws === a.date;
    });
    if (idx >= 0) byDay[idx].push(a);
  });
  byDay.forEach((arr) => arr.sort((a, b) => a.start.localeCompare(b.start)));

  return (
    <div className="space-y-2.5">
      {week.map((d, i) => {
        const dayAppts = byDay[i];
        const isToday  = d.toDateString() === today.toDateString();
        const isActive = i === activeDateIdx;
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={cn("overflow-hidden rounded-2xl border shadow-card backdrop-blur-md", isActive ? "border-primary/40 bg-white/70" : "border-border bg-card/60")}
          >
            <button onClick={() => onSelectDay(i)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
              <div className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl", isToday ? "gradient-primary text-white shadow-glow" : "bg-secondary text-foreground")}>
                <span className={cn("text-[9px] font-bold uppercase tracking-wider leading-none", isToday ? "text-white/85" : "text-muted-foreground")}>{weekdayLabels[i]}</span>
                <span className="font-display text-base font-bold leading-none mt-0.5">{d.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">{d.toLocaleDateString("pt-BR", { weekday: "long" })}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{dayAppts.length === 0 ? "Sem agendamentos" : `${dayAppts.length} agendamento${dayAppts.length > 1 ? "s" : ""}`}</p>
              </div>
              {dayAppts.length > 0 && (
                <div className="flex -space-x-1">
                  {dayAppts.slice(0, 3).map((a, k) => <span key={k} className={cn("h-2 w-2 rounded-full ring-2 ring-background", statusMeta(a.status).dot)} />)}
                </div>
              )}
            </button>
            {dayAppts.length > 0 && (
              <div className="border-t border-border/50 px-3 py-2">
                <div className="flex flex-col gap-1.5">
                  {dayAppts.map((a) => {
                    const client  = maps.clientMap.get(a.clientId);
                    const service = maps.serviceMap.get(a.serviceId);
                    const meta    = statusMeta(a.status);
                    return (
                      <button key={a.id} onClick={() => onOpenAppointment(a)}
                        className={cn("flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.99]", a.status === "concluido" ? "border-zinc-200/60 bg-white/40 opacity-60" : "border-border/60 bg-background/70")}
                      >
                        <span className={cn("h-7 w-1 shrink-0 rounded-full", meta.dot)} />
                        <span className="font-display text-xs font-bold tabular-nums text-foreground shrink-0">{a.start}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-foreground">{client?.name ?? "—"}</p>
                          <p className="truncate text-[10px] font-semibold text-muted-foreground">{service?.name ?? "—"}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function MonthGrid({ appointments, onPickDay }: { appointments: UIAppointment[]; onPickDay: (d: Date) => void }) {
  const today = new Date();
  const year = today.getFullYear(); const month = today.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const byDate = new Map<number, UIAppointment[]>();
  appointments.forEach((a) => {
    const d = new Date(a.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day)!.push(a);
    }
  });

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  const statusOrder: UIStatus[] = ["confirmado", "pendente", "concluido", "cancelado"];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-gradient-to-br from-card via-rose-cloud to-card shadow-card backdrop-blur-md">
      <div className="grid grid-cols-7 border-b border-border bg-primary text-primary-foreground">
        {weekdayLabels.map((w) => (
          <div key={w} className="border-r border-primary-foreground/15 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90 last:border-r-0">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= cells.length - 7;
          if (!d) return <div key={i} className={cn("h-16 bg-muted/20", !isLastCol && "border-r border-border/60", !isLastRow && "border-b border-border/60")} />;
          const isToday   = d === today.getDate();
          const dayAppts  = byDate.get(d) ?? [];
          const dayCounts = statusOrder.map((s) => ({ s, n: dayAppts.filter((a) => a.status === s).length })).filter((x) => x.n > 0);
          return (
            <button key={i} onClick={() => onPickDay(new Date(year, month, d))}
              className={cn("relative flex h-16 flex-col justify-between p-1 text-left transition-all active:scale-[0.98]", !isLastCol && "border-r border-border/60", !isLastRow && "border-b border-border/60", isToday ? "bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground" : dayAppts.length > 0 ? "bg-white/60 hover:bg-white/90" : "bg-white/30 hover:bg-white/50")}
            >
              <span className={cn("font-display text-2xl font-extrabold leading-none tracking-tight", isToday ? "text-white" : dayAppts.length > 0 ? "text-foreground" : "text-muted-foreground/50")}>{d}</span>
              {dayAppts.length > 0 && (
                <div className="flex flex-nowrap items-center gap-0.5">
                  {dayCounts.map(({ s, n }) => (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <span className={cn("inline-flex h-2.5 w-2.5 items-center justify-center rounded-full text-[6px] font-bold leading-none text-white", statusMeta(s).dot)}>{n}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-foreground text-background">
                        <span className="font-medium">{statusMeta(s).label}:</span> <span className="font-bold">{n}</span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
              {isToday && (
                <span className="pointer-events-none absolute right-1 top-1 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── New Appointment Sheet ─────────────────────────────────────

type Draft = {
  client?: UIClient | null;
  newClientName?: string;
  newClientPhone?: string;
  newClientEmail?: string;
  isNewClient?: boolean;
  service?: Service | null;
  date?: Date | null;
  time?: string | null;
  notes?: string;
};

function NewAppointmentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const [step, setStep]   = useState(0);
  const [draft, setDraft] = useState<Draft>({});

  const { data: clients  = [] } = useClientes();
  const { data: services = [] } = useServices();
  const { data: whRows   = [] } = useWorkingHours();
  const { data: blockedDates = [] } = useBlockedDates();
  const { data: appts    = [] } = useAgendamentos();

  const createCliente    = useCreateCliente();
  const createAgendamento = useCreateAgendamento();

  const [clientSearch, setClientSearch] = useState("");
  const [showNewForm, setShowNewForm]   = useState(false);

  const STEPS = 4;

  function reset() { setStep(0); setDraft({}); setClientSearch(""); setShowNewForm(false); }
  function close() { onOpenChange(false); setTimeout(reset, 300); }

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
  });

  // Slot availability
  const slots = useMemo(() => {
    if (!draft.service || !draft.date) return [];
    const dow = draft.date.getDay();
    const wh  = whRows.find((w) => w.day_of_week === dow);
    const ds  = `${draft.date.getFullYear()}-${String(draft.date.getMonth()+1).padStart(2,"0")}-${String(draft.date.getDate()).padStart(2,"0")}`;
    const busy = appts
      .filter((a) => a.date === ds && a.status !== "cancelado")
      .map((a) => ({ start: a.start, durationMinutes: a.durationMinutes }));
    return getAvailableSlots(wh, busy, draft.service.duration_minutes);
  }, [draft.service, draft.date, whRows, appts]);

  // Disabled dates for calendar
  const openDows   = useMemo(() => new Set(whRows.filter((w) => w.is_open).map((w) => w.day_of_week)), [whRows]);
  const blockedSet = useMemo(() => new Set(blockedDates.map((b) => b.blocked_date)), [blockedDates]);

  function isDateDisabled(date: Date): boolean {
    if (date < new Date(new Date().setHours(0,0,0,0))) return true;
    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    return !openDows.has(date.getDay()) || blockedSet.has(ds);
  }

  const canNext =
    (step === 0 && (draft.client || (showNewForm && draft.newClientName && draft.newClientPhone))) ||
    (step === 1 && draft.service) ||
    (step === 2 && draft.date && draft.time) ||
    step === 3;

  async function handleConfirm() {
    try {
      let clientId: string;
      if (draft.isNewClient) {
        const c = await createCliente.mutateAsync({
          name:  draft.newClientName!,
          phone: draft.newClientPhone!,
          email: draft.newClientEmail || null,
        });
        clientId = c.id;
      } else {
        clientId = draft.client!.id;
      }

      const ds = `${draft.date!.getFullYear()}-${String(draft.date!.getMonth()+1).padStart(2,"0")}-${String(draft.date!.getDate()).padStart(2,"0")}`;
      const scheduledAt = `${ds}T${draft.time}:00`;

      await createAgendamento.mutateAsync({
        clientId,
        serviceId:       draft.service!.id,
        scheduledAt,
        durationMinutes: draft.service!.duration_minutes,
        priceCents:      draft.service!.price_cents,
        depositCents:    draft.service!.deposit_type !== "none" ? draft.service!.deposit_value : 0,
        notes:           draft.notes || null,
      });

      toast.success("Agendamento criado ✨");
      close();
    } catch {
      toast.error("Erro ao criar agendamento. Tente novamente.");
    }
  }

  const isSaving = createCliente.isPending || createAgendamento.isPending;

  const stepTitles = ["Cliente", "Serviço", "Data e Hora", "Confirmação"];

  const clientForDisplay = draft.isNewClient ? draft.newClientName : draft.client?.name;
  const serviceForDisplay = draft.service?.name;
  const dateForDisplay = draft.date?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <Sheet open={open} onOpenChange={(b) => (b ? onOpenChange(true) : close())}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl border-none bg-background p-0">
        <div className="mx-auto flex h-full w-full max-w-md flex-col">
          <SheetHeader className="px-6 pt-5">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-2xl font-bold">Novo agendamento</SheetTitle>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{step + 1}/{STEPS}</span>
            </div>
            <p className="text-left text-sm text-muted-foreground">{stepTitles[step]}</p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: STEPS }).map((_, i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= step ? "gradient-primary" : "bg-secondary")} />
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
            <AnimatePresence mode="wait">

              {/* Step 0 — Cliente */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  {!showNewForm ? (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="h-12 rounded-2xl pl-11" />
                      </div>
                      {filteredClients.slice(0, 8).map((c) => {
                        const active = draft.client?.id === c.id && !draft.isNewClient;
                        return (
                          <button key={c.id} onClick={() => setDraft({ ...draft, client: c, isNewClient: false })}
                            className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all", active ? "border-primary bg-secondary shadow-glow" : "border-border bg-card")}
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-soft" style={{ background: `linear-gradient(135deg, ${c.color}, var(--primary))` }}>
                              {c.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-sm font-bold truncate">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground">{c.phone} · {c.totalAppointments} visita{c.totalAppointments !== 1 ? "s" : ""}</p>
                            </div>
                            {active && <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-white"><Check className="h-3.5 w-3.5" /></span>}
                          </button>
                        );
                      })}
                      {filteredClients.length === 0 && clientSearch && (
                        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma cliente encontrada.</p>
                      )}
                      <button onClick={() => { setShowNewForm(true); setDraft({ ...draft, client: null, isNewClient: true, newClientName: clientSearch }); }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-3 text-left text-primary transition hover:bg-primary/10"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Nova cliente</p>
                          <p className="text-[11px] text-primary/70">Cadastrar durante o agendamento</p>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setShowNewForm(false); setDraft({ ...draft, isNewClient: false }); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <X className="h-4 w-4" />
                        </button>
                        <p className="font-display text-base font-bold">Nova cliente</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nome *</Label>
                          <Input value={draft.newClientName ?? ""} onChange={(e) => setDraft({ ...draft, newClientName: e.target.value })} placeholder="Nome da cliente" className="mt-1 h-12 rounded-2xl" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">WhatsApp *</Label>
                          <Input value={draft.newClientPhone ?? ""} onChange={(e) => setDraft({ ...draft, newClientPhone: e.target.value })} placeholder="+55 11 99999-0000" className="mt-1 h-12 rounded-2xl" inputMode="tel" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">E-mail (opcional)</Label>
                          <Input value={draft.newClientEmail ?? ""} onChange={(e) => setDraft({ ...draft, newClientEmail: e.target.value })} placeholder="email@exemplo.com" className="mt-1 h-12 rounded-2xl" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 1 — Serviço */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                  {services.filter((s) => s.is_active).map((s) => {
                    const active = draft.service?.id === s.id;
                    return (
                      <button key={s.id} onClick={() => setDraft({ ...draft, service: s, time: null })}
                        className={cn("flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all", active ? "border-primary bg-secondary shadow-glow" : "border-border bg-card")}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base font-bold truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(s.duration_minutes)}</p>
                          {s.deposit_type !== "none" && (
                            <p className="text-[11px] text-primary font-medium">
                              Sinal: {s.deposit_type === "percent" ? `${s.deposit_value}%` : formatPrice(s.deposit_value)}
                            </p>
                          )}
                        </div>
                        <span className={cn("font-display text-lg font-bold shrink-0 ml-3", active && "text-gradient")}>{formatPrice(s.price_cents)}</span>
                      </button>
                    );
                  })}
                  {services.filter((s) => s.is_active).length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum serviço ativo. Cadastre serviços primeiro.</p>
                  )}
                </motion.div>
              )}

              {/* Step 2 — Data e Hora */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
                    <DayPicker
                      mode="single"
                      selected={draft.date ?? undefined}
                      onSelect={(d) => setDraft({ ...draft, date: d ?? null, time: null })}
                      disabled={isDateDisabled}
                      locale={undefined}
                      classNames={{
                        root:        "w-full",
                        months:      "w-full",
                        month:       "w-full",
                        caption:     "flex items-center justify-between mb-3",
                        caption_label:"font-display text-sm font-bold",
                        nav:         "flex items-center gap-1",
                        nav_button:  "h-7 w-7 flex items-center justify-center rounded-full bg-secondary text-foreground transition hover:bg-primary hover:text-white",
                        table:       "w-full border-collapse",
                        head_row:    "flex mb-1",
                        head_cell:   "flex-1 text-center text-[11px] font-bold uppercase text-muted-foreground",
                        row:         "flex mb-1",
                        cell:        "flex-1",
                        day:         "w-full aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all hover:bg-secondary",
                        day_selected:"!gradient-primary !text-white !shadow-glow",
                        day_disabled:"opacity-30 cursor-not-allowed",
                        day_today:   "ring-2 ring-primary ring-offset-1",
                      }}
                    />
                  </div>

                  {draft.date && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Horários disponíveis — {formatDuration(draft.service?.duration_minutes ?? 0)}
                      </p>
                      {slots.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                          Nenhum horário disponível neste dia.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {slots.map((t) => (
                            <button key={t} onClick={() => setDraft({ ...draft, time: t })}
                              className={cn("rounded-xl border py-3 font-display text-sm font-bold transition-all", draft.time === t ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-card text-foreground")}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3 — Confirmação */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="rounded-2xl gradient-soft p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</p>
                    <div className="grid grid-cols-2 gap-3">
                      <SummaryItem label="Cliente"  value={clientForDisplay ?? "—"} />
                      <SummaryItem label="Serviço"  value={serviceForDisplay ?? "—"} />
                      <SummaryItem label="Data"     value={dateForDisplay ?? "—"} />
                      <SummaryItem label="Horário"  value={draft.time ?? "—"} />
                      <SummaryItem label="Duração"  value={formatDuration(draft.service?.duration_minutes ?? 0)} />
                      <SummaryItem label="Valor"    value={formatPrice(draft.service?.price_cents ?? 0)} highlight />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Observações (opcional)</Label>
                    <Textarea
                      value={draft.notes ?? ""}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                      placeholder="Preferências, informações extras..."
                      rows={3}
                      className="mt-1 resize-none rounded-2xl"
                    />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="border-t border-border bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] backdrop-blur-xl">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="h-14 flex-1 rounded-2xl">
                  Voltar
                </Button>
              )}
              <Button
                onClick={step === STEPS - 1 ? handleConfirm : () => setStep((s) => s + 1)}
                disabled={!canNext || isSaving}
                className="h-14 flex-[2] rounded-2xl gradient-primary text-base font-semibold shadow-glow disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : step === STEPS - 1 ? "Confirmar agendamento" : "Continuar"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-display text-sm font-bold", highlight ? "text-gradient" : "text-foreground")}>{value}</p>
    </div>
  );
}

// ── Appointment Detail Sheet ──────────────────────────────────

function AppointmentDetailSheet({
  appointment, maps, onOpenChange, onStatusChange,
}: {
  appointment: UIAppointment | null;
  maps: DataMaps;
  onOpenChange: (o: boolean) => void;
  onStatusChange: () => void;
}) {
  const [cancelOpen, setCancelOpen]   = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const updateStatus  = useUpdateStatus();
  const cancelAppt    = useCancelAgendamento();

  const open    = !!appointment;
  const client  = appointment ? maps.clientMap.get(appointment.clientId)  : null;
  const service = appointment ? maps.serviceMap.get(appointment.serviceId) : null;
  const meta    = appointment ? statusMeta(appointment.status) : null;

  const phone  = client?.phone?.replace(/\D/g, "") ?? "";
  const waUrl  = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${client?.name ?? ""}! Confirmando seu horário de ${service?.name ?? ""} às ${appointment?.start ?? ""}.`)}` : "#";

  async function changeStatus(status: UIStatus) {
    if (!appointment) return;
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status });
      toast.success(statusMeta(status).label);
      onStatusChange();
      onOpenChange(false);
    } catch { toast.error("Erro ao atualizar status."); }
  }

  async function handleCancel() {
    if (!appointment) return;
    try {
      await cancelAppt.mutateAsync({ id: appointment.id, reason: cancelReason });
      toast.success("Agendamento cancelado");
      setCancelOpen(false);
      onStatusChange();
      onOpenChange(false);
    } catch { toast.error("Erro ao cancelar."); }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border p-0">
          {appointment && client && service && meta && (
            <div className="px-6 pb-8 pt-6">
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border" />
              <SheetHeader className="text-left">
                <SheetTitle className="font-display text-2xl font-bold text-gradient">Detalhes do agendamento</SheetTitle>
              </SheetHeader>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-soft" style={{ background: `linear-gradient(135deg, ${client.color}, var(--primary))` }}>
                  {client.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-foreground truncate">{client.name}</p>
                  <p className="truncate text-xs font-semibold text-muted-foreground">{client.phone}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", meta.bg, meta.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Detail label="Serviço"   value={service.name} />
                <Detail label="Horário"   value={`${appointment.start} – ${appointment.end}`} />
                <Detail label="Duração"   value={formatDuration(appointment.durationMinutes)} />
                <Detail label="Valor"     value={formatPrice(appointment.priceCents)} highlight />
              </div>
              {appointment.notes && (
                <div className="mt-3 rounded-xl bg-secondary/50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Observações</p>
                  <p className="mt-0.5 text-sm text-foreground">{appointment.notes}</p>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {phone && (
                  <a href={waUrl} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-soft">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}

                {appointment.status === "pendente" && (
                  <button onClick={() => changeStatus("confirmado")} disabled={updateStatus.isPending}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow disabled:opacity-50"
                    title="Confirmar"
                  >
                    {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground" title="Mais ações">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {appointment.status === "pendente" && (
                      <DropdownMenuItem onClick={() => changeStatus("confirmado")}>Confirmar</DropdownMenuItem>
                    )}
                    {(appointment.status === "pendente" || appointment.status === "confirmado") && (
                      <DropdownMenuItem onClick={() => changeStatus("concluido")}>Concluir</DropdownMenuItem>
                    )}
                    {(appointment.status === "pendente" || appointment.status === "confirmado") && (
                      <DropdownMenuItem onClick={() => changeStatus("cancelado")}>Marcar no-show</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-destructive">
                      Cancelar agendamento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Motivo (opcional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: cliente desmarcou, emergência..."
              rows={2}
              className="resize-none rounded-xl"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelAppt.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelAppt.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
