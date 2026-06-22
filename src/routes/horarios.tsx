import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Save, Clock, Coffee, CalendarOff,
  Plus, Trash2, Copy, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useWorkingHours, useSaveWorkingHours,
  useBlockedDates, useAddBlockedRange, useRemoveBlockedDate,
  buildDayMap, DAY_INFO,
} from "@/hooks/useHorarios";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horários de atendimento — SuaAgenda.Pro" },
      { name: "description", content: "Configure dias, horários e bloqueios de agenda." },
    ],
  }),
  component: HorariosPage,
});

type DayState = {
  is_open: boolean;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
};

const DEFAULT_DAY = (open: boolean): DayState => ({
  is_open: open,
  start_time: "09:00",
  end_time: "18:00",
  break_start: open ? "12:00" : null,
  break_end: open ? "13:00" : null,
});

type BlockReason = "ferias" | "licenca" | "manutencao" | "feriado" | "outro";

type NewBlock = {
  reason: BlockReason;
  title: string;
  start: string;
  end: string;
};

const REASONS: { id: BlockReason; label: string }[] = [
  { id: "ferias",     label: "Férias" },
  { id: "licenca",    label: "Licença" },
  { id: "manutencao", label: "Manutenção" },
  { id: "feriado",    label: "Feriado" },
  { id: "outro",      label: "Outro" },
];

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function HorariosPage() {
  const navigate = useNavigate();

  const { data: whRows = [], isLoading: loadingWH } = useWorkingHours();
  const { data: blockedDates = [], isLoading: loadingBD } = useBlockedDates();
  const saveWH     = useSaveWorkingHours();
  const addBlock   = useAddBlockedRange();
  const removeBlock = useRemoveBlockedDate();

  // Local UI state — one entry per day-of-week (0..6)
  const [days, setDays] = useState<Record<number, DayState>>(() =>
    Object.fromEntries(DAY_INFO.map((d) => [d.dow, DEFAULT_DAY(d.dow >= 1 && d.dow <= 5)])),
  );
  const [mode, setMode]           = useState<"uniform" | "custom">("uniform");
  const [uniform, setUniform]     = useState({ start: "09:00", end: "18:00" });
  const [lunchAll, setLunchAll]   = useState({ enabled: true, start: "12:00", end: "13:00" });
  const [blockOpen, setBlockOpen] = useState(false);
  const [newBlock, setNewBlock]   = useState<NewBlock>({
    reason: "ferias", title: "",
    start: new Date().toISOString().slice(0, 10),
    end:   new Date().toISOString().slice(0, 10),
  });

  // Populate from DB once loaded
  useEffect(() => {
    if (whRows.length === 0) return;
    const map = buildDayMap(whRows);
    setDays((prev) => {
      const next = { ...prev };
      for (const info of DAY_INFO) {
        const row = map[info.dow];
        if (row) {
          next[info.dow] = {
            is_open:     row.is_open,
            start_time:  row.start_time ?? "09:00",
            end_time:    row.end_time   ?? "18:00",
            break_start: row.break_start ?? null,
            break_end:   row.break_end   ?? null,
          };
        }
      }
      return next;
    });
  }, [whRows]);

  function setDay(dow: number, patch: Partial<DayState>) {
    setDays((s) => ({ ...s, [dow]: { ...s[dow], ...patch } }));
  }

  function applyUniformToWeekdays() {
    setDays((s) => {
      const next = { ...s };
      for (const info of DAY_INFO) {
        if (info.dow === 0 || info.dow === 6) continue;
        if (next[info.dow].is_open) {
          next[info.dow] = {
            ...next[info.dow],
            start_time:  uniform.start,
            end_time:    uniform.end,
            break_start: lunchAll.enabled ? lunchAll.start : null,
            break_end:   lunchAll.enabled ? lunchAll.end   : null,
          };
        }
      }
      return next;
    });
    toast.success("Horário aplicado aos dias úteis");
  }

  function validate(): boolean {
    for (const info of DAY_INFO) {
      const d = days[info.dow];
      if (!d.is_open) continue;
      if (d.start_time >= d.end_time) {
        toast.error(`Horário inválido em ${info.label}`);
        return false;
      }
      if (d.break_start && d.break_end && d.break_start >= d.break_end) {
        toast.error(`Pausa inválida em ${info.label}`);
        return false;
      }
    }
    if (!DAY_INFO.some((i) => days[i.dow].is_open)) {
      toast.error("Ative ao menos um dia de atendimento.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    const rows = DAY_INFO.map((info) => {
      const d = days[info.dow];
      return {
        day_of_week:  info.dow,
        is_open:      d.is_open,
        start_time:   d.is_open ? d.start_time : null,
        end_time:     d.is_open ? d.end_time   : null,
        break_start:  d.is_open ? d.break_start : null,
        break_end:    d.is_open ? d.break_end   : null,
      };
    });

    try {
      await saveWH.mutateAsync(rows);
      toast.success("Horários salvos!");
    } catch {
      toast.error("Erro ao salvar horários.");
    }
  }

  async function handleAddBlock() {
    if (!newBlock.start || !newBlock.end) { toast.error("Informe as datas"); return; }
    if (newBlock.start > newBlock.end)    { toast.error("Data final deve ser posterior"); return; }
    const reason = REASONS.find((r) => r.id === newBlock.reason);
    const label  = newBlock.title || reason?.label || "";
    try {
      await addBlock.mutateAsync({ start: newBlock.start, end: newBlock.end, reason: label });
      setBlockOpen(false);
      toast.success("Bloqueio salvo");
    } catch {
      toast.error("Erro ao salvar bloqueio.");
    }
  }

  async function handleRemoveBlock(id: string) {
    try {
      await removeBlock.mutateAsync(id);
      toast.success("Bloqueio removido");
    } catch {
      toast.error("Erro ao remover bloqueio.");
    }
  }

  const openCount = DAY_INFO.filter((i) => days[i.dow].is_open).length;
  const loading   = loadingWH || loadingBD;

  return (
    <MobileShell>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/mais" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agenda</p>
          <h1 className="truncate font-display text-lg font-bold">Horários de atendimento</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 space-y-5 px-5 pb-32 pt-5">
          {/* Summary card */}
          <section className="rounded-3xl p-5 text-white shadow-glow" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-glow))" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg font-bold leading-tight">
                  {openCount} dia{openCount === 1 ? "" : "s"} de atendimento
                </p>
                <p className="text-xs text-white/80">Configure como sua agenda funciona</p>
              </div>
            </div>
          </section>

          {/* Mode selector */}
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
            <div>
              <h2 className="font-display text-base font-bold">Como configurar?</h2>
              <p className="text-xs text-muted-foreground">Mesmo horário para os dias úteis ou personalizado por dia.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["uniform", "custom"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-2xl border p-3 text-sm font-semibold transition",
                    mode === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40",
                  )}
                >
                  {m === "uniform" ? "Mesmo horário" : "Personalizado"}
                </button>
              ))}
            </div>
          </section>

          {/* Day toggles */}
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
            <div>
              <h2 className="font-display text-base font-bold">Dias de atendimento</h2>
              <p className="text-xs text-muted-foreground">Desative os dias em que você não trabalha.</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_INFO.map((info) => {
                const open = days[info.dow].is_open;
                return (
                  <button
                    key={info.dow}
                    onClick={() => setDay(info.dow, { is_open: !open })}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border py-2 text-[11px] font-bold transition",
                      open
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-secondary/40 text-muted-foreground",
                    )}
                  >
                    {info.short}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Uniform mode — weekdays */}
          {mode === "uniform" && (
            <>
              <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
                <div>
                  <h2 className="font-display text-base font-bold">Dias úteis (Seg–Sex)</h2>
                  <p className="text-xs text-muted-foreground">Mesmo horário de segunda a sexta.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TimeField label="Abre"  value={uniform.start} onChange={(v) => setUniform((s) => ({ ...s, start: v }))} />
                  <TimeField label="Fecha" value={uniform.end}   onChange={(v) => setUniform((s) => ({ ...s, end: v }))}   />
                </div>
                <LunchBlock
                  value={lunchAll}
                  onToggle={(en) => setLunchAll((s) => ({ ...s, enabled: en }))}
                  onChange={(p)  => setLunchAll((s) => ({ ...s, ...p }))}
                />
                <Button variant="outline" onClick={applyUniformToWeekdays} className="h-10 w-full rounded-xl text-xs font-semibold">
                  <Copy className="mr-2 h-3.5 w-3.5" /> Aplicar aos dias úteis
                </Button>
              </section>

              {/* Saturday */}
              <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold">Sábado</h2>
                    <p className="text-xs text-muted-foreground">Geralmente é um horário diferente.</p>
                  </div>
                  <Switch checked={days[6].is_open} onCheckedChange={(v) => setDay(6, { is_open: v })} />
                </div>
                {days[6].is_open && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <TimeField label="Abre"  value={days[6].start_time} onChange={(v) => setDay(6, { start_time: v })} />
                      <TimeField label="Fecha" value={days[6].end_time}   onChange={(v) => setDay(6, { end_time: v })}   />
                    </div>
                    <LunchBlock
                      value={{
                        enabled: Boolean(days[6].break_start),
                        start:   days[6].break_start ?? "12:00",
                        end:     days[6].break_end   ?? "13:00",
                      }}
                      onToggle={(en) => setDay(6, { break_start: en ? "12:00" : null, break_end: en ? "13:00" : null })}
                      onChange={(p)  => setDay(6, {
                        ...(p.start !== undefined && { break_start: p.start }),
                        ...(p.end   !== undefined && { break_end:   p.end }),
                      })}
                    />
                  </>
                )}
              </section>
            </>
          )}

          {/* Custom mode */}
          {mode === "custom" && (
            <section className="space-y-3">
              {DAY_INFO.filter((i) => days[i.dow].is_open).map((info) => {
                const d = days[info.dow];
                return (
                  <div key={info.dow} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-bold">{info.label}</h3>
                      <Switch checked={d.is_open} onCheckedChange={(v) => setDay(info.dow, { is_open: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <TimeField label="Abre"  value={d.start_time} onChange={(v) => setDay(info.dow, { start_time: v })} />
                      <TimeField label="Fecha" value={d.end_time}   onChange={(v) => setDay(info.dow, { end_time: v })}   />
                    </div>
                    <LunchBlock
                      value={{
                        enabled: Boolean(d.break_start),
                        start:   d.break_start ?? "12:00",
                        end:     d.break_end   ?? "13:00",
                      }}
                      onToggle={(en) => setDay(info.dow, { break_start: en ? "12:00" : null, break_end: en ? "13:00" : null })}
                      onChange={(p)  => setDay(info.dow, {
                        ...(p.start !== undefined && { break_start: p.start }),
                        ...(p.end   !== undefined && { break_end:   p.end }),
                      })}
                    />
                  </div>
                );
              })}
              {DAY_INFO.filter((i) => days[i.dow].is_open).length === 0 && (
                <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  Ative ao menos um dia acima.
                </p>
              )}
            </section>
          )}

          {/* Blocked dates */}
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold">Bloqueios de agenda</h2>
                <p className="text-xs text-muted-foreground">Férias, feriados e datas indisponíveis.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setBlockOpen(true)}
                className="h-9 rounded-full gradient-primary px-3 text-xs font-semibold text-white shadow-glow"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Novo
              </Button>
            </div>

            {blockedDates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center">
                <CalendarOff className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-semibold">Nenhum bloqueio</p>
                <p className="text-xs text-muted-foreground">Adicione períodos em que sua agenda fica indisponível.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {blockedDates.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-soft text-primary">
                      <CalendarOff className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{fmtDate(b.blocked_date)}</p>
                      {b.reason && <p className="text-[11px] text-muted-foreground">{b.reason}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveBlock(b.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                      aria-label="Remover"
                    >
                      {removeBlock.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}

      {/* Sticky save button */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={handleSave}
          disabled={saveWH.isPending || loading}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          {saveWH.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {saveWH.isPending ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>

      {/* Dialog — new block */}
      <Dialog open={blockOpen} onOpenChange={(o) => { setBlockOpen(o); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bloquear agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Select
                value={newBlock.reason}
                onValueChange={(v) => setNewBlock((s) => ({ ...s, reason: v as BlockReason }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título (opcional)</Label>
              <Input
                value={newBlock.title}
                placeholder="Ex.: Viagem de férias"
                onChange={(e) => setNewBlock((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>De</Label>
                <Input type="date" value={newBlock.start} onChange={(e) => setNewBlock((s) => ({ ...s, start: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Até</Label>
                <Input type="date" value={newBlock.end}   onChange={(e) => setNewBlock((s) => ({ ...s, end: e.target.value }))}   />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setBlockOpen(false)} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleAddBlock}
              disabled={addBlock.isPending}
              className="flex-1 gradient-primary text-white shadow-glow"
            >
              {addBlock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="text-base" />
    </div>
  );
}

function LunchBlock({
  value,
  onToggle,
  onChange,
}: {
  value: { enabled: boolean; start: string; end: string };
  onToggle: (v: boolean) => void;
  onChange: (p: Partial<{ start: string; end: string }>) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Horário de almoço / pausa</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={onToggle} />
      </div>
      {value.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <TimeField label="Início" value={value.start} onChange={(v) => onChange({ start: v })} />
          <TimeField label="Fim"    value={value.end}   onChange={(v) => onChange({ end: v })}   />
        </div>
      )}
    </div>
  );
}
