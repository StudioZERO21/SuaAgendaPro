import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Clock,
  Coffee,
  CalendarOff,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horários de atendimento — SuaAgenda.Pro" },
      {
        name: "description",
        content:
          "Configure dias, horários, intervalo de almoço e bloqueios de agenda.",
      },
    ],
  }),
  component: HorariosPage,
});

const STORAGE_KEY = "sa.horarios";

type DayId = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

const DAYS: { id: DayId; label: string; short: string }[] = [
  { id: "dom", label: "Domingo", short: "Dom" },
  { id: "seg", label: "Segunda", short: "Seg" },
  { id: "ter", label: "Terça", short: "Ter" },
  { id: "qua", label: "Quarta", short: "Qua" },
  { id: "qui", label: "Quinta", short: "Qui" },
  { id: "sex", label: "Sexta", short: "Sex" },
  { id: "sab", label: "Sábado", short: "Sáb" },
];

type DaySchedule = {
  open: boolean;
  start: string;
  end: string;
  lunch: { enabled: boolean; start: string; end: string };
};

type BlockReason = "ferias" | "licenca" | "manutencao" | "feriado" | "outro";

type Block = {
  id: string;
  reason: BlockReason;
  title: string;
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd
  allDay: boolean;
  startTime?: string;
  endTime?: string;
};

type Mode = "uniform" | "custom";

type Schedule = {
  mode: Mode; // uniform = mesmo horário p/ dias úteis (com sábado separado), custom = cada dia
  uniform: { start: string; end: string };
  saturday: DaySchedule;
  lunchAll: { enabled: boolean; start: string; end: string };
  days: Record<DayId, DaySchedule>;
  blocks: Block[];
};

const defaultDay = (open: boolean): DaySchedule => ({
  open,
  start: "09:00",
  end: "18:00",
  lunch: { enabled: true, start: "12:00", end: "13:00" },
});

const DEFAULTS: Schedule = {
  mode: "uniform",
  uniform: { start: "09:00", end: "18:00" },
  saturday: {
    open: true,
    start: "09:00",
    end: "14:00",
    lunch: { enabled: false, start: "12:00", end: "13:00" },
  },
  lunchAll: { enabled: true, start: "12:00", end: "13:00" },
  days: {
    dom: defaultDay(false),
    seg: defaultDay(false),
    ter: defaultDay(true),
    qua: defaultDay(true),
    qui: defaultDay(true),
    sex: defaultDay(true),
    sab: { ...defaultDay(true), end: "14:00", lunch: { enabled: false, start: "12:00", end: "13:00" } },
  },
  blocks: [],
};

function load(): Schedule {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, days: { ...DEFAULTS.days, ...(parsed.days ?? {}) } };
  } catch {
    return DEFAULTS;
  }
}

