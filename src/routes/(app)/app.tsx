import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CalendarDays, ChevronLeft, ChevronRight, Filter, LayoutGrid,
  ListChecks, MessageCircle, MoreHorizontal, Plus, Sparkles, Check,
  Clock, X, Search, Loader2, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInputBR } from "@/components/ui/phone-input";
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
import { getAvailableSlots, localTzSuffix } from "@/lib/availability";
import {
  useAgendamentos, useAgendamentosRealtime, useCreateAgendamento,
  useUpdateStatus, useCancelAgendamento,
  type UIAppointment, type UIStatus,
} from "@/hooks/useAgendamentos";
import { useClientes, useCreateCliente, type UIClient } from "@/hooks/useClientes";
import { useServices, formatPrice, formatDuration } from "@/hooks/useServicos";
import { useWorkingHours, useScheduleBlocks } from "@/hooks/useHorarios";
import { useProfile } from "@/hooks/usePerfil";
import type { Service } from "@/integrations/supabase/types";
import {
  weekdayLabels, statusMeta, todayMonday, dateToStr, GradeView,
  type DataMaps, type BlockEntry,
} from "@/components/agenda/agenda-views";

export const Route = createFileRoute("/(app)/app")({
  head: () => ({
    meta: [
      { title: "Agenda — SuaAgenda.Pro" },
      { name: "description", content: "Sua agenda do dia." },
    ],
  }),
  component: AgendaPage,
});

// ── Constants ─────────────────────────────────────────────────


const statusFilters: Array<{ key: "todos" | UIStatus; label: string; dot: string }> = [
  { key: "todos",     label: "Todos",      dot: "bg-primary"    },
  { key: "pendente",  label: "Pendentes",  dot: "bg-amber-400"  },
  { key: "confirmado",label: "Confirmados",dot: "bg-emerald-500"},
  { key: "concluido", label: "Concluídos", dot: "bg-sky-500"    },
  { key: "cancelado", label: "Cancelados", dot: "bg-zinc-400"   },
];


// ── Page ─────────────────────────────────────────────────────

