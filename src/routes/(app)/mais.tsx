import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell, CalendarDays, CreditCard, Globe, History,
  Link as LinkIcon, LogOut, Palette, Share2, Sparkles,
  Star, User, ChevronRight, Crown, MessageCircle, Loader2, Info, Copy, Check, X,
  HeadphonesIcon, ImagePlus, Clock, CheckCircle2, Trash2, Shield,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/usePerfil";
import { useAuth } from "@/hooks/useAuth";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useClientes } from "@/hooks/useClientes";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getMyAppRating, submitAppRating, type MyRating } from "@/lib/app-rating.functions";
import { getMyReferralStats, type MyReferralStats } from "@/lib/referral.functions";

export const Route = createFileRoute("/(app)/mais")({
  head: () => ({
    meta: [
      { title: "Mais — SuaAgenda.Pro" },
      { name: "description", content: "Ajustes, perfil e personalização." },
    ],
  }),
  component: MaisPage,
});

// ── Menu groups ───────────────────────────────────────────────

const groups = [
  {
    title: "Studio",
    items: [
      { id: "perfil",    label: "Perfil do profissional",   icon: User,        to: "/perfil-profissional" as const },
      { id: "link",      label: "Meu link público",         icon: LinkIcon,    badge: true },
      { id: "tema",      label: "Personalização",           icon: Palette,     to: "/personalizacao" as const },
      { id: "horarios",  label: "Horários de atendimento",  icon: Globe,       to: "/horarios" as const },
      { id: "portfolio",   label: "Portfólio",                icon: Sparkles,    to: "/portfolio" as const },
      { id: "avaliacoes",  label: "Avaliações",               icon: Star,        to: "/avaliacoes" as const },
    ],
  },
  {
    title: "Conta",
    items: [
      { id: "privacidade", label: "Privacidade e dados", icon: Shield, to: "/privacidade-dados" as const },
      { id: "notif",      label: "Notificações",             icon: Bell,        to: "/notificacoes" as const },
      { id: "gcal",       label: "Google Calendar",          icon: CalendarDays,to: "/google-calendar" as const },
      { id: "whatsapp",   label: "WhatsApp",                 icon: MessageCircle, to: "/whatsapp" as const },
      { id: "pagamentos", label: "Pagamentos",               icon: CreditCard,  to: "/pagamentos" as const },
      { id: "transacoes", label: "Histórico de transações",  icon: History,     to: "/transacoes" as const },
    ],
  },
  {
    title: "Suporte",
    items: [
      { id: "support", label: "Solicitar suporte",   icon: HeadphonesIcon },
      { id: "share",   label: "Indicar e ganhar", icon: Share2 },
      { id: "review",  label: "Avaliar o app",       icon: Star   },
    ],
  },
] as const;

// ── Page ─────────────────────────────────────────────────────

