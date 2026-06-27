import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  Heart,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  buildFullSystemMessage,
  buildWaLink,
  DEFAULT_WA_SETTINGS,
  getWhatsAppSettings,
  interpolate,
  listWhatsAppMessages,
  markMessageSent,
  saveWhatsAppSettings,
  type WhatsAppMessage,
  type WhatsAppSettings,
} from "@/lib/whatsapp.functions";
import { useProfile } from "@/hooks/usePerfil";

export const Route = createFileRoute("/(app)/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp — SuaAgenda.Pro" },
      { name: "description", content: "Configure mensagens automáticas de WhatsApp para suas clientes." },
    ],
  }),
  component: WhatsAppPage,
});

// ── Helpers ───────────────────────────────────────────────────

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function formatBrPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function msgTypeLabel(type: WhatsAppMessage["message_type"]) {
  switch (type) {
    case "confirmation": return "Confirmação";
    case "reminder": return "Lembrete";
    case "cancellation": return "Cancelamento";
    default: return "Manual";
  }
}

const TEMPLATE_VARS = "{{cliente_nome}}, {{servico}}, {{data}}, {{hora}}, {{profissional}}, {{valor}}, {{link_avaliacao}}";

// ── Message groups (mirrors notificacoes.tsx) ─────────────────

type MsgKey = keyof Omit<WhatsAppSettings, "enabled" | "greeting">;

type MsgDef = { key: MsgKey; label: string; emoji: string; desc: string };

