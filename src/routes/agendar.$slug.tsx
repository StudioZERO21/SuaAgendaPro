import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  ExternalLink,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  Star,
  User,
  Navigation,
  Mail,
  FileText,
  QrCode,
  Timer,
  Wallet,
  Copy,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PhoneInputBR } from "@/components/ui/phone-input";
import {
  getPublicProfile,
  type PublicData,
} from "@/lib/public-booking.functions";
import { categoryMeta } from "@/lib/services-store";
import type { ServiceCategory } from "@/lib/mock-data";
import { formatDuration } from "@/hooks/useServicos";
import { ImageOff } from "lucide-react";
import { buildPublicPageModel } from "@/lib/public-page-model";
import {
  formatPublicPrice as formatPrice,
  getPublicOpenStatus as getOpenStatus,
  type PortfolioItem,
  type PublicService,
} from "@/lib/public-page-types";
import { BookingSheet } from "@/components/public-page/public-booking-sheet";
import salonBannerUrl from "@/assets/salon-banner.png";

export const Route = createFileRoute("/agendar/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Agendamento online — SuaAgenda.Pro" },
      { property: "og:url", content: `/agendar/${params.slug}` },
    ],
    links: [
      { rel: "canonical", href: `/agendar/${params.slug}` },
      { rel: "preload", as: "image", href: salonBannerUrl, fetchpriority: "high" } as const,
    ],
  }),
  component: PublicBookingPage,
});

