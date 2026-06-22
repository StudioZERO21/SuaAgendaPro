import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Loader2,
  Activity,
  ArrowUpRight,
  AlertCircle,
  Timer,
  Zap,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/google-calendar")({
  head: () => ({
    meta: [
      { title: "Google Calendar — SuaAgenda.Pro" },
      {
        name: "description",
        content:
          "Conecte sua conta Google e sincronize seus agendamentos automaticamente.",
      },
    ],
  }),
  component: GoogleCalendarPage,
});

const STORAGE_KEY = "sa.googleCalendar";

type Settings = {
  connected: boolean;
  email: string | null;
  calendarId: string;
  syncCreate: boolean;
  syncUpdate: boolean;
  syncCancel: boolean;
  includeClientName: boolean;
  reminderMinutes: number;
  lastSyncAt: string | null;
  syncedCount: number;
  pendingCount: number;
  autoSyncEnabled: boolean;
  autoSyncInterval: number; // minutes
};

const DEFAULTS: Settings = {
  connected: false,
  email: null,
  calendarId: "primary",
  syncCreate: true,
  syncUpdate: true,
  syncCancel: true,
  includeClientName: true,
  reminderMinutes: 30,
  lastSyncAt: null,
  syncedCount: 0,
  pendingCount: 0,
  autoSyncEnabled: true,
  autoSyncInterval: 15,
};

type SyncState = "idle" | "connecting" | "syncing" | "success" | "error";

const CONNECT_STEPS = [
  "Abrindo o Google",
  "Autorizando acesso",
  "Carregando calendários",
  "Pronto!",
];

