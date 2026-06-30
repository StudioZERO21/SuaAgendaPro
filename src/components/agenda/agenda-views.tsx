// Grades da agenda (dia/semana/mês) + helpers/tipos compartilhados.
// Extraído de (app)/app.tsx para reduzir o tamanho do arquivo (sem mudar lógica).
import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type UIAppointment, type UIStatus } from "@/hooks/useAgendamentos";
import { type UIClient } from "@/hooks/useClientes";
import type { Service } from "@/integrations/supabase/types";

export const weekdayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function statusMeta(s: UIStatus) {
  switch (s) {
    case "confirmado":
      return {
        label: "Confirmado",
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-100 dark:bg-emerald-950",
        dot: "bg-emerald-500",
      };
    case "pendente":
      return {
        label: "Pendente",
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-100 dark:bg-amber-950",
        dot: "bg-amber-400",
      };
    case "concluido":
      return {
        label: "Concluído",
        color: "text-sky-700 dark:text-sky-300",
        bg: "bg-sky-100 dark:bg-sky-950",
        dot: "bg-sky-500",
      };
    case "cancelado":
      return {
        label: "Cancelado",
        color: "text-zinc-600 dark:text-zinc-400",
        bg: "bg-zinc-100 dark:bg-zinc-800",
        dot: "bg-zinc-400",
      };
  }
}

export function todayMonday() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export type DataMaps = {
  clientMap: Map<string, UIClient>;
  serviceMap: Map<string, Service>;
};

export type BlockEntry = { start_date: string; end_date: string; reason: string };

export function GradeView({
  appointments, period, week, activeDateIdx, maps, scheduleBlocks, onSelectDay, onChangePeriod, onOpenAppointment,
}: {
  appointments: UIAppointment[];
  period: "dia" | "semana" | "mes";
  week: Date[];
  activeDateIdx: number;
  maps: DataMaps;
  scheduleBlocks: BlockEntry[];
  onSelectDay: (i: number) => void;
  onChangePeriod: (p: "dia" | "semana" | "mes") => void;
  onOpenAppointment: (a: UIAppointment) => void;
}) {
  const activeDate = week[activeDateIdx];
  const activeDateStr = dateToStr(activeDate);

  return (
    <div className="space-y-4">
      {period === "semana" ? (
        <WeekGrid appointments={appointments} week={week} activeDateIdx={activeDateIdx} maps={maps} scheduleBlocks={scheduleBlocks} onSelectDay={onSelectDay} onOpenAppointment={onOpenAppointment} />
      ) : period === "mes" ? (
        <MonthGrid appointments={appointments} scheduleBlocks={scheduleBlocks} viewDate={week[0]} onPickDay={(d) => { const idx = week.findIndex((w) => w.toDateString() === d.toDateString()); if (idx >= 0) onSelectDay(idx); onChangePeriod("dia"); }} />
      ) : (
        <DayGrid appointments={appointments.filter((a) => a.date === activeDateStr)} scheduleBlocks={scheduleBlocks} activeDate={activeDate} maps={maps} onOpenAppointment={onOpenAppointment} />
      )}
    </div>
  );
}

function DayGrid({ appointments, maps, scheduleBlocks, activeDate, onOpenAppointment }: { appointments: UIAppointment[]; maps: DataMaps; scheduleBlocks: BlockEntry[]; activeDate: Date; onOpenAppointment: (a: UIAppointment) => void }) {
  const ds = dateToStr(activeDate);
  const block = scheduleBlocks.find((b) => ds >= b.start_date && ds <= b.end_date);
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
    <div className="space-y-3">
      {block && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-amber-700">
            {block.reason === "ferias" ? "🏖 Férias" : block.reason === "feriado" ? "📅 Feriado" : "⛔ Agenda bloqueada"}
            {" — "}nenhum horário disponível neste período.
          </span>
        </div>
      )}
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
                <button key={a.id}
                  style={{ top, height, animationDelay: `${i * 40}ms` }}
                  onClick={() => onOpenAppointment(a)}
                  className={cn("absolute left-0 right-0 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-1.5 text-left shadow-card backdrop-blur-md transition-all active:scale-[0.98] animate-sa-fade-in-right", a.status === "concluido" ? "border-border/60 bg-card/30 opacity-55 saturate-50 dark:bg-card/20" : "border-border/60 bg-card/80 dark:bg-card/70")}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-1 shrink-0 rounded-full", meta.dot)} style={{ height: Math.max(20, height - 16) }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[13px] font-bold leading-tight text-foreground truncate">{client?.name ?? "—"}</p>
                      <p className="truncate text-[10px] font-semibold text-muted-foreground">{a.start}–{a.end} · {service?.name ?? "—"}</p>
                    </div>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {appointments.length === 0 && <p className="py-8 text-center text-xs font-semibold text-muted-foreground">Sem horários neste dia.</p>}
      </div>
    </div>
  );
}