function MaisPage() {
  const navigate = useNavigate();
  const { user, signOut }       = useAuth();
  const { data: prof, isLoading } = useProfile();
  const { data: appts = [] }    = useAgendamentos();
  const { data: clients = [] }  = useClientes();

  const { data: reviews = [] } = useReviews();

  const apptCount   = appts.filter((a) => a.status !== "cancelado").length;
  const clientCount = clients.length;
  const avgRating   = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const publicSlug  = prof?.slug ?? "meu-link";
  const displayName = prof?.display_name ?? user?.email?.split("@")[0] ?? "Profissional";
  const email       = user?.email ?? "";
  const avatarUrl   = prof?.avatar_url;

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [displayName]);

  const [planLabel, setPlanLabel] = useState("Plano Premium");

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("subscriptions")
      .select("status, plans(display_name)")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const name = (data.plans as any)?.display_name;
        if (name) setPlanLabel(`Plano ${name}`);
        else if (data.status === "trial") setPlanLabel("Acesso Livre");
        else if (data.status === "especial") setPlanLabel("Plano Especial");
      });
  }, [user?.id]);

  const [supportOpen,    setSupportOpen]    = useState(false);
  const [regraOpen,      setRegraOpen]      = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [ratingOpen,     setRatingOpen]     = useState(false);
  const [myRating,       setMyRating]       = useState<MyRating>(null);
  const [referralStats,  setReferralStats]  = useState<MyReferralStats | null>(null);
  const [referralOpen,   setReferralOpen]   = useState(false);

  useEffect(() => {
    getMyAppRating().then(setMyRating).catch(() => {});
    getMyReferralStats().then(setReferralStats).catch(() => {});
  }, []);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/cadastro?ref=${publicSlug}`
    : "";

  async function handleShare() {
    const text = `Olá! Estou usando o SuaAgenda.Pro para gerenciar minha agenda. Cadastre-se pelo meu link e experimente grátis:\n${referralLink}`;
    if (navigator.share) {
      try { await navigator.share({ title: "SuaAgenda.Pro — experimente grátis", text, url: referralLink }); }
      catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link de indicação copiado!");
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configurações</p>
        <h1 className="font-display text-3xl font-bold leading-tight">Mais</h1>
      </header>

      {/* Profile card */}
      <section className="mt-5 px-5">
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-glow" style={{ background: prof?.theme_color ? `linear-gradient(145deg,${prof.theme_color} 0%,${prof.gradient_color_2 ?? prof.theme_color}cc 60%,${prof.theme_color}99 100%)` : "var(--gradient-primary)" }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white/15 font-display text-2xl font-bold backdrop-blur-md ring-1 ring-white/20">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin opacity-60" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold leading-tight truncate">
                {isLoading ? "Carregando..." : displayName}
              </p>
              <p className="text-sm text-white/70 truncate">{email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ring-1 ring-white/20">
                <Crown className="h-3 w-3" /> {planLabel}
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-center">
            <Stat label="Agend."   value={String(apptCount)}   />
            <Stat label="Clientes" value={String(clientCount)} />
            <Stat label="Avaliação" value={String(avgRating)}    />
          </div>
        </div>
      </section>

      {/* Referral banner */}
      <section className="mt-5 px-5">
        <div className="overflow-hidden rounded-2xl border border-primary/20 gradient-soft">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold">Convide e ganhe 1 mês grátis</p>
              <p className="text-xs text-muted-foreground">Indique profissionais e acumule meses ✨</p>
            </div>
            <button onClick={() => setRegraOpen(true)} className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80" aria-label="Ver regras">
              <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
              <Info className="relative h-4 w-4" />
            </button>
            <button onClick={handleShare} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-glow" aria-label="Compartilhar">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Stats row */}
          {referralStats && (
            <div className="grid grid-cols-3 border-t border-primary/10 divide-x divide-primary/10">
              <button onClick={() => setReferralOpen(true)} className="flex flex-col items-center py-3 hover:bg-primary/5 transition">
                <span className="text-xl font-bold text-primary">{referralStats.totalClicks}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">Cliques</span>
              </button>
              <button onClick={() => setReferralOpen(true)} className="flex flex-col items-center py-3 hover:bg-primary/5 transition">
                <span className="text-xl font-bold text-primary">{referralStats.totalRegistered}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">Cadastros</span>
              </button>
              <button onClick={() => setReferralOpen(true)} className="flex flex-col items-center py-3 hover:bg-primary/5 transition">
                <span className="text-xl font-bold text-primary">{referralStats.totalRewarded}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">Meses ganhos</span>
              </button>
            </div>
          )}

          {/* Link copiável */}
          <div className="flex items-center gap-2 border-t border-primary/10 px-4 py-3">
            <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{referralLink}</p>
            <button onClick={handleCopy} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/70">
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </section>

      {/* Dialog — regras de indicação */}
      <Dialog open={regraOpen} onOpenChange={setRegraOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Regras do programa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              { n: "1", text: "Compartilhe seu link exclusivo de indicação com outros profissionais." },
              { n: "2", text: "Quando alguém se cadastrar pelo seu link e ativar uma assinatura paga, você ganha 1 mês grátis." },
              { n: "3", text: "Não há limite de indicações — indique quantas quiser e acumule meses grátis." },
              { n: "4", text: "O mês bônus é creditado automaticamente após a confirmação do pagamento de quem você indicou." },
              { n: "5", text: "O link de indicação é exclusivo e intransferível — não pode ser repassado para uso comercial." },
            ].map(({ n, text }) => (
              <div key={n} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-white shadow-glow">{n}</span>
                <p className="leading-snug">{text}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => setRegraOpen(false)} className="mt-2 h-10 w-full rounded-2xl gradient-primary text-sm font-semibold shadow-glow">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog — minhas indicações (histórico) */}
      <Dialog open={referralOpen} onOpenChange={setReferralOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" /> Minhas indicações
            </DialogTitle>
          </DialogHeader>
          {referralStats ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cliques",       value: referralStats.totalClicks },
                  { label: "Cadastros",     value: referralStats.totalRegistered },
                  { label: "Meses ganhos",  value: referralStats.totalRewarded },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {referralStats.pendingReward > 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                    {referralStats.pendingReward} indicação(ões) ainda aguardando 1º pagamento para você ganhar o mês grátis.
                  </p>
                </div>
              )}

              {/* Lista recente */}
              {referralStats.recentConversions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Histórico recente</p>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {referralStats.recentConversions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{c.refereeEmail ?? "Visitante"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {c.rewardGrantedAt ? "Mês concedido" : c.registeredAt ? "Cadastrou — aguard. pagto." : "Visitou o link"}
                          </p>
                        </div>
                        <span className={`ml-2 shrink-0 h-2 w-2 rounded-full ${
                          c.status === "rewarded" ? "bg-emerald-500" :
                          c.status === "registered" ? "bg-yellow-400" : "bg-muted-foreground/30"
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          <Button onClick={() => setReferralOpen(false)} className="h-10 w-full rounded-2xl gradient-primary text-sm font-semibold shadow-glow">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Settings groups */}
      <main className="mt-6 flex-1 space-y-6 px-5 pb-6">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{g.title}</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {g.items.map((it, i) => {
                const Icon = it.icon;
                const hasLink = "to" in it;
                const cls = `flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/60 ${i !== 0 ? "border-t border-border" : ""}`;

                // ── Solicitar suporte ────────────────────────────
                if (it.id === "support") {
                  return (
                    <button key={it.id} onClick={() => setSupportOpen(true)} className={cls}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{it.label}</p>
                        <p className="text-[11px] text-muted-foreground">Abrir um chamado de suporte</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                }

                // ── Indicar e ganhar ──────────────────────────
                if (it.id === "share") {
                  return (
                    <div key={it.id} className={`${cls} justify-between`}>
                      <button onClick={handleShare} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-semibold">{it.label}</p>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRegraOpen(true)}
                          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80"
                          aria-label="Ver regras"
                        >
                          <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
                          <Info className="relative h-4 w-4" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                }

                // ── Avaliar o app ────────────────────────────────
                if (it.id === "review") {
                  return (
                    <button key={it.id} onClick={() => setRatingOpen(true)} className={cls}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{it.label}</p>
                        {myRating && (
                          <p className="text-[11px] text-muted-foreground">
                            {"★".repeat(myRating.rating)}{"☆".repeat(5 - myRating.rating)} — sua avaliação
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                }

                // ── Meu link público ─────────────────────────────
                if (it.id === "link") {
                  return (
                    <a
                      key={it.id}
                      href={`/agendar/${publicSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{it.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          suaagenda.pro/agendar/{publicSlug}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  );
                }

                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{it.label}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                );

                const anyIt = it as any;
                return hasLink ? (
                  <Link key={anyIt.id} to={anyIt.to} className={cls}>{inner}</Link>
                ) : (
                  <button key={anyIt.id} onClick={() => toast.info("Em breve!", { description: `${anyIt.label} chega na próxima atualização.` })} className={cls}>
                    {inner}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="h-12 w-full rounded-2xl border border-border bg-card text-sm font-semibold text-destructive shadow-card hover:bg-secondary"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>

        <p className="pt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          SuaAgenda.Pro · v1.0.0
        </p>
      </main>

      {/* Modal — Solicitar suporte */}
      <SupportTicketModal
        open={supportOpen}
        userId={user?.id ?? ""}
        onClose={() => setSupportOpen(false)}
      />

      {/* Modal — Avaliar o app */}
      <AppRatingModal
        open={ratingOpen}
        initial={myRating}
        onClose={() => setRatingOpen(false)}
        onSaved={(r) => setMyRating(r)}
      />

      <BottomNav />
    </MobileShell>
  );
}

// ─── Support Ticket Modal ─────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "bug",     label: "Bug / Erro no sistema"  },
  { value: "billing", label: "Cobrança / Pagamento"   },
  { value: "feature", label: "Sugestão de melhoria"   },
  { value: "other",   label: "Outro"                  },
];

function SupportTicketModal({
  open,
  userId,
  onClose,
}: {
  open: boolean;
  userId: string;
  onClose: () => void;
}) {
  const [subject,    setSubject]    = useState("");
  const [category,   setCategory]   = useState("bug");
  const [desc,       setDesc]       = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [files,      setFiles]      = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);

  function reset() {
    setSubject(""); setCategory("bug"); setDesc(""); setOccurredAt("");
    setFiles([]); setPreviews([]); setSending(false); setDone(false);
  }

  function handleClose() { reset(); onClose(); }

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) => f.type.startsWith("image/") && f.size <= 5_242_880);
    if (valid.length === 0) { toast.error("Selecione imagens (máx. 5 MB cada)."); return; }
    const combined = [...files, ...valid].slice(0, 5);
    setFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(i: number) {
    const nf = files.filter((_, idx) => idx !== i);
    const np = previews.filter((_, idx) => idx !== i);
    setFiles(nf); setPreviews(np);
  }

  async function handleSubmit() {
    if (!subject.trim())    { toast.error("Informe o assunto."); return; }
    if (desc.trim().length < 30) { toast.error("Descrição precisa ter pelo menos 30 caracteres."); return; }
    if (!occurredAt)        { toast.error("Informe quando ocorreu."); return; }
    if (category === "bug" && files.length === 0) { toast.error("Para bugs, anexe pelo menos um print do erro."); return; }

    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { uploadBlob } = await import("@/lib/storage");

      // Upload attachments (disco local do app)
      const urls: string[] = [];
      for (const file of files) {
        const ext  = file.name.split(".").pop() ?? "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const url = await uploadBlob(file, "support", filename);
        urls.push(url);
      }

      // Create ticket (support_tickets not yet in generated types — cast to any)
      const { error } = await (supabase as any).from("support_tickets").insert({
        user_id:     userId,
        subject:     subject.trim(),
        description: desc.trim(),
        category,
        occurred_at: new Date(occurredAt).toISOString(),
        attachments: urls,
      });
      if (error) throw new Error(error.message);

      setDone(true);
    } catch (e: any) {
      toast.error("Erro ao abrir chamado: " + e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
            {done ? "Chamado registrado!" : "Solicitar suporte"}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary shadow-glow">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">Chamado enviado com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Em até <strong>1 dia útil</strong> nossa equipe entrará em contato com você para resolver o problema.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <p>Acompanhe sua caixa de entrada de e-mail para atualizações.</p>
            </div>
            <Button onClick={handleClose} className="h-11 w-full rounded-2xl gradient-primary font-semibold shadow-glow">
              Entendido
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assunto <span className="text-destructive">*</span></label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Agendamento não aparece no calendário" className="h-11 rounded-xl" maxLength={120} />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition",
                      category === c.value ? "gradient-primary text-white shadow-glow" : "bg-secondary text-muted-foreground hover:bg-secondary/70",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Descreva o problema <span className="text-destructive">*</span>
                <span className={cn("ml-2 text-[11px] font-normal", desc.trim().length >= 30 ? "text-emerald-600" : "text-muted-foreground")}>
                  ({desc.trim().length}/30 mín.)
                </span>
              </label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descreva o que aconteceu, o que você estava fazendo e o que esperava que acontecesse…"
                rows={4}
                className="rounded-xl"
              />
            </div>

            {/* Occurred at */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quando ocorreu? <span className="text-destructive">*</span></label>
              <Input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Prints do erro {category === "bug" && <span className="text-destructive">*</span>}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">(máx. 5 imagens, 5MB cada)</span>
              </label>
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                      <img src={p} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {files.length < 5 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 transition hover:bg-secondary/60">
                  <ImagePlus className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {files.length === 0 ? "Clique para anexar prints do erro" : "Adicionar mais imagens"}
                  </span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={handleClose} disabled={sending}>Cancelar</Button>
              <Button
                className="flex-1 rounded-2xl gradient-primary font-semibold shadow-glow"
                onClick={handleSubmit}
                disabled={sending || !subject.trim() || desc.trim().length < 30 || !occurredAt || (category === "bug" && files.length === 0)}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar chamado"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-white/70">{label}</p>
    </div>
  );
}

function AppRatingModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: MyRating;
  onClose: () => void;
  onSaved: (r: MyRating) => void;
}) {
  const [stars,   setStars]   = useState(initial?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving,  setSaving]  = useState(false);

  // sync when modal opens with existing rating
  useEffect(() => {
    if (open) {
      setStars(initial?.rating ?? 0);
      setComment(initial?.comment ?? "");
      setHovered(0);
    }
  }, [open, initial]);

  async function handleSave() {
    if (stars === 0) { toast.error("Selecione uma classificação."); return; }
    setSaving(true);
    try {
      await submitAppRating(stars, comment);
      onSaved({ rating: stars, comment: comment.trim() || null });
      toast.success(initial ? "Avaliação atualizada! Obrigada 💜" : "Avaliação enviada! Obrigada 💜");
      onClose();
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const display = hovered || stars;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
            {initial ? "Editar avaliação" : "Avaliar o SuaAgenda.Pro"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <p className="text-sm text-muted-foreground text-center">Sua opinião nos ajuda a melhorar o app para todas as profissionais.</p>

          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(n)}
                className="transition-transform active:scale-90"
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${n <= display ? "text-amber-400" : "text-muted-foreground/25"}`}
                  fill={n <= display ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          {display > 0 && (
            <p className="text-center text-sm font-semibold text-amber-500">
              {display === 1 && "Precisamos melhorar muito 😔"}
              {display === 2 && "Tem bastante espaço para melhorar 🤔"}
              {display === 3 && "Razoável, vamos trabalhar nisso! 🙂"}
              {display === 4 && "Muito bom! Quase perfeito ✨"}
              {display === 5 && "Incrível! Valeu demais 💜"}
            </p>
          )}

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comentário <span className="text-muted-foreground/60 font-normal">(opcional)</span></label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que você mais gosta? O que poderíamos melhorar?"
              className="min-h-[88px] rounded-2xl resize-none"
              maxLength={1000}
            />
            <p className="text-right text-[10px] text-muted-foreground">{comment.length}/1000</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-2xl gradient-primary font-semibold shadow-glow"
            onClick={handleSave}
            disabled={saving || stars === 0}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Atualizar" : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