const SYNC_STEPS = [
  "Lendo agendamentos",
  "Comparando com o Google",
  "Enviando alterações",
  "Sincronizado!",
];

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function persist(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function GoogleCalendarPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Settings>(DEFAULTS);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [step, setStep] = useState(0);

  useEffect(() => {
    setData(load());
  }, []);

  function update(patch: Partial<Settings>) {
    setData((s) => {
      const next = { ...s, ...patch };
      persist(next);
      return next;
    });
  }

  async function runSteps(steps: string[]) {
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 550));
    }
  }

  async function handleConnect() {
    setSyncState("connecting");
    await runSteps(CONNECT_STEPS);
    update({
      connected: true,
      email: "studio.beleza@gmail.com",
      lastSyncAt: new Date().toISOString(),
      syncedCount: 12,
      pendingCount: 0,
    });
    setSyncState("success");
    toast.success("Google Calendar conectado ✨");
    setTimeout(() => setSyncState("idle"), 1800);
  }

  function handleDisconnect() {
    update({
      connected: false,
      email: null,
      lastSyncAt: null,
      syncedCount: 0,
      pendingCount: 0,
    });
    setSyncState("idle");
    toast.success("Conta Google desconectada");
  }

  async function handleSyncNow() {
    setSyncState("syncing");
    await runSteps(SYNC_STEPS);
    update({
      lastSyncAt: new Date().toISOString(),
      syncedCount: data.syncedCount + Math.floor(Math.random() * 3),
      pendingCount: 0,
    });
    setSyncState("success");
    toast.success("Agenda sincronizada");
    setTimeout(() => setSyncState("idle"), 1800);
  }

  // Auto-sync agendado
  useEffect(() => {
    if (!data.connected || !data.autoSyncEnabled) return;
    const id = setInterval(
      () => {
        if (syncState === "idle") {
          handleSyncNow();
        }
      },
      data.autoSyncInterval * 60 * 1000,
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.connected, data.autoSyncEnabled, data.autoSyncInterval, syncState]);

  const busy = syncState === "connecting" || syncState === "syncing";

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/mais" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Integração
          </p>
          <h1 className="truncate font-display text-lg font-bold">
            Google Calendar
          </h1>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-28 pt-4 sm:space-y-5 sm:px-5 sm:pt-5">
        {/* Hero rosa premium */}
        <section
          className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-glow"
          style={{
            background:
              "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #9d174d 100%)",
          }}
        >
          {/* Aurora orbs */}
          <motion.div
            className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/25 blur-3xl"
            animate={{ x: [0, 12, 0], y: [0, 8, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-fuchsia-300/30 blur-3xl"
            animate={{ x: [0, -10, 0], y: [0, -8, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex items-start gap-3">
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-2xl bg-white/20 blur-md"
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Sincronização inteligente
              </p>
              <p className="font-display text-xl font-bold leading-tight">
                Sua agenda no Google
              </p>
              <p className="mt-0.5 text-xs text-white/80">
                Tudo que acontece aqui aparece lá. Automático.
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-[11px] backdrop-blur-md ring-1 ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>OAuth seguro · você desconecta quando quiser</span>
          </div>
        </section>

        {/* Connection card */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-2xl transition",
                  data.connected
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/30"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {data.connected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-primary/20"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                )}
                {data.connected ? (
                  <CheckCircle2 className="relative h-5 w-5" />
                ) : (
                  <CircleDot className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">
                  {data.connected ? "Conectado" : "Não conectado"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {data.connected
                    ? data.email
                    : "Conecte sua conta para começar"}
                </p>
              </div>
            </div>
            {data.connected && <LivePill />}
          </div>

          <div className="relative mt-4">
            {!data.connected ? (
              <Button
                onClick={handleConnect}
                disabled={busy}
                className="h-12 w-full rounded-2xl bg-white text-foreground shadow-card ring-1 ring-border hover:bg-secondary"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-semibold">Conectando...</span>
                  </>
                ) : (
                  <>
                    <GoogleGlyph />
                    <span className="ml-2 text-sm font-semibold">
                      Continuar com Google
                    </span>
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSyncNow}
                  disabled={busy}
                  className="h-11 flex-1 rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow"
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {busy ? "Sincronizando..." : "Sincronizar agora"}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="h-11 rounded-2xl text-sm"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Sync status */}
        {data.connected && (
          <SyncStatusCard
            state={syncState}
            step={step}
            steps={syncState === "connecting" ? CONNECT_STEPS : SYNC_STEPS}
            lastSyncAt={data.lastSyncAt}
            synced={data.syncedCount}
            pending={data.pendingCount}
          />
        )}

        {/* Premium loading overlay during connecting */}
        <AnimatePresence>
          {syncState === "connecting" && !data.connected && (
            <ConnectingOverlay step={step} />
          )}
        </AnimatePresence>

        {/* Sync automática + Preferências - só após conectar */}
        {data.connected && (
          <>
            {/* Sincronização automática */}
            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold">
                    Sincronização automática
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Mantém o Google sempre atualizado em segundo plano.
                  </p>
                </div>
                <Switch
                  checked={data.autoSyncEnabled}
                  onCheckedChange={(v) => update({ autoSyncEnabled: v })}
                />
              </div>

              <div
                className={cn(
                  "space-y-2 transition",
                  !data.autoSyncEnabled && "pointer-events-none opacity-50",
                )}
              >
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Timer className="h-3.5 w-3.5 text-primary" />
                  Frequência
                </Label>
                <Select
                  value={String(data.autoSyncInterval)}
                  onValueChange={(v) =>
                    update({ autoSyncInterval: Number(v) })
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">A cada 5 minutos</SelectItem>
                    <SelectItem value="15">A cada 15 minutos</SelectItem>
                    <SelectItem value="30">A cada 30 minutos</SelectItem>
                    <SelectItem value="60">A cada 1 hora</SelectItem>
                    <SelectItem value="240">A cada 4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* O que sincronizar */}
            <section className="space-y-1 rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3">
                <h2 className="font-display text-base font-bold">
                  O que sincronizar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tudo é sincronizado do app para o Google automaticamente.
                </p>
              </div>

              <Row
                title="Novos agendamentos"
                desc="Cria evento no Google ao marcar um horário"
                checked={data.syncCreate}
                onChange={(v) => update({ syncCreate: v })}
              />
              <Row
                title="Remarcações"
                desc="Atualiza o evento quando o horário muda"
                checked={data.syncUpdate}
                onChange={(v) => update({ syncUpdate: v })}
              />
              <Row
                title="Cancelamentos"
                desc="Remove o evento do Google quando cancelar"
                checked={data.syncCancel}
                onChange={(v) => update({ syncCancel: v })}
              />
              <Row
                title="Incluir nome da cliente"
                desc="Mostra o nome no título do evento"
                checked={data.includeClientName}
                onChange={(v) => update({ includeClientName: v })}
              />
            </section>

            {/* Preferências */}
            <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
              <div>
                <h2 className="font-display text-base font-bold">
                  Preferências
                </h2>
                <p className="text-xs text-muted-foreground">
                  Onde os eventos serão criados.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Calendário destino
                </Label>
                <Select
                  value={data.calendarId}
                  onValueChange={(v) => update({ calendarId: v })}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">
                      Meu calendário (principal)
                    </SelectItem>
                    <SelectItem value="work">Trabalho</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Lembrete no Google
                </Label>
                <Select
                  value={String(data.reminderMinutes)}
                  onValueChange={(v) =>
                    update({ reminderMinutes: Number(v) })
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem lembrete</SelectItem>
                    <SelectItem value="10">10 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="1440">1 dia antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>
          </>
        )}

        {/* Permissions */}
        <section className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold">
              O que pediremos para o Google
            </h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <Perm>Ver e gerenciar eventos do seu calendário</Perm>
            <Perm>Ver o e-mail da conta conectada</Perm>
            <Perm>Acesso somente ao calendário escolhido</Perm>
          </ul>
        </section>
      </main>
    </MobileShell>
  );
}

function LivePill() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        Ao vivo
      </span>
    </div>
  );
}

function SyncStatusCard({
  state,
  step,
  steps,
  lastSyncAt,
  synced,
  pending,
}: {
  state: SyncState;
  step: number;
  steps: string[];
  lastSyncAt: string | null;
  synced: number;
  pending: number;
}) {
  const busy = state === "connecting" || state === "syncing";
  const progress = busy ? ((step + 1) / steps.length) * 100 : 100;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-card">
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-bold">Status</p>
            <p className="text-[11px] text-muted-foreground">
              {state === "syncing"
                ? "Sincronizando agora"
                : state === "success"
                ? "Tudo certo"
                : state === "error"
                ? "Falha na última sincronização"
                : "Pronto para sincronizar"}
            </p>
          </div>
        </div>

        <StatusBadge state={state} />
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {busy && (
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Step text */}
      <div className="relative mt-2 flex h-4 items-center text-[11px] text-muted-foreground">
        <AnimatePresence mode="wait">
          <motion.span
            key={busy ? steps[step] : "ready"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            {busy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {busy
              ? steps[step]
              : lastSyncAt
              ? `Última sync: ${new Date(lastSyncAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Nenhuma sincronização ainda"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Counters */}
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <Stat icon={<Check className="h-3.5 w-3.5" />} label="Sincronizados" value={synced} tone="emerald" />
        <Stat
          icon={pending > 0 ? <AlertCircle className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          label="Pendentes"
          value={pending}
          tone={pending > 0 ? "amber" : "primary"}
        />
      </div>
    </section>
  );
}

function StatusBadge({ state }: { state: SyncState }) {
  const map = {
    idle: { label: "Conectado", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    connecting: { label: "Conectando", cls: "bg-primary/10 text-primary ring-primary/20" },
    syncing: { label: "Sincronizando", cls: "bg-primary/10 text-primary ring-primary/20" },
    success: { label: "Sincronizado", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    error: { label: "Erro", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  } as const;
  const s = map[state];
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "emerald" | "primary" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <span className="font-display text-lg font-bold">{value}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ConnectingOverlay({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="mx-6 w-full max-w-xs overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-glow"
      >
        {/* Animated rings */}
        <div className="relative mx-auto mb-5 h-20 w-20">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
          />
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-glow"
            style={{
              background:
                "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #9d174d 100%)",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <CalendarDays className="h-7 w-7" />
            </motion.div>
          </div>
        </div>

        <p className="font-display text-base font-bold">Conectando ao Google</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-xs text-muted-foreground"
          >
            {CONNECT_STEPS[step]}
          </motion.p>
        </AnimatePresence>

        {/* Dots */}
        <div className="mt-5 flex justify-center gap-1.5">
          {CONNECT_STEPS.map((_, i) => (
            <motion.span
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-primary",
                i <= step ? "w-6" : "w-1.5 opacity-30",
              )}
              animate={i === step ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Perm({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.1-.1-1.5H12z"
      />
    </svg>
  );
}
