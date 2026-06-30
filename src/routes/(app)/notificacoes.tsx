import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Bell,
  MessageCircle,
  Mail,
  Phone,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  RotateCcw,
  Star,
  Gift,
  CreditCard,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { PhoneInputBR } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";
import { pushSupported, isPushSubscribed, enablePush, disablePush } from "@/lib/push-client";

// Toggle de notificações push do PWA (por aparelho)
function PushToggleCard() {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(pushSupported());
    isPushSubscribed().then(setOn);
  }, []);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      if (next) {
        const r = await enablePush();
        if (r.ok) { setOn(true); toast.success("Notificações push ativadas neste aparelho 🔔"); }
        else if (r.reason === "denied") toast.error("Permissão negada. Libere as notificações nas configurações do navegador.");
        else if (r.reason === "no_vapid") toast.error("Push ainda não configurado no servidor (VAPID).");
        else if (r.reason === "unsupported") toast.error("Este navegador não suporta notificações push.");
        else toast.error("Não foi possível ativar agora.");
      } else {
        await disablePush();
        setOn(false);
        toast.message("Notificações push desativadas neste aparelho.");
      }
    } finally { setBusy(false); }
  }

  if (!supported) return null;

  return (
    <section className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-soft text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold">Notificações no aparelho</p>
          <p className="text-xs text-muted-foreground">Receba avisos (novo agendamento, etc.) mesmo com o app fechado.</p>
        </div>
      </div>
      <Switch checked={on} disabled={busy} onCheckedChange={toggle} />
    </section>
  );
}

export const Route = createFileRoute("/(app)/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — SuaAgenda.Pro" },
      {
        name: "description",
        content:
          "Configure quais notificações enviar por WhatsApp e e-mail.",
      },
    ],
  }),
  component: NotificacoesPage,
});

const STORAGE_KEY = "sa.notificacoes";

type ChannelPrefs = { whatsapp: boolean; email: boolean };

type NotifId =
  | "newBooking"
  | "confirmation"
  | "reminder24h"
  | "reminder2h"
  | "reschedule"
  | "cancellation"
  | "noShow"
  | "thanks"
  | "review"
  | "birthday"
  | "comeback"
  | "paymentReceived"
  | "paymentPending"
  | "promotions";

type NotifDef = {
  id: NotifId;
  label: string;
  desc: string;
  icon: LucideIcon;
  audience: "cliente" | "profissional";
  hasTiming?: boolean; // só relevante p/ lembretes
};

type NotifConfig = {
  enabled: boolean;
  channels: ChannelPrefs;
  hours?: number; // antecedência em horas (lembretes)
};

type Settings = {
  global: {
    whatsapp: boolean;
    email: boolean;
    whatsappNumber: string;
    senderEmail: string;
    quietHours: { enabled: boolean; start: string; end: string };
  };
  notifications: Record<NotifId, NotifConfig>;
};

const GROUPS: { title: string; items: NotifDef[] }[] = [
  {
    title: "Agendamentos",
    items: [
      {
        id: "newBooking",
        label: "Novo agendamento",
        desc: "Avisar quando uma cliente agenda um horário",
        icon: CalendarCheck,
        audience: "profissional",
      },
      {
        id: "confirmation",
        label: "Confirmação para a cliente",
        desc: "Enviada logo após o agendamento",
        icon: CalendarCheck,
        audience: "cliente",
      },
      {
        id: "reminder24h",
        label: "Lembrete antecipado",
        desc: "Lembrete antes do horário (cliente)",
        icon: CalendarClock,
        audience: "cliente",
        hasTiming: true,
      },
      {
        id: "reminder2h",
        label: "Lembrete próximo do horário",
        desc: "Segundo lembrete mais perto do atendimento",
        icon: Bell,
        audience: "cliente",
        hasTiming: true,
      },
      {
        id: "reschedule",
        label: "Reagendamento",
        desc: "Avisar quando um horário é alterado",
        icon: RotateCcw,
        audience: "cliente",
      },
      {
        id: "cancellation",
        label: "Cancelamento",
        desc: "Avisar quando um agendamento é cancelado",
        icon: CalendarX,
        audience: "cliente",
      },
      {
        id: "noShow",
        label: "No-show / falta",
        desc: "Mensagem após a cliente faltar",
        icon: AlertCircle,
        audience: "cliente",
      },
    ],
  },
  {
    title: "Pós-atendimento",
    items: [
      {
        id: "thanks",
        label: "Agradecimento",
        desc: "Mensagem após o atendimento",
        icon: Sparkles,
        audience: "cliente",
      },
      {
        id: "review",
        label: "Pedido de avaliação",
        desc: "Convidar a cliente a avaliar o serviço",
        icon: Star,
        audience: "cliente",
      },
    ],
  },
  {
    title: "Relacionamento",
    items: [
      {
        id: "birthday",
        label: "Aniversário",
        desc: "Parabéns no dia do aniversário",
        icon: Gift,
        audience: "cliente",
      },
      {
        id: "comeback",
        label: "Volte sempre",
        desc: "Clientes sem agendamento há muito tempo",
        icon: RotateCcw,
        audience: "cliente",
      },
      {
        id: "promotions",
        label: "Promoções e novidades",
        desc: "Mensagens pontuais (somente para quem aceitou)",
        icon: Sparkles,
        audience: "cliente",
      },
    ],
  },
  {
    title: "Pagamentos",
    items: [
      {
        id: "paymentReceived",
        label: "Pagamento recebido",
        desc: "Confirmação de pagamento para a cliente",
        icon: CreditCard,
        audience: "cliente",
      },
      {
        id: "paymentPending",
        label: "Pagamento pendente",
        desc: "Cobrança / lembrete de pagamento",
        icon: CreditCard,
        audience: "cliente",
      },
    ],
  },
];

