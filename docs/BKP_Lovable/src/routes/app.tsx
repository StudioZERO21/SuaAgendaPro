import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
  Check,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import {
  appointments as seedAppointments,
  clients,
  professionals,
  services,
  weekdayLabels,
  type Appointment,
  type Status,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { NotificationsModal } from "@/components/notifications-modal";
import { useNotifications } from "@/lib/notifications-store";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Agenda — SuaAgenda.Pro" },
      { name: "description", content: "Sua agenda do dia." },
    ],
  }),
  component: AgendaPage,
});

const statusFilters: Array<{
  key: "todos" | Status;
  label: string;
  dot: string;
}> = [
  { key: "todos", label: "Todos", dot: "bg-primary" },
  { key: "pendente", label: "Pendentes", dot: "bg-amber-400" },
  { key: "confirmado", label: "Confirmados", dot: "bg-emerald-500" },
  { key: "concluido", label: "Concluídos", dot: "bg-sky-500" },
  { key: "cancelado", label: "Cancelados", dot: "bg-zinc-400" },
];

function todayMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function AgendaPage() {
  const [view, setView] = useState<"timeline" | "grade">("timeline");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [period, setPeriod] = useState<"dia" | "semana" | "mes">("dia");
  const [selectedProf, setSelectedProf] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | Status>("todos");
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [list, setList] = useState<Appointment[]>(seedAppointments);
  const [sheetOpen, setSheetOpen] = useState(false);

  const monday = todayMonday();
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const today = new Date();
  const [activeDateIdx, setActiveDateIdx] = useState(
    ((today.getDay() + 6) % 7) as number,
  );

  const counts = useMemo(() => {
    const base = { todos: list.length, pendente: 0, confirmado: 0, concluido: 0, cancelado: 0 } as Record<string, number>;
    list.forEach((a) => (base[a.status] = (base[a.status] ?? 0) + 1));
    return base;
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((a) => {
      if (selectedProf !== "all" && a.professionalId !== selectedProf) return false;
      if (selectedStatus !== "todos" && a.status !== selectedStatus) return false;
      return true;
    });
  }, [list, selectedProf, selectedStatus]);

  // Sorted flat list for single-professional timeline
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.start.localeCompare(b.start)),
    [filtered],
  );

  function addAppointment(a: Appointment) {
    setList((l) => [...l, a]);
  }




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
            <h1 className="font-display mt-1 text-4xl font-bold leading-tight text-gradient">
              Agenda
            </h1>
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

        {/* Timeline/Grade toggle */}
        <div className="px-6 pb-4">
          <div className="inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-card">
            {(
              [
                { id: "timeline", label: "Timeline", icon: ListChecks },
                { id: "grade", label: "Grade", icon: LayoutGrid },
              ] as const
            ).map((v) => {
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    active ? "bg-foreground text-background shadow-soft" : "text-muted-foreground",
                  )}
                >
                  <v.icon className="h-4 w-4" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Date strip nav */}
      <div className="mt-6 px-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-card">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 text-sm font-bold">
              Hoje
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary">
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
            return (
              <button
                key={i}
                onClick={() => setActiveDateIdx(i)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-full aspect-square text-center transition-all",
                  active ? "gradient-primary text-white shadow-glow" : "border border-border bg-card/60 backdrop-blur-sm shadow-card",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider leading-none mb-[-2px]",
                    active ? "text-white/80" : "text-muted-foreground",
                  )}
                >
                  {weekdayLabels[i]}
                </span>
                <span className={cn("font-display text-2xl font-bold leading-none mt-[-2px]", active ? "text-white" : "text-foreground")}>
                  {d.getDate()}
                </span>
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
                "rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all",
                period === p ? "gradient-primary text-white shadow-glow" : "text-muted-foreground",
              )}
            >
              {p === "mes" ? "Mês" : p}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Status
        </button>
      </div>

      {/* Status chips */}
      <div className="mt-5 px-6">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {statusFilters.map((s) => {
            const active = selectedStatus === s.key;
            const count = counts[s.key] ?? 0;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedStatus(s.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "gradient-primary border-transparent text-white shadow-glow"
                    : "border-border bg-card text-foreground",
                )}
              >
                {s.key !== "todos" && (
                  <span className={cn("h-2 w-2 rounded-full", active ? "bg-white" : s.dot)} />
                )}
                {s.label}
                <span
                  className={cn(
                    "rounded-full px-2 text-[10px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <main className="mt-7 flex-1 px-6 pb-8">
        {sorted.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-soft text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-semibold">Nenhum agendamento</p>
            <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie um novo.</p>
          </div>
        )}

        {sorted.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="font-display text-lg font-bold text-gradient">Próximos agendamentos</p>
            <span className="text-xs font-bold text-muted-foreground">{sorted.length} hoje</span>
          </div>
        )}

        {view === "timeline" ? (
          <div className="space-y-3">
            {sorted.map((a, i) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                delay={i * 0.05}
                isLast={i === sorted.length - 1}
              />
            ))}
          </div>
        ) : (
          <GradeView
            appointments={sorted}
            period={period}
            week={week}
            activeDateIdx={activeDateIdx}
            onSelectDay={setActiveDateIdx}
            onChangePeriod={setPeriod}
            onOpenAppointment={(a) => setDetailAppt(a)}
          />
        )}
      </main>


      <BottomNav />

      <NewAppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreate={addAppointment}
      />
      <AppointmentDetailSheet
        appointment={detailAppt}
        onOpenChange={(o: boolean) => !o && setDetailAppt(null)}
      />
      <NotificationsModal open={notifOpen} onOpenChange={setNotifOpen} />
      </MobileShell>
    </TooltipProvider>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "gradient-primary border-transparent text-white shadow-glow"
          : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function statusMeta(s: Status) {
  switch (s) {
    case "confirmado":
      return { label: "Confirmado", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" };
    case "pendente":
      return { label: "Pendente", color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-400" };
    case "concluido":
      return { label: "Concluído", color: "text-sky-700", bg: "bg-sky-100", dot: "bg-sky-500" };
    case "cancelado":
      return { label: "Cancelado", color: "text-zinc-600", bg: "bg-zinc-100", dot: "bg-zinc-400" };
  }
}


function AppointmentCard({
  appointment,
  delay = 0,
  isLast = false,
}: {
  appointment: Appointment;
  delay?: number;
  isLast?: boolean;
}) {
  const client = clients.find((c) => c.id === appointment.clientId)!;
  const service = services.find((s) => s.id === appointment.serviceId)!;
  const meta = statusMeta(appointment.status);
  const [open, setOpen] = useState(false);
  const isDone = appointment.status === "concluido";

  const waNumber = client.phone.replace(/\D/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Olá ${client.name}! Confirmando seu horário de ${service.name} às ${appointment.start}.`,
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={cn("flex gap-3", isDone && "opacity-55 saturate-50")}
    >
      {/* Timeline column */}
      <div className="flex w-8 flex-col items-center shrink-0">
        <div
          className={cn(
            "relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-glow ring-2 ring-background shrink-0",
            isDone ? "bg-zinc-400" : "gradient-primary",
          )}
        >
          <Clock className="h-3.5 w-3.5" />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-gradient-to-b from-primary/30 via-border to-transparent min-h-[12px]" />
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-xl border shadow-card backdrop-blur-md",
          isDone
            ? "border-zinc-200/60 bg-white/30"
            : "border-white/40 bg-white/60",
        )}
      >
        {/* Header row: time + name + status + toggle */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Time column */}
          <div className="flex flex-col items-center text-center min-w-[2.75rem] shrink-0">
            <span className="font-display text-sm font-bold text-foreground leading-none">
              {appointment.start}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              {service.duration}m
            </span>
          </div>

          {/* Divider */}
          <div className="h-9 w-px bg-border/70" />

          {/* Avatar */}
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-soft",
              isDone && "grayscale",
            )}
            style={
              isDone
                ? { background: "#a1a1aa" }
                : { background: `linear-gradient(135deg, ${client.color}, var(--primary))` }
            }
          >
            {client.initials}
          </div>

          {/* Name + status */}
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold leading-tight text-foreground truncate">
              {client.name}
            </p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                meta.bg,
                meta.color,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </div>

          {/* Compact toggle button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
              open
                ? "gradient-primary border-transparent text-white shadow-glow rotate-45"
                : isDone
                  ? "border-zinc-200 bg-zinc-100 text-zinc-400"
                  : "border-border bg-secondary text-foreground",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/60 px-3 py-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <Detail label="Serviço" value={service.name} />
                  <Detail
                    label="Horário"
                    value={`${appointment.start} – ${appointment.end}`}
                  />
                  <Detail label="Telefone" value={client.phone} />
                  <Detail
                    label="Valor"
                    value={`R$ ${service.price.toFixed(2).replace(".", ",")}`}
                    highlight
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-soft transition hover:bg-emerald-600"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <button
                    onClick={() => toast.info("Menu de ações em breve")}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-secondary"
                  >
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

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-sm font-bold",
          highlight ? "text-gradient text-base" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}


/* ----------------- Grade View (calendar) ----------------- */

function hashToDay(id: string, len: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % len;
}

function GradeView({
  appointments,
  period,
  week,
  activeDateIdx,
  onSelectDay,
  onChangePeriod,
  onOpenAppointment,
}: {
  appointments: Appointment[];
  period: "dia" | "semana" | "mes";
  week: Date[];
  activeDateIdx: number;
  onSelectDay: (i: number) => void;
  onChangePeriod: (p: "dia" | "semana" | "mes") => void;
  onOpenAppointment: (a: Appointment) => void;
}) {
  return (
    <div className="space-y-4">
      <StatusLegend />
      {period === "semana" ? (
        <WeekGrid
          appointments={appointments}
          week={week}
          activeDateIdx={activeDateIdx}
          onSelectDay={onSelectDay}
          onOpenAppointment={onOpenAppointment}
        />
      ) : period === "mes" ? (
        <MonthGrid
          appointments={appointments}
          onPickDay={(d) => {
            const idx = week.findIndex((w) => w.toDateString() === d.toDateString());
            if (idx >= 0) onSelectDay(idx);
            onChangePeriod("dia");
          }}
        />
      ) : (
        <DayGrid
          appointments={appointments.filter((a) => {
            const apptDate = new Date(a.date + "T00:00:00");
            return apptDate.toDateString() === week[activeDateIdx].toDateString();
          })}
          onOpenAppointment={onOpenAppointment}
        />
      )}
    </div>
  );
}

/* ---- Status color legend ---- */
function StatusLegend() {
  const items = [
    { label: "Conf.", dot: "bg-emerald-500" },
    { label: "Pend.", dot: "bg-amber-400" },
    { label: "Concl.", dot: "bg-sky-500" },
    { label: "Canc.", dot: "bg-zinc-400" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-border bg-card/60 px-3 py-2 shadow-card backdrop-blur-md">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Legenda
      </span>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", it.dot)} />
          <span className="text-[11px] font-semibold text-foreground">{it.label}</span>
        </span>
      ))}
    </div>
  );
}

/* ---- Day (hourly column) ---- */
function DayGrid({
  appointments,
  onOpenAppointment,
}: {
  appointments: Appointment[];
  onOpenAppointment: (a: Appointment) => void;
}) {
  const startHour = 7;
  const endHour = 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const pxPerHour = 72;

  const items = appointments.map((a) => {
    const [h, m] = a.start.split(":").map(Number);
    const [eh, em] = a.end.split(":").map(Number);
    const top = ((h - startHour) * 60 + m) * (pxPerHour / 60);
    const height = Math.max(36, ((eh - h) * 60 + (em - m)) * (pxPerHour / 60) - 4);
    return { a, top, height };
  });

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-3 shadow-card">
      <div className="relative" style={{ height: hours.length * pxPerHour }}>
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start gap-3"
            style={{ top: i * pxPerHour, height: pxPerHour }}
          >
            <span className="w-10 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="mt-1.5 h-px flex-1 bg-border/60" />
          </div>
        ))}
        <div className="absolute inset-0 pl-[3.25rem] pr-1">
          {items.map(({ a, top, height }, i) => {
            const client = clients.find((c) => c.id === a.clientId)!;
            const service = services.find((s) => s.id === a.serviceId)!;
            const meta = statusMeta(a.status);
            const isDone = a.status === "concluido";
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => onOpenAppointment(a)}
                className={cn(
                  "absolute left-0 right-0 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1.5 text-left shadow-card backdrop-blur-md transition-all active:scale-[0.98]",
                  isDone
                    ? "border-zinc-200/60 bg-white/30 opacity-55 saturate-50"
                    : "border-white/40 bg-white/70",
                )}
                style={{ top, height }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("w-1 shrink-0 rounded-full", meta.dot)}
                    style={{ height: Math.max(20, height - 16) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-bold leading-tight text-foreground truncate">
                      {client.name}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-muted-foreground">
                      {a.start}–{a.end} · {service.name}
                    </p>
                  </div>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {appointments.length === 0 && (
        <p className="py-8 text-center text-xs font-semibold text-muted-foreground">
          Sem horários neste dia.
        </p>
      )}
    </div>
  );
}

/* ---- Week (compact list per day, no horizontal scroll) ---- */
function WeekGrid({
  appointments,
  week,
  activeDateIdx,
  onSelectDay,
  onOpenAppointment,
}: {
  appointments: Appointment[];
  week: Date[];
  activeDateIdx: number;
  onSelectDay: (i: number) => void;
  onOpenAppointment: (a: Appointment) => void;
}) {
  const today = new Date();

  // Group appointments by real date matching the week
  const byDay: Appointment[][] = Array.from({ length: 7 }, () => []);
  appointments.forEach((a) => {
    const apptDate = new Date(a.date + "T00:00:00");
    const idx = week.findIndex((w) => w.toDateString() === apptDate.toDateString());
    if (idx >= 0) byDay[idx].push(a);
  });
  byDay.forEach((arr) => arr.sort((a, b) => a.start.localeCompare(b.start)));

  return (
    <div className="space-y-2.5">
      {week.map((d, i) => {
        const dayAppts = byDay[i];
        const isToday = d.toDateString() === today.toDateString();
        const isActive = i === activeDateIdx;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className={cn(
              "overflow-hidden rounded-2xl border shadow-card backdrop-blur-md",
              isActive
                ? "border-primary/40 bg-white/70"
                : "border-border bg-card/60",
            )}
          >
            <button
              onClick={() => onSelectDay(i)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl",
                  isToday
                    ? "gradient-primary text-white shadow-glow"
                    : "bg-secondary text-foreground",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider leading-none",
                    isToday ? "text-white/85" : "text-muted-foreground",
                  )}
                >
                  {weekdayLabels[i]}
                </span>
                <span className="font-display text-base font-bold leading-none mt-0.5">
                  {d.getDate()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">
                  {d.toLocaleDateString("pt-BR", { weekday: "long" })}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {dayAppts.length === 0
                    ? "Sem agendamentos"
                    : `${dayAppts.length} agendamento${dayAppts.length > 1 ? "s" : ""}`}
                </p>
              </div>
              {dayAppts.length > 0 && (
                <div className="flex -space-x-1">
                  {dayAppts.slice(0, 3).map((a, k) => (
                    <span
                      key={k}
                      className={cn(
                        "h-2 w-2 rounded-full ring-2 ring-background",
                        statusMeta(a.status).dot,
                      )}
                    />
                  ))}
                </div>
              )}
            </button>

            {dayAppts.length > 0 && (
              <div className="border-t border-border/50 px-3 py-2">
                <div className="flex flex-col gap-1.5">
                  {dayAppts.map((a) => {
                    const client = clients.find((c) => c.id === a.clientId)!;
                    const service = services.find((s) => s.id === a.serviceId)!;
                    const meta = statusMeta(a.status);
                    const isDone = a.status === "concluido";
                    return (
                      <button
                        key={a.id}
                        onClick={() => onOpenAppointment(a)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.99]",
                          isDone
                            ? "border-zinc-200/60 bg-white/40 opacity-60"
                            : "border-border/60 bg-background/70",
                        )}
                      >
                        <span className={cn("h-7 w-1 shrink-0 rounded-full", meta.dot)} />
                        <span className="font-display text-xs font-bold tabular-nums text-foreground shrink-0">
                          {a.start}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-foreground">
                            {client.name}
                          </p>
                          <p className="truncate text-[10px] font-semibold text-muted-foreground">
                            {service.name}
                          </p>
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

function MonthGrid({
  appointments,
  onPickDay,
}: {
  appointments: Appointment[];
  onPickDay: (d: Date) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  // Group appointments by day of month using real date field
  const byDate = new Map<number, Appointment[]>();
  appointments.forEach((a) => {
    const apptDate = new Date(a.date + "T00:00:00");
    if (apptDate.getFullYear() === year && apptDate.getMonth() === month) {
      const day = apptDate.getDate();
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day)!.push(a);
    }
  });

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    const valid = dayNum >= 1 && dayNum <= daysInMonth;
    return valid ? dayNum : null;
  });

  const statusOrder: Status[] = ["confirmado", "pendente", "concluido", "cancelado"];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-gradient-to-br from-card via-rose-cloud to-card shadow-card backdrop-blur-md">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b border-border bg-primary text-primary-foreground">
        {weekdayLabels.map((w) => (
          <div
            key={w}
            className="border-r border-primary-foreground/15 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90 last:border-r-0"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Cells grid (square-ish table) */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= cells.length - 7;

          if (!d) {
            return (
              <div
                key={i}
                className={cn(
                  "h-16 bg-muted/20",
                  !isLastCol && "border-r border-border/60",
                  !isLastRow && "border-b border-border/60",
                )}
              />
            );
          }

          const isToday = d === today.getDate();
          const dayAppts = byDate.get(d) ?? [];
          const count = dayAppts.length;

          const dayCounts = statusOrder
            .map((s) => ({ s, n: dayAppts.filter((a) => a.status === s).length }))
            .filter((x) => x.n > 0);

          return (
            <button
              key={i}
              onClick={() => onPickDay(new Date(year, month, d))}
              className={cn(
                "relative flex h-16 flex-col justify-between p-1 text-left transition-all active:scale-[0.98]",
                !isLastCol && "border-r border-border/60",
                !isLastRow && "border-b border-border/60",
                isToday
                  ? "bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground shadow-[inset_0_0_20px_rgba(255,255,255,0.25)]"
                  : count > 0
                    ? "bg-white/60 hover:bg-white/90"
                    : "bg-white/30 hover:bg-white/50",
              )}
            >
              {/* Big day number */}
              <span
                className={cn(
                  "font-display text-2xl font-extrabold leading-none tracking-tight",
                  isToday
                    ? "text-white"
                    : count > 0
                      ? "text-foreground"
                      : "text-muted-foreground/50",
                )}
              >
                {d}
              </span>

              {/* Status circles — single line, smaller, with tooltip */}
              {count > 0 && (
                <div className="flex flex-nowrap items-center gap-0.5">
                  {dayCounts.map(({ s, n }) => {
                    const m = statusMeta(s);
                    return (
                      <Tooltip key={s}>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "inline-flex h-2.5 w-2.5 items-center justify-center rounded-full text-[6px] font-bold leading-none text-white",
                              m.dot,
                            )}
                          >
                            {n}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-foreground text-background">
                          <span className="font-medium">{m.label}:</span> <span className="font-bold">{n}</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}

              {/* Today indicator */}
              {isToday && (
                <span className="pointer-events-none absolute right-1 top-1 flex h-1.5 w-1.5 items-center justify-center">
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






/* ----------------- New Appointment Sheet ----------------- */

type Draft = {
  clientId?: string;
  serviceId?: string;
  professionalId?: string;
  time?: string;
};

function NewAppointmentSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreate: (a: Appointment) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const totalSteps = 4;
  const stepTitles = ["Cliente", "Serviço", "Profissional", "Data e horário"];

  function reset() {
    setStep(0);
    setDraft({});
  }
  function close() {
    onOpenChange(false);
    setTimeout(reset, 250);
  }

  function next() {
    if (step < totalSteps) {
      setStep((s) => s + 1);
    }
  }

  function confirm() {
    if (!draft.clientId || !draft.serviceId || !draft.professionalId || !draft.time) return;
    const service = services.find((s) => s.id === draft.serviceId)!;
    const [h, m] = draft.time.split(":").map(Number);
    const endMin = h * 60 + m + service.duration;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const today = new Date();
    const y = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    onCreate({
      id: `a-${Date.now()}`,
      clientId: draft.clientId,
      serviceId: draft.serviceId,
      professionalId: draft.professionalId,
      date: `${y}-${mo}-${d}`,
      start: draft.time,
      end,
      status: "confirmado",
    });
    toast.success("Agendamento criado ✨");
    close();
  }

  const canNext =
    (step === 0 && !!draft.clientId) ||
    (step === 1 && !!draft.serviceId) ||
    (step === 2 && !!draft.professionalId) ||
    (step === 3 && !!draft.time);

  const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <Sheet open={open} onOpenChange={(b) => (b ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl border-none bg-background p-0"
      >
        <div className="mx-auto flex h-full w-full max-w-md flex-col">
          <SheetHeader className="px-6 pt-5">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-2xl font-bold">
                Novo agendamento
              </SheetTitle>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {step + 1}/{totalSteps}
              </span>
            </div>
            <p className="text-left text-sm text-muted-foreground">{stepTitles[step]}</p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all",
                    i <= step ? "gradient-primary" : "bg-secondary",
                  )}
                />
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-5">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="c"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  {clients.map((c) => {
                    const active = draft.clientId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setDraft({ ...draft, clientId: c.id })}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                          active
                            ? "border-primary bg-secondary shadow-glow"
                            : "border-border bg-card",
                        )}
                      >
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-soft"
                          style={{ background: `linear-gradient(135deg, ${c.color}, var(--primary))` }}
                        >
                          {c.initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-sm font-bold">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                        </div>
                        {active && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="s"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  {services.map((s) => {
                    const active = draft.serviceId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setDraft({ ...draft, serviceId: s.id })}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                          active
                            ? "border-primary bg-secondary shadow-glow"
                            : "border-border bg-card",
                        )}
                      >
                        <div>
                          <p className="font-display text-base font-bold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.duration} min</p>
                        </div>
                        <span className={cn("font-display text-lg font-bold", active && "text-gradient")}>
                          R$ {s.price}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="p"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {professionals.map((p) => {
                    const active = draft.professionalId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setDraft({ ...draft, professionalId: p.id })}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                          active
                            ? "border-primary bg-secondary shadow-glow"
                            : "border-border bg-card",
                        )}
                      >
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-soft"
                          style={{ background: p.color }}
                        >
                          {p.initials}
                        </div>
                        <p className="font-display text-sm font-bold">{p.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.role}
                        </p>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="t"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data
                    </p>
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                      <p className="font-display text-base font-bold">
                        Hoje,{" "}
                        {new Date().toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">Toque para alterar (demo)</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Horário
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {times.map((t) => {
                        const active = draft.time === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setDraft({ ...draft, time: t })}
                            className={cn(
                              "rounded-2xl border py-3 font-display text-base font-bold transition-all",
                              active
                                ? "gradient-primary border-transparent text-white shadow-glow"
                                : "border-border bg-card text-foreground",
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {draft.clientId && draft.serviceId && draft.professionalId && draft.time && (
                    <div className="rounded-2xl gradient-soft p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                        Resumo
                      </p>
                      <p className="mt-1 font-display text-base font-bold">
                        {clients.find((c) => c.id === draft.clientId)?.name} ·{" "}
                        {services.find((s) => s.id === draft.serviceId)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        com {professionals.find((p) => p.id === draft.professionalId)?.name} às{" "}
                        {draft.time}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-border bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] backdrop-blur-xl">
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-14 flex-1 rounded-2xl"
                >
                  Voltar
                </Button>
              )}
              <Button
                onClick={step === totalSteps - 1 ? confirm : next}
                disabled={!canNext}
                className="h-14 flex-[2] rounded-2xl gradient-primary py-3 text-base font-semibold shadow-glow disabled:opacity-50"
              >
                {step === totalSteps - 1 ? "Confirmar agendamento" : "Continuar"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------- Appointment Detail Sheet ----------------- */
function AppointmentDetailSheet({
  appointment,
  onOpenChange,
}: {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!appointment;
  const client = appointment ? clients.find((c) => c.id === appointment.clientId) : null;
  const service = appointment ? services.find((s) => s.id === appointment.serviceId) : null;
  const prof = appointment ? professionals.find((p) => p.id === appointment.professionalId) : null;
  const meta = appointment ? statusMeta(appointment.status) : null;

  const waUrl = client && service && appointment
    ? `https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${client.name}! Confirmando seu horário de ${service.name} às ${appointment.start}.`,
      )}`
    : "#";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t border-border p-0">
        {appointment && client && service && meta && (
          <div className="px-6 pb-8 pt-6">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border" />
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-2xl font-bold text-gradient">
                Detalhes do agendamento
              </SheetTitle>
            </SheetHeader>

            <div className="mt-5 flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-soft"
                style={{ background: `linear-gradient(135deg, ${client.color}, var(--primary))` }}
              >
                {client.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-foreground truncate">
                  {client.name}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {client.phone}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  meta.bg,
                  meta.color,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Detail label="Serviço" value={service.name} />
              <Detail label="Horário" value={`${appointment.start} – ${appointment.end}`} />
              <Detail label="Duração" value={`${service.duration} min`} />
              <Detail
                label="Valor"
                value={`R$ ${service.price.toFixed(2).replace(".", ",")}`}
                highlight
              />
              {prof && <Detail label="Profissional" value={prof.name} />}
            </div>

            <div className="mt-6 flex gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-soft transition hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <button
                onClick={() => {
                  toast.success("Agendamento confirmado");
                  onOpenChange(false);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow"
                aria-label="Confirmar"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast.info("Mais ações em breve")}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground"
                aria-label="Mais"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