function WeekGrid({ appointments, week, activeDateIdx, maps, scheduleBlocks, onSelectDay, onOpenAppointment }: {
  appointments: UIAppointment[]; week: Date[]; activeDateIdx: number; maps: DataMaps;
  scheduleBlocks: BlockEntry[];
  onSelectDay: (i: number) => void; onOpenAppointment: (a: UIAppointment) => void;
}) {
  const today = new Date();
  const byDay: UIAppointment[][] = Array.from({ length: 7 }, () => []);
  appointments.forEach((a) => {
    const idx = week.findIndex((w) => dateToStr(w) === a.date);
    if (idx >= 0) byDay[idx].push(a);
  });
  byDay.forEach((arr) => arr.sort((a, b) => a.start.localeCompare(b.start)));

  return (
    <div className="space-y-2.5">
      {week.map((d, i) => {
        const dayAppts = byDay[i];
        const isToday  = d.toDateString() === today.toDateString();
        const isActive = i === activeDateIdx;
        const ds       = dateToStr(d);
        const block    = scheduleBlocks.find((b) => ds >= b.start_date && ds <= b.end_date);
        return (
          <div
            key={i}
            style={{ animationDelay: `${i * 30}ms` }}
            className={cn(
              "overflow-hidden rounded-2xl border shadow-card backdrop-blur-md animate-sa-fade-in-up",
              isActive ? "border-primary/40 bg-card/70 dark:bg-card/60" :
              block ? "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/40" :
              "border-border bg-card/60",
            )}
          >
            <button onClick={() => onSelectDay(i)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
              <div className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl", isToday ? "gradient-primary text-white shadow-glow" : block ? "bg-amber-100 text-amber-700" : "bg-secondary text-foreground")}>
                <span className={cn("text-[9px] font-bold uppercase tracking-wider leading-none", isToday ? "text-white/85" : block ? "text-amber-500" : "text-muted-foreground")}>{weekdayLabels[i]}</span>
                <span className="font-display text-base font-bold leading-none mt-0.5">{d.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">{d.toLocaleDateString("pt-BR", { weekday: "long" })}</p>
                {block ? (
                  <p className="text-[11px] font-semibold text-amber-600">
                    {block.reason === "ferias" ? "🏖 Férias" : block.reason === "feriado" ? "Feriado" : "Agenda bloqueada"}
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-muted-foreground">{dayAppts.length === 0 ? "Sem agendamentos" : `${dayAppts.length} agendamento${dayAppts.length > 1 ? "s" : ""}`}</p>
                )}
              </div>
              {dayAppts.length > 0 && !block && (
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
                        className={cn("flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.99]", a.status === "concluido" ? "border-border/60 bg-muted/40 opacity-60" : "border-border/60 bg-card/70")}
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
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({ appointments, scheduleBlocks, viewDate, onPickDay }: {
  appointments: UIAppointment[];
  scheduleBlocks: BlockEntry[];
  viewDate: Date;
  onPickDay: (d: Date) => void;
}) {
  const today = new Date();
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
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
          const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dayAppts  = byDate.get(d) ?? [];
          const dayCounts = statusOrder.map((s) => ({ s, n: dayAppts.filter((a) => a.status === s).length })).filter((x) => x.n > 0);
          const dateStr   = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const block     = scheduleBlocks.find((b) => dateStr >= b.start_date && dateStr <= b.end_date);
          return (
            <button key={i} onClick={() => onPickDay(new Date(year, month, d))}
              className={cn("relative flex h-16 flex-col justify-between p-1 text-left transition-all active:scale-[0.98]",
                !isLastCol && "border-r border-border/60",
                !isLastRow && "border-b border-border/60",
                isToday ? "bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground" :
                block ? "bg-amber-50/80 hover:bg-amber-100/80" :
                dayAppts.length > 0 ? "bg-white/60 hover:bg-white/90" :
                "bg-white/30 hover:bg-white/50"
              )}
            >
              <span className={cn("font-display text-2xl font-extrabold leading-none tracking-tight",
                isToday ? "text-white" : block ? "text-amber-600" : dayAppts.length > 0 ? "text-foreground" : "text-muted-foreground/50"
              )}>{d}</span>
              {block && !isToday && (
                <span className="text-[7px] font-bold uppercase tracking-widest text-amber-500 leading-none">
                  {block.reason === "ferias" ? "Fér." : block.reason === "feriado" ? "Fer." : "Bloq."}
                </span>
              )}
              {dayAppts.length > 0 && !block && (
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