function PublicBookingPage() {
  const { slug } = Route.useParams();
  // ── All hooks first (Rules of Hooks) ─────────────────────────
  const [loaderData, setLoaderData]     = useState<PublicData | null | undefined>(undefined);
  const [open, setOpen]                 = useState(false);
  const [ctaExpanded, setCtaExpanded]   = useState(false);
  const [preselect, setPreselect]       = useState<PublicService | undefined>();
  const [portfolioPreview, setPortfolioPreview] = useState<PortfolioItem | null>(null);
  const [detailsService, setDetailsService]     = useState<PublicService | null>(null);
  const [hoursOpen, setHoursOpen]       = useState(false);
  const [mapOpen, setMapOpen]           = useState(false);
  const avatarRef                       = useRef<HTMLImageElement>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [visibleServices, setVisibleServices] = useState(6);
  const [visibleReviews, setVisibleReviews]   = useState(3);

  useEffect(() => { getPublicProfile(slug).then(setLoaderData); }, [slug]);
  useEffect(() => { if (avatarRef.current?.complete) setAvatarLoaded(true); }, []);

  // Retorno do Mercado Pago — mostra toast de sucesso ou pendente
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mp = params.get("mp");
    if (!mp) return;
    if (mp === "done") {
      toast.success("Agendamento registrado!", {
        description: "Assim que o pagamento for confirmado pelo Mercado Pago, seu horário será reservado.",
        duration: 8000,
      });
    }
    // Limpa os params da URL sem recarregar
    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
  }, []);

  // Inject professional's theme color into CSS vars so ALL primary-colored elements match
  useEffect(() => {
    const color = loaderData?.profile?.theme_color;
    if (!color) return;
    const SAFE_COLOR = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$|^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
    if (!SAFE_COLOR.test(color)) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", color);
    root.style.setProperty("--accent", color);
    root.style.setProperty("--ring", color);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`);
    root.style.setProperty("--shadow-glow", `0 10px 30px -10px ${color}73`);
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--gradient-primary");
      root.style.removeProperty("--shadow-glow");
    };
  }, [loaderData]);

  // ── Early returns after all hooks ────────────────────────────
  if (loaderData === undefined) {
    return (
      <div className="min-h-screen bg-background">
        {/* Banner skeleton */}
        <div className="h-[340px] w-full animate-pulse bg-secondary" />
        <div className="mx-auto max-w-md px-5">
          {/* Avatar skeleton */}
          <div className="-mt-24 flex flex-col items-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-secondary ring-4 ring-background" />
            <div className="mt-5 h-6 w-40 animate-pulse rounded-full bg-secondary" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded-full bg-secondary" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded-full bg-secondary" />
          </div>
          {/* Services skeleton */}
          <div className="mt-10 space-y-3">
            <div className="h-7 w-24 animate-pulse rounded-full bg-secondary" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-secondary" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          </div>
          {/* Reviews skeleton */}
          <div className="mt-10 space-y-3">
            <div className="h-7 w-28 animate-pulse rounded-full bg-secondary" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loaderData === null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
          <p className="mt-2 text-muted-foreground">Este link de agendamento não existe.</p>
          <Button asChild className="mt-6 rounded-2xl gradient-primary text-white">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { profile, services, portfolio, reviews } =
    buildPublicPageModel(loaderData);

  const openStatus = getOpenStatus(profile.hours);
  const phoneDigits = "55" + profile.phone.replace(/\D/g, "");

  function startBooking(s?: PublicService) {
    setPreselect(s);
    setOpen(true);
  }

  // ── Social network helper ────────────────────────────────────
  function socialUrl(network: string, handle: string) {
    const h = handle.replace(/^@/, "");
    switch (network) {
      case "instagram":  return `https://instagram.com/${h}`;
      case "facebook":   return `https://facebook.com/${h}`;
      case "youtube":    return `https://youtube.com/@${h}`;
      case "twitter":    return `https://twitter.com/${h}`;
      case "linkedin":   return `https://linkedin.com/in/${h}`;
      case "tiktok":     return `https://tiktok.com/@${h}`;
      case "pinterest":  return `https://pinterest.com/${h}`;
      default:           return `https://${h}`;
    }
  }

  function SocialIcon({ network }: { network: string }) {
    switch (network) {
      case "instagram": return <Instagram className="h-5 w-5" />;
      case "facebook":  return <Facebook className="h-5 w-5" />;
      case "youtube":   return <Youtube className="h-5 w-5" />;
      case "twitter":   return <Twitter className="h-5 w-5" />;
      case "linkedin":  return <Linkedin className="h-5 w-5" />;
      default:          return <ExternalLink className="h-5 w-5" />;
    }
  }

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: profile.name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copiado!");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HERO — banner imagem premium */}
      <header className="relative overflow-hidden text-white">
        <div className="relative h-[340px] w-full sm:h-[420px]">
          <img
            src={profile.bannerUrl || salonBannerUrl}
            alt={`Espaço ${profile.name}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
            {...({ fetchpriority: "high" } as Record<string, string>)}
          />
          {/* Camadas de tratamento premium */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-70"
            style={{ background: profile.coverGradient }}
          />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

          {/* Top bar */}
          <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex gap-2">
              <button
                onClick={share}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition active:scale-95"
                aria-label="Compartilhar"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Logo ou badge de especialidade — centrado verticalmente no banner */}
          <div className="absolute inset-x-0 z-10 flex justify-center px-5" style={{ top: "50%", transform: "translateY(-60%)" }}>
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.name}
                className="max-h-[100px] max-w-[250px] w-auto object-contain drop-shadow-2xl"
              />
            ) : profile.businessName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] backdrop-blur-md">
                <Sparkles className="h-3 w-3" fill="currentColor" /> {profile.businessName}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-md space-y-10 px-5">
        {/* Avatar profissional sobrepondo o banner */}
        <div className="relative -mt-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.7 }}
            className="relative"
          >
            {/* Glow externo premium */}
            <div className="pointer-events-none absolute -inset-4 rounded-full opacity-60 blur-2xl"
              style={{ background: `radial-gradient(circle, ${profile.themeColor}99, transparent)` }} />
            <div className="pointer-events-none absolute -inset-1 rounded-full blur-md"
              style={{ background: `linear-gradient(135deg, ${profile.themeColor}66, transparent, ${profile.themeColor}44)` }} />

            {/* Anel externo gradiente + anel interno branco */}
            <div
              className="relative h-48 w-48 rounded-full p-[3px]"
              style={{
                background: `linear-gradient(135deg, ${profile.themeColor}, ${profile.themeColor}aa)`,
                boxShadow: `0 20px 60px -15px ${profile.themeColor}99`,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full bg-background p-[3px]">
                {profile.avatar ? (
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    {!avatarLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-card font-display text-5xl font-bold text-gradient animate-pulse">
                        {profile.initials}
                      </div>
                    )}
                    <img
                      ref={avatarRef}
                      src={profile.avatar.url}
                      alt={profile.avatar.alt || profile.name}
                      width={192}
                      height={192}
                      loading="eager"
                      decoding="async"
                      onLoad={() => setAvatarLoaded(true)}
                      {...({ fetchpriority: "high" } as Record<string, string>)}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-card font-display text-5xl font-bold text-gradient">
                    {profile.initials}
                  </div>
                )}
              </div>
              {/* Brilho sutil no topo */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-transparent mix-blend-overlay" />
            </div>
          </motion.div>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="mt-1 max-w-[18rem] text-sm text-muted-foreground">{profile.tagline}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs shadow-card">
            <Star className="h-3.5 w-3.5 text-primary" fill="currentColor" />
            <span className="font-semibold">{profile.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">· {profile.reviewsCount} avaliações</span>
          </div>
        </div>

        {/* About */}
        <Section title="Sobre">
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          <div className="mt-4 space-y-2">
            {profile.highlights.map((h) => (
              <div key={h} className="flex items-start gap-2 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" fill="currentColor" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Portfólio — oculto quando não há fotos */}
        {portfolio.length > 0 && <Section
          title="Portfólio"
          right={
            <span className="text-xs text-muted-foreground">
              {portfolio.length} {portfolio.length === 1 ? "foto" : "fotos"}
            </span>
          }
        >
          {portfolio.length <= 3 ? (
            <div className={cn("grid gap-2.5", portfolio.length === 1 ? "grid-cols-1" : portfolio.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {portfolio.map((p, idx) => {
                const priority = idx < 3;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPortfolioPreview(p)}
                    className="group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-card ring-1 ring-black/[0.02]"
                  >
                    <div className="aspect-[9/16] w-full overflow-hidden bg-secondary">
                      <img
                        src={p.src}
                        alt={p.title || "Trabalho"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        {...({ fetchpriority: priority ? "high" : "low" } as Record<string, string>)}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-6 text-left text-white">
                      <p className="truncate text-[11px] font-semibold leading-tight">
                        {p.title || p.category}
                      </p>
                      <p className="truncate text-[9px] uppercase tracking-wider text-white/75">
                        {p.category}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="-mx-5 overflow-hidden px-5"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              }}
            >
              <div className="flex w-max gap-2.5 animate-portfolio-marquee hover:[animation-play-state:paused]">
                {[...portfolio, ...portfolio].map((p, idx) => (
                  <button
                    key={`${p.id}-${idx}`}
                    onClick={() => setPortfolioPreview(p)}
                    className="group relative w-28 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-card ring-1 ring-black/[0.02]"
                  >
                    <div className="aspect-[9/16] w-full overflow-hidden bg-secondary">
                      <img
                        src={p.src}
                        alt={p.title || "Trabalho"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading={idx < 3 ? "eager" : "lazy"}
                        decoding="async"
                        {...({ fetchpriority: idx < 3 ? "high" : "low" } as Record<string, string>)}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-5 text-left text-white">
                      <p className="truncate text-[11px] font-semibold leading-tight">
                        {p.title || p.category}
                      </p>
                      <p className="truncate text-[9px] uppercase tracking-wider text-white/75">
                        {p.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>}

        {/* Services */}
        <Section
          title="Serviços"
          right={
            profile.services.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.min(visibleServices, profile.services.length)}/{profile.services.length}
              </span>
            )
          }
        >
          {profile.services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {profile.services.slice(0, visibleServices).map((s, idx) => {
                  const cat = categoryMeta(s.category);
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: (idx % 9) * 0.04, ease: "easeOut" }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setDetailsService(s)}
                      className="group relative flex h-36 w-full flex-col overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/40 transition-shadow duration-300 hover:shadow-md"
                      style={{ ["--tw-ring-color" as string]: `${profile.themeColor}40` }}
                    >
                      {/* Background — imagem pré-processada ou gradiente suave */}
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(145deg, ${profile.themeColor}10 0%, ${profile.themeColor}2a 100%)` }}
                        />
                      )}

                      {/* Overlay com gradiente da cor do tema */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to bottom, transparent 30%, ${profile.themeColor}28 75%, ${profile.themeColor}55 100%)`,
                        }}
                      />

                      {/* Borda colorida no hover */}
                      <div
                        className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/30 transition-all duration-300 group-hover:ring-[2px]"
                        style={{ ["--tw-ring-color" as string]: `${profile.themeColor}60` }}
                      />

                      {/* Conteúdo */}
                      <div className="relative flex h-full flex-col justify-end p-2.5">
                        {/* Nome + rodapé — alinhado na base */}
                        <div>
                          <h3 className="line-clamp-2 text-[11px] font-black uppercase tracking-wide leading-tight">
                            {s.name}
                          </h3>
                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <span className="truncate text-[9px] font-semibold text-muted-foreground">
                              {formatDuration(s.duration)}
                              {profile.show_prices && (
                                <> · <span style={{ color: profile.themeColor }}>
                                  R${s.price.toFixed(0)}
                                </span></>
                              )}
                            </span>
                            <div
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-200 group-hover:scale-110"
                              style={{ background: profile.themeColor }}
                            >
                              <Info className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Ver mais / Ver menos */}
              {profile.services.length > 6 && (
                <div className="mt-5 flex flex-col items-center gap-2">
                  {visibleServices < profile.services.length && (
                    <button onClick={() => setVisibleServices((v) => v + 6)} className="flex items-center gap-1.5 py-1">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ChevronDown className="h-4 w-4" style={{ color: profile.themeColor }} />
                      </motion.div>
                      <motion.span
                        className="text-[13px] font-semibold text-muted-foreground"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Ver mais serviços
                      </motion.span>
                    </button>
                  )}
                  {visibleServices > 6 && (
                    <button
                      onClick={() => setVisibleServices(6)}
                      className="text-xs text-muted-foreground/50 underline-offset-4 hover:text-muted-foreground hover:underline transition-colors"
                    >
                      Ver menos
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </Section>


        {/* Avaliações */}
        {reviews.length > 0 && (
          <Section
            title="Avaliações"
            right={
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                <span className="text-xs font-semibold">{profile.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({profile.reviewsCount})</span>
              </div>
            }
          >
            <div className="space-y-3">
              {reviews.slice(0, visibleReviews).map((rev, idx) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (idx % 3) * 0.07, ease: "easeOut" }}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  {/* Avatar */}
                  {rev.avatarUrl ? (
                    <img
                      src={rev.avatarUrl}
                      alt={rev.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${profile.themeColor} 0%, ${profile.themeColor}99 100%)` }}
                    >
                      {rev.isAnonymous ? <User className="h-4 w-4" /> : rev.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{rev.name}</p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn("h-3 w-3", i < rev.rating ? "text-amber-400" : "text-muted-foreground/30")}
                            fill={i < rev.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{rev.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Ver mais / ver menos */}
            {reviews.length > 3 && (
              <div className="mt-5 flex flex-col items-center gap-2">
                {visibleReviews < reviews.length && (
                  <button onClick={() => setVisibleReviews((v) => v + 3)} className="flex items-center gap-1.5 py-1">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" style={{ color: profile.themeColor }} />
                    </motion.div>
                    <motion.span
                      className="text-[13px] font-semibold text-muted-foreground"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Ver mais avaliações
                    </motion.span>
                  </button>
                )}
                {visibleReviews > 3 && (
                  <button
                    onClick={() => setVisibleReviews(3)}
                    className="text-xs text-muted-foreground/60 underline-offset-4 hover:text-muted-foreground hover:underline transition-colors"
                  >
                    Ver menos
                  </button>
                )}
              </div>
            )}
          </Section>
        )}

      </main>

      {/* Footer premium — colado no final da página */}
      <footer
        className="relative mt-14 overflow-hidden text-white shadow-2xl"
        style={{
          background: profile.gradientColor2
            ? `linear-gradient(135deg, ${profile.themeColor} 0%, ${profile.gradientColor2} 100%)`
            : `linear-gradient(135deg, ${profile.themeColor} 0%, ${profile.themeColor}88 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ background: profile.coverGradient }}
        />

        <div className="relative mx-auto grid w-full max-w-md grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 px-5 py-6">
          {/* Coluna 1 — redes sociais */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Siga
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {profile.socialLinks.slice(0, 4).map(({ network, handle }) => (
                <a
                  key={network}
                  href={socialUrl(network, handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={network}
                  className="flex h-7 w-7 items-center justify-center text-white/90 transition-all duration-300 hover:scale-125 hover:text-white"
                >
                  <SocialIcon network={network} />
                </a>
              ))}
              {profile.phone && (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-7 w-7 items-center justify-center text-white/90 transition-all duration-300 hover:scale-125 hover:text-white"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
              {profile.socialLinks.length === 0 && !profile.phone && (
                <span className="text-[11px] opacity-60">—</span>
              )}
            </div>
          </div>

          {/* Separador 1 */}
          <div
            aria-hidden
            className="h-16 w-px self-center"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(136, 19, 55, 0.2) 50%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 50%, transparent 100%)",
              width: "2px",
            }}
          />

          {/* Coluna 2 — status de funcionamento */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Horário
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
              <span
                className={cn(
                  "h-2 w-2 flex-shrink-0 rounded-full shadow-[0_0_10px_currentColor]",
                  openStatus.open ? "bg-emerald-300 text-emerald-300" : "bg-rose-300 text-rose-300"
                )}
              />
              <span>{openStatus.open ? "Aberto" : "Fechado"}</span>
            </div>
            <button
              onClick={() => setHoursOpen(true)}
              className="group inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tight underline-offset-4 transition hover:underline"
            >
              <Clock className="h-3 w-3 opacity-80 transition-transform group-hover:-rotate-12" />
              Ver horários
            </button>
          </div>

          {/* Separador 2 */}
          <div
            aria-hidden
            className="h-16 self-center"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(136, 19, 55, 0.2) 50%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 50%, transparent 100%)",
              width: "2px",
            }}
          />

          {/* Coluna 3 — endereço */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Endereço
            </span>
            <div className="max-w-[110px] space-y-0.5 text-center">
              {profile.streetLine && (
                <p className="line-clamp-1 text-[11px] font-medium leading-tight opacity-90">
                  {profile.streetLine}
                </p>
              )}
              {profile.neighborhood && (
                <p className="line-clamp-1 text-[11px] leading-tight opacity-75">
                  {profile.neighborhood}
                </p>
              )}
              <p className="line-clamp-1 text-[11px] font-medium leading-tight opacity-90">
                {profile.city || "—"}
              </p>
            </div>
            <button
              onClick={() => setMapOpen(true)}
              className="group inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tight underline-offset-4 transition hover:underline"
            >
              <Navigation className="h-3 w-3 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              Ver mapa
            </button>
          </div>
        </div>

        <div className="relative border-t border-primary-foreground/10">
          <p className="mx-auto max-w-md px-5 py-2.5 text-center text-[10px] font-medium opacity-80">
            Página criada com{" "}
            <Link to="/" className="font-semibold underline-offset-4 transition hover:underline hover:opacity-100">
              SuaAgenda.Pro
            </Link>
          </p>
        </div>
      </footer>

      {/* Modal — horários de funcionamento */}
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Horários de funcionamento</DialogTitle>
          </DialogHeader>
          <div className="mt-2 overflow-hidden rounded-2xl border border-border/60">
            {profile.hours.map((h) => {
              const isToday = openStatus.today?.day === h.day;
              return (
                <div
                  key={h.day}
                  className={cn(
                    "flex items-center justify-between border-b border-border/40 px-4 py-2.5 text-sm last:border-0",
                    isToday && "bg-secondary"
                  )}
                >
                  <span className={cn("font-medium", isToday && "text-primary")}>
                    {h.day} {isToday && <span className="ml-1 text-[10px] uppercase tracking-wider">hoje</span>}
                  </span>
                  <span className={cn("text-muted-foreground", h.closed && "text-destructive")}>
                    {h.closed ? "Fechado" : `${h.open} – ${h.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal — mapa */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="font-display text-xl">Como chegar</DialogTitle>
          </DialogHeader>
          <div className="px-5 pt-2 space-y-0.5">
            {profile.streetLine && (
              <p className="text-sm font-semibold">{profile.streetLine}</p>
            )}
            {profile.neighborhood && (
              <p className="text-xs text-muted-foreground">{profile.neighborhood}</p>
            )}
            <p className="text-xs text-muted-foreground">{profile.city}</p>
          </div>
          <div className="mt-3 aspect-square w-full bg-secondary">
            <iframe
              title="Mapa da localização"
              src={`https://www.google.com/maps?q=${profile.mapQuery}&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="p-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${profile.mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow"
            >
              <Navigation className="h-4 w-4" /> Abrir no Google Maps
            </a>
          </div>
        </DialogContent>
      </Dialog>


      {/* Sticky CTA — FAB redondo no canto, expande ao toque e volta ao inicial após onboarding */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-5 pb-5">
        <div
          className={cn(
            "pointer-events-auto mx-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            ctaExpanded ? "max-w-md" : "ml-auto mr-0 max-w-[56px]"
          )}
        >
          <Button
            onClick={() => {
              if (!ctaExpanded) {
                setCtaExpanded(true);
              } else {
                startBooking();
              }
            }}
            size="lg"
            aria-label="Agendar horário"
            className={cn(
              "font-semibold text-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              ctaExpanded
                ? "h-14 w-full rounded-2xl px-6 text-base"
                : "flex h-14 w-14 items-center justify-center rounded-full p-0 text-sm"
            )}
            style={{ background: profile.themeColor }}
          >
            {ctaExpanded ? (
              <>
                <CalendarDays className="mr-2 h-5 w-5" />
                <span className="max-w-[200px] overflow-hidden whitespace-nowrap transition-all duration-300 opacity-100">
                  Agendar horário
                </span>
              </>
            ) : (
              <CalendarDays className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <BookingSheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setCtaExpanded(false);
        }}
        services={profile.services}
        preselect={preselect}
        professionalName={profile.name}
        professionalSlug={profile.slug}
        professionalId={profile.id}
        professionalPhone={profile.phone}
        pix={profile.pix}
        mpConnected={profile.mpConnected}
        scheduleBlocks={loaderData?.scheduleBlocks ?? []}
        openDays={profile.hours
          .map((h, i) => (h.closed ? -1 : i))
          .filter((i) => i >= 0)}
      />

      {/* Preview de foto do portfólio */}
      <Sheet
        open={!!portfolioPreview}
        onOpenChange={(o) => !o && setPortfolioPreview(null)}
      >
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto p-0">
          {portfolioPreview && (
            <div>
              <div className="aspect-[9/16] w-full overflow-hidden bg-black">
                <img
                  src={portfolioPreview.src}
                  alt={portfolioPreview.title || "Trabalho"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {portfolioPreview.category}
                </p>
                <h3 className="font-display text-xl font-bold">
                  {portfolioPreview.title || "Sem título"}
                </h3>
                {portfolioPreview.description && (
                  <p className="text-sm text-muted-foreground">
                    {portfolioPreview.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Detalhes do serviço */}
      <Sheet open={!!detailsService} onOpenChange={(o) => !o && setDetailsService(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          {detailsService && (() => {
            const cat = categoryMeta(detailsService.category);
            return (
              <div className="space-y-5 pb-2">
                <SheetHeader className="space-y-3 text-left">
                  <span
                    className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: `${profile.themeColor}33`, color: profile.themeColor }}
                  >
                    <span>{cat.emoji}</span> {detailsService.categoryLabel}
                  </span>
                  <SheetTitle className="font-display text-2xl font-bold">
                    {detailsService.name}
                  </SheetTitle>
                </SheetHeader>

                {detailsService.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {detailsService.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-3 w-3" /> Duração
                    </div>
                    <div className="mt-1 font-display text-xl font-bold">
                      {detailsService.duration} min
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Investimento
                    </div>
                    <div className="mt-1 font-display text-xl font-bold text-gradient">
                      {formatPrice(detailsService.price)}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const s = detailsService;
                    setDetailsService(null);
                    startBooking(s);
                  }}
                  size="lg"
                  className="h-13 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
                >
                  <CalendarDays className="mr-2 h-5 w-5" />
                  Agendar este serviço
                </Button>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
