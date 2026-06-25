import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell, CalendarDays, CreditCard, Globe, History,
  Link as LinkIcon, LogOut, Palette, Share2, Sparkles,
  Star, User, ChevronRight, Crown, MessageCircle, Loader2, Info, Copy, Check, X,
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
import { useReviews } from "@/hooks/useReviews";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getMyAppRating, submitAppRating, type MyRating } from "@/lib/app-rating.functions";

export const Route = createFileRoute("/mais")({
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
      { id: "share",  label: "Indicar para amigas", icon: Share2 },
      { id: "review", label: "Avaliar o app",        icon: Star   },
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

  const [regraOpen,   setRegraOpen]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [ratingOpen,  setRatingOpen]  = useState(false);
  const [myRating,    setMyRating]    = useState<MyRating>(null);

  useEffect(() => {
    getMyAppRating().then(setMyRating).catch(() => {});
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
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-glow" style={{ background: prof?.theme_color ? `linear-gradient(145deg, ${prof.theme_color} 0%, ${prof.gradient_color_2 ?? prof.theme_color}cc 60%, ${prof.theme_color}99 100%)` : "linear-gradient(145deg,#ec4899 0%,#db2777 40%,#be185d 100%)" }}>
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
                <Crown className="h-3 w-3" /> Plano Premium
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
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 gradient-soft p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">Convide e ganhe 1 mês</p>
            <p className="text-xs text-muted-foreground">Indique uma amiga profissional ✨</p>
          </div>
          <button onClick={() => setRegraOpen(true)} className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80" aria-label="Ver regras">
            <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
            <Info className="relative h-4 w-4" />
          </button>
          <button onClick={handleShare} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-glow" aria-label="Compartilhar">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </button>
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
              { n: "1", text: "Compartilhe seu link exclusivo de indicação com outras profissionais." },
              { n: "2", text: "Quando uma amiga se cadastrar pelo seu link e ativar uma assinatura paga, você ganha 1 mês grátis." },
              { n: "3", text: "Não há limite de indicações — indique quantas quiser e acumule meses grátis." },
              { n: "4", text: "O mês bônus é creditado automaticamente após a confirmação do pagamento da indicada." },
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

                // ── Indicar para amigas ──────────────────────────
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

                return hasLink ? (
                  <Link key={it.id} to={(it as any).to} className={cls}>{inner}</Link>
                ) : (
                  <button key={it.id} onClick={() => toast.info("Em breve!", { description: `${it.label} chega na próxima atualização.` })} className={cls}>
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
              {display === 5 && "Incrível! Muito obrigada 💜"}
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