const REASONS: { id: BlockReason; label: string }[] = [
  { id: "ferias", label: "Férias" },
  { id: "licenca", label: "Licença" },
  { id: "manutencao", label: "Manutenção" },
  { id: "feriado", label: "Feriado" },
  { id: "outro", label: "Outro" },
];

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function HorariosPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Schedule>(DEFAULTS);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  useEffect(() => {
    setData(load());
  }, []);

  function save() {
    // validações simples
    for (const day of DAYS) {
      const d = data.days[day.id];
      if (d.open && d.start >= d.end) {
        toast.error(`Horário inválido em ${day.label}`);
        return;
      }
      if (d.open && d.lunch.enabled && d.lunch.start >= d.lunch.end) {
        toast.error(`Almoço inválido em ${day.label}`);
        return;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast.success("Horários salvos!");
  }

  function setDay(id: DayId, patch: Partial<DaySchedule>) {
    setData((s) => ({ ...s, days: { ...s.days, [id]: { ...s.days[id], ...patch } } }));
  }

  function setDayLunch(id: DayId, patch: Partial<DaySchedule["lunch"]>) {
    setData((s) => ({
      ...s,
      days: { ...s.days, [id]: { ...s.days[id], lunch: { ...s.days[id].lunch, ...patch } } },
    }));
  }

  function applyUniformToAll() {
    setData((s) => {
      const nd = { ...s.days };
      for (const day of DAYS) {
        if (day.id === "sab" || day.id === "dom") continue;
        if (nd[day.id].open) {
          nd[day.id] = {
            ...nd[day.id],
            start: s.uniform.start,
            end: s.uniform.end,
            lunch: { ...s.lunchAll },
          };
        }
      }
      return { ...s, days: nd };
    });
    toast.success("Horário aplicado aos dias úteis");
  }

  function openNewBlock() {
    const today = new Date().toISOString().slice(0, 10);
    setEditingBlock({
      id: crypto.randomUUID(),
      reason: "ferias",
      title: "",
      start: today,
      end: today,
      allDay: true,
    });
    setBlockOpen(true);
  }

  function saveBlock() {
    if (!editingBlock) return;
    if (!editingBlock.start || !editingBlock.end) {
      toast.error("Informe as datas");
      return;
    }
    if (editingBlock.start > editingBlock.end) {
      toast.error("Data final deve ser posterior");
      return;
    }
    setData((s) => {
      const exists = s.blocks.some((b) => b.id === editingBlock.id);
      const blocks = exists
        ? s.blocks.map((b) => (b.id === editingBlock.id ? editingBlock : b))
        : [...s.blocks, editingBlock];
      return { ...s, blocks };
    });
    setBlockOpen(false);
    setEditingBlock(null);
    toast.success("Bloqueio salvo");
  }

  function deleteBlock(id: string) {
    setData((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) }));
  }

  const openDaysCount = DAYS.filter((d) => data.days[d.id].open).length;

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Agenda
          </p>
          <h1 className="truncate font-display text-lg font-bold">
            Horários de atendimento
          </h1>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-5 pb-32 pt-5">
        {/* Resumo */}
        <section className="rounded-3xl p-5 text-white shadow-glow" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-glow))" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-bold leading-tight">
                {openDaysCount} dia{openDaysCount === 1 ? "" : "s"} de atendimento
              </p>
              <p className="text-xs text-white/80">
                Configure como sua agenda funciona
              </p>
            </div>
          </div>
        </section>

        {/* Modo */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Como configurar?</h2>
            <p className="text-xs text-muted-foreground">
              Use o mesmo horário para os dias úteis ou personalize cada dia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "uniform", label: "Mesmo horário" },
                { id: "custom", label: "Personalizado" },
              ] as const
            ).map((m) => {
              const active = data.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setData((s) => ({ ...s, mode: m.id }))}
                  className={cn(
                    "rounded-2xl border p-3 text-sm font-semibold transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dias da semana — toggles */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Dias de atendimento</h2>
            <p className="text-xs text-muted-foreground">
              Desative os dias em que você não trabalha.
            </p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => {
              const active = data.days[d.id].open;
              return (
                <button
                  key={d.id}
                  onClick={() => setDay(d.id, { open: !active })}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border py-2 text-[11px] font-bold transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-secondary/40 text-muted-foreground",
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
        </section>

        {/* Modo uniforme */}
        {data.mode === "uniform" && (
          <>
            <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
              <div>
                <h2 className="font-display text-base font-bold">Dias úteis</h2>
                <p className="text-xs text-muted-foreground">
                  Mesmo horário de segunda a sexta.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  label="Abre"
                  value={data.uniform.start}
                  onChange={(v) => setData((s) => ({ ...s, uniform: { ...s.uniform, start: v } }))}
                />
                <TimeField
                  label="Fecha"
                  value={data.uniform.end}
                  onChange={(v) => setData((s) => ({ ...s, uniform: { ...s.uniform, end: v } }))}
                />
              </div>

              <LunchBlock
                value={data.lunchAll}
                onToggle={(en) => setData((s) => ({ ...s, lunchAll: { ...s.lunchAll, enabled: en } }))}
                onChange={(p) => setData((s) => ({ ...s, lunchAll: { ...s.lunchAll, ...p } }))}
              />

              <Button
                variant="outline"
                onClick={applyUniformToAll}
                className="h-10 w-full rounded-xl text-xs font-semibold"
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Aplicar aos dias úteis
              </Button>
            </section>

            {/* Sábado separado */}
            <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold">Sábado</h2>
                  <p className="text-xs text-muted-foreground">
                    Geralmente é um horário diferente.
                  </p>
                </div>
                <Switch
                  checked={data.days.sab.open}
                  onCheckedChange={(v) => setDay("sab", { open: v })}
                />
              </div>
              {data.days.sab.open && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Abre"
                      value={data.days.sab.start}
                      onChange={(v) => setDay("sab", { start: v })}
                    />
                    <TimeField
                      label="Fecha"
                      value={data.days.sab.end}
                      onChange={(v) => setDay("sab", { end: v })}
                    />
                  </div>
                  <LunchBlock
                    value={data.days.sab.lunch}
                    onToggle={(en) => setDayLunch("sab", { enabled: en })}
                    onChange={(p) => setDayLunch("sab", p)}
                  />
                </>
              )}
            </section>
          </>
        )}

        {/* Modo personalizado */}
        {data.mode === "custom" && (
          <section className="space-y-3">
            {DAYS.filter((d) => data.days[d.id].open).map((d) => {
              const ds = data.days[d.id];
              return (
                <div
                  key={d.id}
                  className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-bold">{d.label}</h3>
                    <Switch
                      checked={ds.open}
                      onCheckedChange={(v) => setDay(d.id, { open: v })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField
                      label="Abre"
                      value={ds.start}
                      onChange={(v) => setDay(d.id, { start: v })}
                    />
                    <TimeField
                      label="Fecha"
                      value={ds.end}
                      onChange={(v) => setDay(d.id, { end: v })}
                    />
                  </div>
                  <LunchBlock
                    value={ds.lunch}
                    onToggle={(en) => setDayLunch(d.id, { enabled: en })}
                    onChange={(p) => setDayLunch(d.id, p)}
                  />
                </div>
              );
            })}
            {DAYS.filter((d) => data.days[d.id].open).length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Ative ao menos um dia acima.
              </p>
            )}
          </section>
        )}

        {/* Bloqueios */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">Bloqueios de agenda</h2>
              <p className="text-xs text-muted-foreground">
                Férias, licença, manutenção e feriados.
              </p>
            </div>
            <Button
              size="sm"
              onClick={openNewBlock}
              className="h-9 rounded-full gradient-primary px-3 text-xs font-semibold text-white shadow-glow"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Novo
            </Button>
          </div>

          {data.blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center">
              <CalendarOff className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhum bloqueio</p>
              <p className="text-xs text-muted-foreground">
                Adicione períodos em que sua agenda fica indisponível.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.blocks.map((b) => {
                const reason = REASONS.find((r) => r.id === b.reason);
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-soft text-primary">
                      <CalendarOff className="h-4 w-4" />
                    </div>
                    <button
                      onClick={() => {
                        setEditingBlock(b);
                        setBlockOpen(true);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold">
                        {b.title || reason?.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {fmtDate(b.start)}
                        {b.start !== b.end && ` — ${fmtDate(b.end)}`}
                        {!b.allDay && b.startTime && ` · ${b.startTime}–${b.endTime}`}
                        {" · "}
                        {reason?.label}
                      </p>
                    </button>
                    <button
                      onClick={() => deleteBlock(b.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar horários
        </Button>
      </div>

      {/* Dialog: bloqueio */}
      <Dialog open={blockOpen} onOpenChange={(o) => { setBlockOpen(o); if (!o) setEditingBlock(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bloquear agenda</DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Select
                  value={editingBlock.reason}
                  onValueChange={(v) =>
                    setEditingBlock({ ...editingBlock, reason: v as BlockReason })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Título (opcional)</Label>
                <Input
                  value={editingBlock.title}
                  placeholder="Ex.: Viagem de férias"
                  onChange={(e) =>
                    setEditingBlock({ ...editingBlock, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>De</Label>
                  <Input
                    type="date"
                    value={editingBlock.start}
                    onChange={(e) =>
                      setEditingBlock({ ...editingBlock, start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Até</Label>
                  <Input
                    type="date"
                    value={editingBlock.end}
                    onChange={(e) =>
                      setEditingBlock({ ...editingBlock, end: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
                <div>
                  <p className="text-sm font-semibold">Dia inteiro</p>
                  <p className="text-[11px] text-muted-foreground">
                    Bloquear todo o expediente
                  </p>
                </div>
                <Switch
                  checked={editingBlock.allDay}
                  onCheckedChange={(v) =>
                    setEditingBlock({
                      ...editingBlock,
                      allDay: v,
                      startTime: v ? undefined : editingBlock.startTime ?? "09:00",
                      endTime: v ? undefined : editingBlock.endTime ?? "18:00",
                    })
                  }
                />
              </div>

              {!editingBlock.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <TimeField
                    label="Início"
                    value={editingBlock.startTime ?? "09:00"}
                    onChange={(v) =>
                      setEditingBlock({ ...editingBlock, startTime: v })
                    }
                  />
                  <TimeField
                    label="Fim"
                    value={editingBlock.endTime ?? "18:00"}
                    onChange={(v) =>
                      setEditingBlock({ ...editingBlock, endTime: v })
                    }
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => { setBlockOpen(false); setEditingBlock(null); }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveBlock}
              className="flex-1 gradient-primary text-white shadow-glow"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-base"
      />
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
          <p className="text-sm font-semibold">Horário de almoço</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={onToggle} />
      </div>
      {value.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <TimeField
            label="Início"
            value={value.start}
            onChange={(v) => onChange({ start: v })}
          />
          <TimeField
            label="Fim"
            value={value.end}
            onChange={(v) => onChange({ end: v })}
          />
        </div>
      )}
    </div>
  );
}