const MSG_GROUPS: { id: string; title: string; icon: React.ElementType; items: MsgDef[] }[] = [
  {
    id: "agendamentos",
    title: "Agendamentos",
    icon: CalendarCheck,
    items: [
      { key: "msgNewBooking",    label: "Novo agendamento",         emoji: "🆕", desc: "Alerta para você quando uma cliente agendar" },
      { key: "msgConfirmation",  label: "Confirmação para a cliente", emoji: "✅", desc: "Enviada logo após o agendamento" },
      { key: "msgReminder",      label: "Lembrete 24h antes",        emoji: "🔔", desc: "Lembrete antecipado para a cliente" },
      { key: "msgReminder2h",    label: "Lembrete 2h antes",         emoji: "⏰", desc: "Segundo lembrete próximo do horário" },
      { key: "msgReschedule",    label: "Reagendamento",             emoji: "📅", desc: "Quando um horário é alterado" },
      { key: "msgCancellation",  label: "Cancelamento",              emoji: "❌", desc: "Quando um agendamento é cancelado" },
      { key: "msgNoShow",        label: "No-show / falta",           emoji: "⚠️", desc: "Mensagem após a cliente faltar" },
    ],
  },
  {
    id: "pos",
    title: "Pós-atendimento",
    icon: Sparkles,
    items: [
      { key: "msgThanks",  label: "Agradecimento",      emoji: "💖", desc: "Mensagem após o atendimento" },
      { key: "msgReview",  label: "Pedido de avaliação", emoji: "⭐", desc: "Convidar a cliente a avaliar" },
    ],
  },
  {
    id: "relacionamento",
    title: "Relacionamento",
    icon: Heart,
    items: [
      { key: "msgBirthday",   label: "Aniversário",          emoji: "🎂", desc: "Parabéns no dia do aniversário" },
      { key: "msgComeback",   label: "Volte sempre",         emoji: "💕", desc: "Para clientes sem agendamento há muito tempo" },
      { key: "msgPromotions", label: "Promoções e novidades", emoji: "🌟", desc: "Mensagens pontuais de marketing" },
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    icon: CreditCard,
    items: [
      { key: "msgPaymentReceived", label: "Pagamento recebido", emoji: "💰", desc: "Confirmação de pagamento para a cliente" },
      { key: "msgPaymentPending",  label: "Pagamento pendente", emoji: "⏳", desc: "Cobrança / lembrete de pagamento" },
    ],
  },
];

// ── Page ─────────────────────────────────────────────────────

function WhatsAppPage() {
  const { data: prof } = useProfile();
  const fetchSettings = useServerFn(getWhatsAppSettings);
  const persistSettings = useServerFn(saveWhatsAppSettings);
  const fetchMessages = useServerFn(listWhatsAppMessages);
  const doMarkSent = useServerFn(markMessageSent);

  const [cfg, setCfg] = useState<WhatsAppSettings>(DEFAULT_WA_SETTINGS);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick send
  const [clientPhone, setClientPhone] = useState("");
  const [clientMsg, setClientMsg] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [settings, msgs] = await Promise.all([
          fetchSettings(),
          fetchMessages(),
        ]);
        if (!active) return;
        setCfg(settings);
        setMessages(msgs);
      } catch {
        toast.error("Não foi possível carregar as configurações de WhatsApp.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchSettings, fetchMessages]);

  const phoneDigits = useMemo(() => onlyDigits(prof?.phone ?? ""), [prof?.phone]);
  const isPhoneReady = phoneDigits.length >= 10;
  const myWaLink = isPhoneReady ? buildWaLink(phoneDigits, cfg.greeting) : "";

  const clientDigits = useMemo(() => onlyDigits(clientPhone), [clientPhone]);
  const clientValid = clientDigits.length >= 10 && clientDigits.length <= 11;
  const clientWaLink = buildWaLink(clientDigits, clientMsg);


  async function handleSave() {
    setSaving(true);
    try {
      const saved = await persistSettings({ data: cfg });
      setCfg(saved);
      toast.success("Configurações salvas.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent(msg: WhatsAppMessage) {
    try {
      await doMarkSent({ data: { id: msg.id } });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "sent" } : m)));
      toast.success("Marcado como enviado.");
    } catch {
      toast.error("Não foi possível atualizar.");
    }
  }

  async function refreshMessages() {
    try {
      const msgs = await fetchMessages();
      setMessages(msgs);
      toast.success("Atualizado.");
    } catch {
      toast.error("Não foi possível atualizar.");
    }
  }

  const pendingCount = messages.filter((m) => m.status === "pending").length;
  const [selectedSection, setSelectedSection] = useState(MSG_GROUPS[0].id);
  const [previewKey, setPreviewKey] = useState<MsgKey>(MSG_GROUPS[0].items[0].key);

  // Reset previewKey to first item of new section when section changes
  useEffect(() => {
    const group = MSG_GROUPS.find((g) => g.id === selectedSection);
    if (group) setPreviewKey(group.items[0].key);
  }, [selectedSection]);

  const PREVIEW_VARS = {
    cliente_nome: "Ana Silva",
    servico: "Escova progressiva",
    data: "segunda, 23 de junho",
    hora: "14:00",
    profissional: prof?.display_name ?? "Studio",
    valor: "150,00",
    link_avaliacao: "suaagenda.pro/avaliar/abc123",
    mensagem: "15% de desconto na próxima visita! 🎉",
  };

  const fullPreview = buildFullSystemMessage(
    cfg[previewKey],
    { name: prof?.display_name ?? "Studio", phone: prof?.phone },
    PREVIEW_VARS,
  );

  const previewProfName = prof?.display_name ?? "Studio";
  const previewBodyText = interpolate(cfg[previewKey], PREVIEW_VARS);
  const previewReplyLink = prof?.phone
    ? buildWaLink(
        prof.phone,
        `Olá ${previewProfName}! Sou ${PREVIEW_VARS.cliente_nome} e recebi uma mensagem sobre ${PREVIEW_VARS.servico} em ${PREVIEW_VARS.data} às ${PREVIEW_VARS.hora}.`,
      )
    : "";

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <Link
          to="/mais"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-card"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conta</p>
          <h1 className="font-display text-2xl font-bold leading-tight">WhatsApp</h1>
        </div>
        {pendingCount > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white shadow-glow">
            {pendingCount}
          </span>
        )}
      </header>

      <main className="mt-5 flex-1 px-5 pb-10">
        {/* Status card */}
        <section
          className="relative mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-glow"
          style={{
            background: cfg.enabled && isPhoneReady
              ? "linear-gradient(145deg, #16a34a 0%, #15803d 50%, #14532d 100%)"
              : "linear-gradient(145deg, #64748b 0%, #475569 50%, #334155 100%)",
          }}
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold leading-tight">
                {cfg.enabled && isPhoneReady ? "WhatsApp ativo" : "WhatsApp inativo"}
              </p>
              <p className="mt-1 text-xs text-white/80">
                {isPhoneReady
                  ? `+55 ${formatBrPhone(phoneDigits)}`
                  : "Configure o número em Perfil Profissional."}
              </p>
              {cfg.enabled && isPhoneReady && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20">
                  <CheckCircle2 className="h-3 w-3" /> Mensagens automáticas on
                </span>
              )}
            </div>
          </div>
        </section>

        {!isPhoneReady && (
          <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-bold">Número não cadastrado</p>
            <p className="mt-1 text-xs leading-relaxed">
              Adicione seu número de telefone em{" "}
              <Link to="/perfil-profissional" className="font-semibold underline">
                Perfil Profissional
              </Link>{" "}
              para ativar as mensagens.
            </p>
          </section>
        )}

        <Tabs defaultValue="config">
          <TabsList className="mb-5 grid h-9 w-full grid-cols-3 rounded-full bg-secondary p-1 text-muted-foreground">
            <TabsTrigger value="config" className="rounded-full px-2 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card">
              Configurar
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-full px-2 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card">
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-full px-2 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card">
              Histórico
              {pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Configurar ── */}
          <TabsContent value="config" className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-soft text-primary">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Mensagens automáticas</p>
                    <p className="text-xs text-muted-foreground">Ativa ao confirmar agendamentos</p>
                  </div>
                </div>
                <Switch
                  checked={cfg.enabled}
                  disabled={!isPhoneReady}
                  onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Integração direta</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    O SuaAgenda não armazena sua sessão de WhatsApp. Ao clicar em enviar, o app abre sua conversa com a mensagem já preparada — basta tocar em Enviar.
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem de boas-vindas</Label>
              <Textarea
                value={cfg.greeting}
                onChange={(e) => setCfg((c) => ({ ...c, greeting: e.target.value.slice(0, 500) }))}
                rows={3}
                className="resize-none"
                placeholder="Mensagem ao abrir conversa via link público..."
              />
              <p className="text-[11px] text-muted-foreground">{cfg.greeting.length}/500</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="h-12 w-full rounded-2xl gradient-primary font-semibold shadow-glow"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>

            {/* Quick send */}
            {isPhoneReady && (
              <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Falar com uma cliente agora</p>
                  <p className="mt-1 text-xs text-muted-foreground">Abre o WhatsApp com a mensagem pronta.</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Número com DDD</Label>
                  <Input
                    inputMode="tel"
                    placeholder="(11) 99999-9999"
                    value={formatBrPhone(clientDigits)}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mensagem</Label>
                  <Textarea
                    value={clientMsg}
                    onChange={(e) => setClientMsg(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Ex: Oi Ana! Seu horário de amanhã às 14h está confirmado 💕"
                    className="mt-1 resize-none"
                  />
                </div>
                <Button
                  onClick={() => window.open(clientWaLink, "_blank", "noopener,noreferrer")}
                  disabled={!clientValid}
                  className="h-12 w-full rounded-2xl gradient-primary font-semibold shadow-glow"
                >
                  <Send className="mr-2 h-4 w-4" /> Abrir conversa no WhatsApp
                </Button>
              </section>
            )}

            {isPhoneReady && myWaLink && (
              <section className="space-y-2 rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Meu link de atendimento</p>
                <p className="break-all text-xs text-foreground/70">{myWaLink}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(myWaLink); toast.success("Link copiado!"); }}
                    className="h-9 flex-1 rounded-full text-xs"
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copiar link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(myWaLink, "_blank", "noopener,noreferrer")}
                    className="h-9 flex-1 rounded-full text-xs"
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Abrir app
                  </Button>
                </div>
              </section>
            )}
          </TabsContent>

          {/* ── Templates ── */}
          <TabsContent value="templates" className="space-y-4">
            {/* Variáveis */}
            <section className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Variáveis:</span>{" "}
                {TEMPLATE_VARS}
              </p>
            </section>

            {/* Seletor de seção */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MSG_GROUPS.map((g) => {
                const Icon = g.icon;
                const active = selectedSection === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedSection(g.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "gradient-primary text-white shadow-glow"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {g.title}
                  </button>
                );
              })}
            </div>

            {/* Mensagens da seção selecionada */}
            {MSG_GROUPS.filter((g) => g.id === selectedSection).map((g) => (
              <div key={g.id} className="space-y-4">
                {g.items.map(({ key, label, emoji, desc }) => (
                  <div
                    key={key}
                    className={`space-y-2 rounded-2xl border bg-card p-4 shadow-card transition-all ${
                      previewKey === key ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{emoji} {label}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCfg((c) => ({ ...c, [key]: DEFAULT_WA_SETTINGS[key] }))}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary/80"
                        title="Restaurar mensagem padrão"
                      >
                        <RotateCcw className="h-3 w-3" /> Padrão
                      </button>
                    </div>
                    <Textarea
                      value={cfg[key]}
                      onFocus={() => setPreviewKey(key)}
                      onChange={(e) => {
                        setPreviewKey(key);
                        setCfg((c) => ({ ...c, [key]: e.target.value.slice(0, 500) }));
                      }}
                      rows={4}
                      className="resize-none text-xs"
                    />
                    <p className="text-right text-[11px] text-muted-foreground">{cfg[key].length}/500</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Preview dinâmico — mensagem completa como a cliente vai receber */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
                Preview — como a cliente recebe
              </p>

              {/* Bolha de mensagem estilo WhatsApp */}
              <div className="rounded-2xl rounded-tl-none bg-white px-4 py-4 shadow-sm dark:bg-card space-y-0">
                {/* Linha 1 — título */}
                <p className="text-[12px] font-bold text-foreground">
                  📱 Mensagem automática
                </p>

                {/* Linha 3 — identificação */}
                <p className="pt-3 text-[11px] italic text-muted-foreground">
                  {previewProfName} · via SuaAgenda.Pro
                </p>

                {/* Linha 5 — corpo da mensagem */}
                <p className="whitespace-pre-wrap pt-3 text-[12px] leading-relaxed text-foreground/90">
                  {previewBodyText}
                </p>

                {/* Botão de contato com espaço maior */}
                {previewReplyLink && (
                  <a
                    href={previewReplyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Falar com {previewProfName}
                  </a>
                )}
              </div>

              <p className="mt-2 text-[10px] text-muted-foreground">
                Header e botão de contato são adicionados automaticamente pelo sistema.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="h-12 w-full rounded-2xl gradient-primary font-semibold shadow-glow"
            >
              {saving ? "Salvando..." : "Salvar templates"}
            </Button>
          </TabsContent>

          {/* ── Histórico ── */}
          <TabsContent value="historico" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">Mensagens pendentes</p>
              <Button variant="outline" size="sm" onClick={refreshMessages} className="h-9 rounded-full text-xs">
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Atualizar
              </Button>
            </div>

            {messages.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
                <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Nenhuma mensagem ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quando uma cliente agendar, a mensagem de confirmação aparece aqui.
                </p>
              </section>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <MessageCard key={msg.id} msg={msg} onMarkSent={handleMarkSent} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </MobileShell>
  );
}

// ── Sub-components ────────────────────────────────────────────

function MessageCard({
  msg,
  onMarkSent,
}: {
  msg: WhatsAppMessage;
  onMarkSent: (m: WhatsAppMessage) => void;
}) {
  const isPending = msg.status === "pending";
  const waLink = buildWaLink(msg.client_phone, msg.message_text);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold">{msg.client_name || msg.client_phone}</p>
          <p className="text-[11px] text-muted-foreground">{msg.client_phone}</p>
        </div>
        <Badge
          variant="secondary"
          className={isPending ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"}
        >
          {isPending ? "Pendente" : "Enviado"}
        </Badge>
      </div>

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {msgTypeLabel(msg.message_type)} · {new Date(msg.sent_at).toLocaleDateString("pt-BR")}
      </p>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {msg.message_text}
      </p>

      {isPending && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => window.open(waLink, "_blank", "noopener,noreferrer")}
            className="h-9 flex-1 rounded-full gradient-primary text-xs font-semibold shadow-glow"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar WA
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkSent(msg)}
            className="h-9 rounded-full text-xs"
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Marcar enviado
          </Button>
        </div>
      )}
    </section>
  );
}