function AgendaPage() {
  const [view, setView]               = useState<"timeline" | "grade">("timeline");
  const [notifOpen, setNotifOpen]     = useState(false);
  const [period, setPeriod]           = useState<"dia" | "semana" | "mes">("dia");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | UIStatus>("todos");
  const [showStatus, setShowStatus]   = useState(false);
  const [detailAppt, setDetailAppt]   = useState<UIAppointment | null>(null);
  const [sheetOpen, setSheetOpen]     = useState(false);

  const { unreadCount } = useNotifications();

  const today          = useMemo(() => new Date(), []);
  const todayIdx       = (today.getDay() + 6) % 7;
  const [weekOffset, setWeekOffset]       = useState(0);
  const [activeDateIdx, setActiveDateIdx] = useState(todayIdx);
  const [navMode, setNavMode]             = useState<"semana" | "mes">("semana");

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
  const { data: scheduleBlocks = [] }                    = useScheduleBlocks();
  const { data: profile }                                = useProfile();

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
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-11 w-11 rounded-full object-cover shadow-glow ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white shadow-glow">
                  {profile?.display_name
                    ? profile.display_name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
                    : "?"}
                </div>
              )}
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
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-2 py-2 shadow-card">
              <button
                onClick={() => { setWeekOffset((w) => w - (navMode === "mes" ? 4 : 1)); setActiveDateIdx(0); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex flex-1 flex-col items-center gap-1">
                <button
                  onClick={() => { setWeekOffset(0); setActiveDateIdx(todayIdx); setPeriod("dia"); }}
                  className="flex items-center gap-1.5 text-sm font-bold leading-none"
                >
                  {weekOffset === 0 ? "Hoje" : (() => {
                    const s = monday;
                    const e = week[6];
                    return s.getMonth() === e.getMonth()
                      ? s.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                      : `${s.toLocaleDateString("pt-BR", { month: "short" })} / ${e.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
                  })()}
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-1">
                  {(["semana", "mes"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setNavMode(m)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
                        navMode === m ? "gradient-primary text-white" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "semana" ? "Sem." : "Mês"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setWeekOffset((w) => w + (navMode === "mes" ? 4 : 1)); setActiveDateIdx(0); }}
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
              const ds = dateToStr(d);
              const dayApptCount = appts.filter((a) => a.date === ds).length;
              const block = scheduleBlocks.find((b) => ds >= b.start_date && ds <= b.end_date);
              return (
                <button
                  key={i}
                  onClick={() => { setActiveDateIdx(i); setPeriod("dia"); }}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-full text-center transition-all",
                    active
                      ? "gradient-primary text-white shadow-glow"
                      : block
                      ? "border border-amber-200 bg-amber-50"
                      : "border border-border bg-card/60 backdrop-blur-sm shadow-card",
                  )}
                >
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mb-[-2px]",
                    active ? "text-white/80" : block ? "text-amber-500" : "text-muted-foreground",
                  )}>
                    {block && !active ? (block.reason === "ferias" ? "Fér." : "Bloq.") : weekdayLabels[i]}
                  </span>
                  <span className={cn("font-display text-2xl font-bold leading-none mt-[-2px]",
                    active ? "text-white" : block ? "text-amber-600 line-through" : "text-foreground",
                  )}>
                    {d.getDate()}
                  </span>
                  {dayApptCount > 0 && !block && (
                    <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", active ? "bg-white/70" : "bg-primary")} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Period + Status toggle — single row */}
        <div className="mt-5 px-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Período
            </span>
            <div className="inline-flex rounded-full bg-secondary p-1">
              {(["dia", "semana", "mes"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200",
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
            <button
              onClick={() => setShowStatus((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                showStatus ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Filter className="h-3.5 w-3.5" /> Status
            </button>
          </div>

          {/* Status chips — expandable */}
          <AnimatePresence>
            {showStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
                  {statusFilters.map((s) => {
                    const active = selectedStatus === s.key;
                    const count  = counts[s.key] ?? 0;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSelectedStatus(s.key)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                          active
                            ? "gradient-primary border-transparent text-white shadow-glow"
                            : "border-border bg-card text-foreground hover:border-primary/30",
                        )}
                      >
                        {s.key !== "todos" && (
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
                        )}
                        {s.label}
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          active ? "bg-white/25 text-white" : "bg-secondary text-secondary-foreground",
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  scheduleBlocks={scheduleBlocks}
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

      <div className={cn("relative flex-1 overflow-hidden rounded-xl border shadow-card backdrop-blur-md", isDone ? "border-border/60 bg-card/30 dark:bg-card/20" : "border-border/60 bg-card/60 dark:bg-card/50")}>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="flex flex-col items-center text-center min-w-[2.75rem] shrink-0">
            <span className="font-display text-sm font-bold text-foreground leading-none">{a.start}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{a.durationMinutes}m</span>
          </div>
          <div className="h-9 w-px bg-border/70" />
          <div
            className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-soft", isDone && "grayscale")}
            style={isDone ? { background: "#a1a1aa" } : { background: `linear-gradient(135deg, ${client?.color ?? "var(--primary)"}, var(--accent))` }}
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
            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all", open ? "gradient-primary border-transparent text-white shadow-glow rotate-45" : isDone ? "border-border bg-muted text-muted-foreground" : "border-border bg-secondary text-foreground")}
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
  const { data: scheduleBlocks = [] } = useScheduleBlocks();
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
  const isInScheduleBlock = useMemo(
    () => (ds: string) => scheduleBlocks.some((b) => ds >= b.start_date && ds <= b.end_date),
    [scheduleBlocks],
  );

  function isDateDisabled(date: Date): boolean {
    if (date < new Date(new Date().setHours(0,0,0,0))) return true;
    const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    return !openDows.has(date.getDay()) || isInScheduleBlock(ds);
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
      const scheduledAt = `${ds}T${draft.time}:00${localTzSuffix()}`;

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
                          <PhoneInputBR value={draft.newClientPhone ?? ""} onChange={(v) => setDraft({ ...draft, newClientPhone: v })} className="mt-1" />
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
                    <MiniCalendar
                      selected={draft.date ?? null}
                      onSelect={(d) => setDraft({ ...draft, date: d, time: null })}
                      isDisabled={isDateDisabled}
                      scheduleBlocks={scheduleBlocks}
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

// ── Mini Calendar ─────────────────────────────────────────────

function MiniCalendar({
  selected, onSelect, isDisabled, scheduleBlocks,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  isDisabled: (d: Date) => boolean;
  scheduleBlocks: BlockEntry[];
}) {
  const now = useMemo(() => new Date(), []);
  const [viewYear,  setViewYear]  = useState(selected ? selected.getFullYear()  : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth()     : now.getMonth());

  const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DAY_ABBR    = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  const firstDay    = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const n = i - startOffset + 1;
    return n >= 1 && n <= daysInMonth ? new Date(viewYear, viewMonth, n) : null;
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function getBlock(d: Date) {
    const ds = dateToStr(d);
    return scheduleBlocks.find((b) => ds >= b.start_date && ds <= b.end_date) ?? null;
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary transition hover:bg-primary hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-sm font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</p>
        <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary transition hover:bg-primary hover:text-white">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAY_ABBR.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-bold uppercase text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isSelected = selected && d.toDateString() === selected.toDateString();
          const isToday    = d.toDateString() === now.toDateString();
          const disabled   = isDisabled(d);
          const block      = getBlock(d);
          return (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onSelect(d)}
              disabled={disabled}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all",
                isSelected && "gradient-primary text-white shadow-glow",
                !isSelected && isToday && "ring-2 ring-primary ring-offset-1",
                !isSelected && block && "cursor-not-allowed bg-amber-50 text-amber-600",
                !isSelected && !block && !disabled && "hover:bg-secondary",
                !isSelected && !block && disabled && "cursor-not-allowed opacity-30",
              )}
            >
              <span>{d.getDate()}</span>
              {block && !isSelected && (
                <span className="text-[7px] font-bold leading-none text-amber-500">
                  {block.reason === "ferias" ? "Fér." : block.reason === "feriado" ? "Fer." : "Bloq."}
                </span>
              )}
            </button>
          );
        })}
      </div>
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