const ALL_DEFS: NotifDef[] = GROUPS.flatMap((g) => g.items);

const REMINDER_OPTIONS = [
  { value: 1, label: "1 hora antes" },
  { value: 2, label: "2 horas antes" },
  { value: 3, label: "3 horas antes" },
  { value: 12, label: "12 horas antes" },
  { value: 24, label: "1 dia antes" },
  { value: 48, label: "2 dias antes" },
];

function defaultFor(id: NotifId): NotifConfig {
  const base: NotifConfig = {
    enabled: true,
    channels: { whatsapp: true, email: false },
  };
  if (id === "reminder24h") return { ...base, hours: 24 };
  if (id === "reminder2h") return { ...base, hours: 2 };
  if (id === "promotions")
    return { enabled: false, channels: { whatsapp: false, email: true } };
  if (id === "noShow")
    return { enabled: false, channels: { whatsapp: true, email: false } };
  return base;
}

const DEFAULTS: Settings = {
  global: {
    whatsapp: true,
    email: true,
    whatsappNumber: "",
    senderEmail: "",
    quietHours: { enabled: true, start: "21:00", end: "08:00" },
  },
  notifications: ALL_DEFS.reduce(
    (acc, def) => {
      acc[def.id] = defaultFor(def.id);
      return acc;
    },
    {} as Record<NotifId, NotifConfig>,
  ),
};

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      global: { ...DEFAULTS.global, ...(parsed.global ?? {}), quietHours: { ...DEFAULTS.global.quietHours, ...(parsed.global?.quietHours ?? {}) } },
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

function NotificacoesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    setData(load());
  }, []);

  function setNotif(id: NotifId, patch: Partial<NotifConfig>) {
    setData((s) => ({
      ...s,
      notifications: {
        ...s.notifications,
        [id]: { ...s.notifications[id], ...patch },
      },
    }));
  }

  function setChannel(id: NotifId, ch: keyof ChannelPrefs, value: boolean) {
    setData((s) => ({
      ...s,
      notifications: {
        ...s.notifications,
        [id]: {
          ...s.notifications[id],
          channels: { ...s.notifications[id].channels, [ch]: value },
        },
      },
    }));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast.success("Notificações salvas!");
  }

  const activeCount = Object.values(data.notifications).filter(
    (n) => n.enabled,
  ).length;

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
            Ajustes
          </p>
          <h1 className="truncate font-display text-lg font-bold">
            Notificações
          </h1>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-5 pb-32 pt-5">
        <PushToggleCard />
        {/* Resumo */}
        <section
          className="rounded-3xl p-5 text-white shadow-glow"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), var(--primary-glow))",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-bold leading-tight">
                {activeCount} notificaç{activeCount === 1 ? "ão ativa" : "ões ativas"}
              </p>
              <p className="text-xs text-white/80">
                Escolha como e quando avisar suas clientes
              </p>
            </div>
          </div>
        </section>

        {/* Canais globais */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Canais</h2>
            <p className="text-xs text-muted-foreground">
              Ative ou pause um canal inteiro de uma vez.
            </p>
          </div>

          <ChannelRow
            icon={MessageCircle}
            title="WhatsApp"
            desc="Mensagens automáticas via WhatsApp Business"
            enabled={data.global.whatsapp}
            onToggle={(v) =>
              setData((s) => ({ ...s, global: { ...s.global, whatsapp: v } }))
            }
          />
          {data.global.whatsapp && (
            <div className="space-y-1.5 pl-1">
              <Label className="text-xs">Número do WhatsApp</Label>
              <PhoneInputBR
                value={data.global.whatsappNumber}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    global: { ...s.global, whatsappNumber: v },
                  }))
                }
              />
            </div>
          )}

          <ChannelRow
            icon={Mail}
            title="E-mail"
            desc="Envio por e-mail para suas clientes"
            enabled={data.global.email}
            onToggle={(v) =>
              setData((s) => ({ ...s, global: { ...s.global, email: v } }))
            }
          />
          {data.global.email && (
            <div className="space-y-1.5 pl-1">
              <Label className="text-xs">E-mail remetente</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={data.global.senderEmail}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      global: { ...s.global, senderEmail: e.target.value },
                    }))
                  }
                  placeholder="contato@seustudio.com"
                  type="email"
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </section>

        {/* Não perturbe */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">Não perturbe</h2>
              <p className="text-xs text-muted-foreground">
                Não enviar mensagens neste intervalo (exceto urgentes).
              </p>
            </div>
            <Switch
              checked={data.global.quietHours.enabled}
              onCheckedChange={(v) =>
                setData((s) => ({
                  ...s,
                  global: {
                    ...s.global,
                    quietHours: { ...s.global.quietHours, enabled: v },
                  },
                }))
              }
            />
          </div>
          {data.global.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">De</Label>
                <Input
                  type="time"
                  value={data.global.quietHours.start}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      global: {
                        ...s.global,
                        quietHours: { ...s.global.quietHours, start: e.target.value },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Até</Label>
                <Input
                  type="time"
                  value={data.global.quietHours.end}
                  onChange={(e) =>
                    setData((s) => ({
                      ...s,
                      global: {
                        ...s.global,
                        quietHours: { ...s.global.quietHours, end: e.target.value },
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </section>

        {/* Tipos de notificações */}
        {GROUPS.map((g) => (
          <section key={g.title} className="space-y-3">
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {g.title}
            </h2>
            <div className="space-y-3">
              {g.items.map((def) => {
                const cfg = data.notifications[def.id];
                const Icon = def.icon;
                const canWa = data.global.whatsapp;
                const canEmail = data.global.email;
                return (
                  <div
                    key={def.id}
                    className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{def.label}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              def.audience === "cliente"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {def.audience}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {def.desc}
                        </p>
                      </div>
                      <Switch
                        checked={cfg.enabled}
                        onCheckedChange={(v) => setNotif(def.id, { enabled: v })}
                      />
                    </div>

                    {cfg.enabled && (
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-secondary/30 p-3">
                        {def.hasTiming && (
                          <div className="flex items-center justify-between gap-3">
                            <Label className="text-xs">Antecedência</Label>
                            <div className="w-40">
                              <Select
                                value={String(cfg.hours ?? 24)}
                                onValueChange={(v) =>
                                  setNotif(def.id, { hours: Number(v) })
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {REMINDER_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={String(o.value)}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <ChannelToggle
                          icon={MessageCircle}
                          label="WhatsApp"
                          checked={cfg.channels.whatsapp && canWa}
                          disabled={!canWa}
                          onChange={(v) => setChannel(def.id, "whatsapp", v)}
                        />
                        <ChannelToggle
                          icon={Mail}
                          label="E-mail"
                          checked={cfg.channels.email && canEmail}
                          disabled={!canEmail}
                          onChange={(v) => setChannel(def.id, "email", v)}
                        />

                        {!cfg.channels.whatsapp && !cfg.channels.email && (
                          <p className="pt-1 text-[11px] text-destructive">
                            Selecione ao menos um canal.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar notificações
        </Button>
      </div>
    </MobileShell>
  );
}

function ChannelRow({
  icon: Icon,
  title,
  desc,
  enabled,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl gradient-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}

function ChannelToggle({
  icon: Icon,
  label,
  checked,
  disabled,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-card px-3 py-2 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{label}</p>
        {disabled && (
          <span className="text-[10px] text-muted-foreground">(canal desativado)</span>
        )}
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
