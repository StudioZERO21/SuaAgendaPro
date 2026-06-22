import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell, CalendarDays, CreditCard, Globe, HelpCircle, History,
  Link as LinkIcon, LogOut, Palette, Share2, Sparkles,
  Star, User, ChevronRight, Crown, MessageCircle, Loader2,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/usePerfil";
import { useAuth } from "@/hooks/useAuth";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useClientes } from "@/hooks/useClientes";
import { toast } from "sonner";
import { useMemo } from "react";

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
      { id: "portfolio", label: "Portfólio",                icon: Sparkles,    to: "/portfolio" as const },
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
      { id: "share",  label: "Indicar para amigas", icon: Share2     },
      { id: "review", label: "Avaliar o app",        icon: Star       },
      { id: "help",   label: "Central de ajuda",     icon: HelpCircle },
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

  const apptCount   = appts.filter((a) => a.status !== "cancelado").length;
  const clientCount = clients.length;

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
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-glow" style={{ background: "linear-gradient(145deg,#ec4899 0%,#db2777 40%,#be185d 100%)" }}>
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
            <Stat label="Avaliação" value="4.9"                />
          </div>
        </div>
      </section>

      {/* Upgrade banner */}
      <section className="mt-5 px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 gradient-soft p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">Convide e ganhe 1 mês</p>
            <p className="text-xs text-muted-foreground">Indique uma amiga profissional ✨</p>
          </div>
          <Button
            onClick={() => toast.success("Link copiado!")}
            size="sm"
            className="h-9 rounded-full gradient-primary px-3 text-xs font-semibold shadow-glow"
          >
            Compartilhar
          </Button>
        </div>
      </section>

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
