import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  getPublicSlots,
  createPublicBooking,
  type PublicData,
  type PublicPixSettings,
} from "@/lib/public-booking.functions";
import { buildPixPayload, normalizePixKey } from "@/lib/pix";
import { categoryMeta } from "@/lib/services-store";
import type { ServiceCategory } from "@/lib/mock-data";
import { formatDuration } from "@/hooks/useServicos";
import { ImageOff } from "lucide-react";

// ── Local types ────────────────────────────────────────────────

type PublicService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  price_cents: number;
  category: ServiceCategory;
  categoryLabel: string;
  imageUrl: string | null;
  description?: string;
};

type PublicReview = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  rating: number;
  text: string;
  date: string;
};

const DOW_TO_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
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

function formatPrice(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const WEEKDAY_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function getOpenStatus(hours: { day: string; open: string; close: string; closed?: boolean }[]) {
  const now = new Date();
  const today = WEEKDAY_PT[now.getDay()];
  const slot = hours.find((h) => h.day === today);
  if (!slot || slot.closed || !slot.open || !slot.close) {
    return { open: false, label: "Fechado agora", today: slot };
  }
  const [oh, om] = slot.open.split(":").map(Number);
  const [ch, cm] = slot.close.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = oh * 60 + om;
  const c = ch * 60 + cm;
  const open = cur >= o && cur < c;
  return {
    open,
    label: open ? `Aberto até ${slot.close}` : `Fechado · abre ${slot.open}`,
    today: slot,
  };
}

type PortfolioItem = { id: string; src: string; title: string; category: string; description: string };

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
  const [visibleServices, setVisibleServices] = useState(9);
  const [visibleReviews, setVisibleReviews]   = useState(3);

  useEffect(() => { getPublicProfile(slug).then(setLoaderData); }, [slug]);
  useEffect(() => { if (avatarRef.current?.complete) setAvatarLoaded(true); }, []);

  // Inject professional's theme color into CSS vars so ALL primary-colored elements match
  useEffect(() => {
    const color = loaderData?.profile?.theme_color;
    if (!color) return;
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
              {Array.from({ length: 9 }).map((_, i) => (
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

  // ── Data derivation (regular code, loaderData is PublicData here) ──
  const { profile, services, portfolio, reviews } = (() => {
    const p = loaderData.profile;
    const nameParts = p.display_name.trim().split(/\s+/).filter(Boolean);
    const initials =
      nameParts.length === 0
        ? "?"
        : nameParts.length === 1
          ? nameParts[0][0].toUpperCase()
          : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

    const themeColor = p.theme_color || "#ec4899";
    const coverGradient = `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 60%, ${themeColor}88 100%)`;
    const cityState = [p.city, p.state].filter(Boolean).join(", ");

    // Full address parts
    const streetLine = [
      p.street,
      p.street_number,
    ].filter(Boolean).join(", ");
    const fullAddress = [streetLine, p.neighborhood, cityState].filter(Boolean).join(" — ");
    const mapQuery = encodeURIComponent(fullAddress || cityState);

    type SocialLinkEntry = { network: string; handle: string };
    const socialLinks = (Array.isArray(p.social_links) ? (p.social_links as SocialLinkEntry[]) : [])
      .filter((l) => l.handle?.trim());

    const hours = DOW_TO_PT.map((day, i) => {
      const wh = loaderData.workingHours.find((h) => h.day_of_week === i);
      if (!wh || !wh.is_open || !wh.start_time || !wh.end_time) {
        return { day, open: "", close: "", closed: true as const };
      }
      return { day, open: wh.start_time.slice(0, 5), close: wh.end_time.slice(0, 5) };
    });

    const mappedServices: PublicService[] = loaderData.services.map((s) => {
      const dbCat = (s.category as ServiceCategory) || "other";
      const catMeta = categoryMeta(dbCat);
      const categoryLabel =
        dbCat === "other" && s.category_label ? s.category_label : catMeta.label;
      return {
        id: s.id,
        name: s.name,
        duration: s.duration_minutes,
        price: s.price_cents / 100,
        price_cents: s.price_cents,
        category: dbCat,
        categoryLabel,
        imageUrl: s.image_url || null,
        description: s.description ?? undefined,
      };
    });

    const mappedPortfolio = loaderData.portfolio.map((item) => ({
      id: item.id,
      src: item.image_url,
      title: item.title ?? "",
      category: "Geral",
      description: item.description ?? "",
    }));

    const mappedReviews: PublicReview[] = loaderData.reviews.map((r) => ({
      id: r.id,
      name: r.is_anonymous ? "Anônimo" : r.client_name,
      avatarUrl: r.is_anonymous ? null : (r.client_avatar_url ?? null),
      isAnonymous: r.is_anonymous,
      rating: r.rating,
      text: r.message,
      date: new Date(r.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    }));

    // Use stats from DB function (includes non-public reviews for total/avg)
    const avgRating = loaderData.reviewAvgRating > 0 ? loaderData.reviewAvgRating : 5.0;
    const totalReviewCount = loaderData.reviewTotalCount;

    return {
      profile: {
        id: p.id,
        slug: p.slug,
        name: p.display_name || "Profissional",
        tagline: p.specialty || p.bio?.slice(0, 80) || "",
        bio: p.bio || "",
        city: cityState,
        address: cityState,
        streetLine,
        neighborhood: p.neighborhood || "",
        fullAddress,
        mapQuery,
        phone: p.phone || "",
        socialLinks,
        instagram: "",
        rating: avgRating,
        reviewsCount: totalReviewCount,
        themeColor,
        gradientColor2: p.gradient_color_2 || "",
        coverGradient,
        initials,
        avatar: p.avatar_url ? { url: p.avatar_url, alt: p.display_name } : undefined,
        bannerUrl: p.banner_url || "",
        logoUrl: p.cover_url || "",
        businessName: p.specialty || p.display_name || "",
        hours,
        services: mappedServices,
        highlights: [] as string[],
        show_prices: p.show_prices,
        accept_online: p.accept_online,
        pix: loaderData.pix,
      },
      services: mappedServices,
      portfolio: mappedPortfolio,
      reviews: mappedReviews,
    };
  })();

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
              {profile.services.length > 9 && (
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
                  {visibleServices > 9 && (
                    <button
                      onClick={() => setVisibleServices(9)}
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
                      <span className="shrink-0 text-[10px] text-muted-foreground">{rev.date}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn("h-3 w-3", i < rev.rating ? "text-amber-400" : "text-muted-foreground/30")}
                          fill={i < rev.rating ? "currentColor" : "none"}
                        />
                      ))}
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
        scheduleBlocks={loaderData?.scheduleBlocks ?? []}
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

/* ------------------------ Booking flow ------------------------ */

type Step = 1 | 2 | 3 | 4;

function getNextDays(n = 10) {
  const out: { date: Date; key: string; day: string; weekday: string; month: string }[] = [];
  const wd = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const mo = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      date: d,
      key: d.toISOString().slice(0, 10),
      day: String(d.getDate()).padStart(2, "0"),
      weekday: wd[d.getDay()],
      month: mo[d.getMonth()],
    });
  }
  return out;
}

function BookingSheet({
  open,
  onOpenChange,
  services,
  preselect,
  professionalName,
  professionalSlug,
  professionalId,
  professionalPhone,
  pix,
  scheduleBlocks,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  services: PublicService[];
  preselect?: PublicService;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  professionalPhone: string;
  pix: PublicPixSettings;
  scheduleBlocks: { start_date: string; end_date: string; reason: string }[];
}) {
  const [step, setStep] = useState<Step>(preselect ? 2 : 1);
  const [service, setService] = useState<PublicService | undefined>(preselect);
  const [date, setDate] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [done, setDone] = useState(false);



  const days = useMemo(() => getNextDays(10), []);

  // Fetch real availability when date or service changes
  useEffect(() => {
    if (!date || !service) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setTime(undefined);
    getPublicSlots(professionalId, date, service.duration)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => { cancelled = true; };
  }, [date, service, professionalId]);

  function reset() {
    setStep(1);
    setService(undefined);
    setDate(undefined);
    setTime(undefined);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    // mantém aceite de políticas persistido entre agendamentos
    setDone(false);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  }

  function next() {
    setStep((s) => (Math.min(4, s + 1) as Step));
  }
  function back() {
    setStep((s) => (Math.max(1, s - 1) as Step));
  }

  function confirm() {
    // Abre modal de pagamento do sinal (Mercado Pago — mock)
    setPaymentOpen(true);
  }

  async function handlePaymentConfirmed() {
    if (!service || !date || !time) return;
    try {
      await createPublicBooking({
        data: {
          professionalId,
          serviceId: service.id,
          scheduledAt: `${date}T${time}:00`,
          durationMinutes: service.duration,
          priceCents: service.price_cents,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          notes,
        },
      });
      setPaymentOpen(false);
      setDone(true);
      toast.success("Agendamento confirmado!", {
        description: "Enviamos a confirmação para o seu WhatsApp.",
        duration: 6000,
      });
    } catch {
      setPaymentOpen(false);
      toast.error("Não foi possível confirmar o agendamento. Tente novamente.");
    }
  }

  function handlePaymentExpired() {
    setPaymentOpen(false);
    toast.error("Tempo esgotado", {
      description: "O slot foi liberado. Faça um novo agendamento.",
    });
    setTimeout(() => handleClose(false), 100);
  }

  // Initialize step when preselect changes
  if (open && preselect && !service) {
    setService(preselect);
    setStep(2);
  }

  return (
    <>
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-0">
        {done ? (
          <SuccessView
            service={service!}
            date={date!}
            time={time!}
            name={name}
            professionalName={professionalName}
            onClose={() => handleClose(false)}
          />
        ) : (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b border-border/60 bg-card/95 px-5 pb-3 pt-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <button
                  onClick={step === 1 ? () => handleClose(false) : back}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="font-display text-base">Novo agendamento</SheetTitle>
                <div className="w-9" />
              </div>
              <Stepper step={step} />
            </SheetHeader>

            <div className="px-5 py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  {step === 1 && (
                    <StepServices
                      services={services}
                      value={service}
                      onChange={(s) => {
                        setService(s);
                        next();
                      }}
                    />
                  )}
                  {step === 2 && (
                    <StepDateTime
                      days={days}
                      date={date}
                      time={time}
                      slots={slots}
                      loadingSlots={loadingSlots}
                      onDate={setDate}
                      onTime={setTime}
                      scheduleBlocks={scheduleBlocks}
                    />
                  )}
                  {step === 3 && (
                    <StepDetails
                      name={name}
                      phone={phone}
                      email={email}
                      notes={notes}
                      onName={setName}
                      onPhone={setPhone}
                      onEmail={setEmail}
                      onNotes={setNotes}
                    />
                  )}
                  {step === 4 && service && date && time && (
                    <StepReview
                      service={service}
                      date={date}
                      time={time}
                      name={name}
                      phone={phone}
                      email={email}
                      notes={notes}
                      accepted={acceptedPolicy}
                      onAcceptedChange={setAcceptedPolicy}
                      onOpenPolicy={() => setPolicyOpen(true)}
                      pix={pix}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step > 1 && (
              <div className="sticky bottom-0 border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur">
                {step === 4 ? (
                  <Button
                    onClick={confirm}
                    size="lg"
                    disabled={!acceptedPolicy}
                    className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    <Wallet className="mr-2 h-5 w-5" /> Pagar sinal e confirmar
                  </Button>
                ) : (
                  <Button
                    onClick={next}
                    size="lg"
                    disabled={
                      (step === 2 && (!date || !time)) ||
                      (step === 3 && (!name.trim() || phone.replace(/\D/g, "").length < 10 || !isValidEmail(email)))
                    }
                    className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    Continuar <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
    <PolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} professionalName={professionalName} />
    {service && (
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={(v) => {
          if (!v && paymentOpen) {
            // fechar manualmente = cancelar pagamento e liberar slot
            handlePaymentExpired();
          } else {
            setPaymentOpen(v);
          }
        }}
        service={service}
        clientName={name}
        professionalName={professionalName}
        professionalPhone={professionalPhone}
        pix={pix}
        onConfirmed={handlePaymentConfirmed}
        onExpired={handlePaymentExpired}
      />
    )}
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Serviço", "Data", "Dados", "Revisão"];
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-all",
                done || active ? "bg-primary" : "bg-secondary",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {l}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepServices({
  services,
  value,
  onChange,
}: {
  services: PublicService[];
  value?: PublicService;
  onChange: (s: PublicService) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Escolha o serviço</h3>
      <p className="mt-1 text-sm text-muted-foreground">Você pode reagendar quando precisar.</p>
      <div className="mt-4 space-y-2">
        {services.map((s) => {
          const cat = categoryMeta(s.category);
          const selected = value?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition active:scale-[0.99]",
                selected ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-xl">
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.duration} min
                </div>
              </div>
              <div className="font-display text-lg font-bold text-gradient">{formatPrice(s.price)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDateTime({
  days,
  date,
  time,
  slots,
  loadingSlots,
  onDate,
  onTime,
  scheduleBlocks,
}: {
  days: ReturnType<typeof getNextDays>;
  date?: string;
  time?: string;
  slots: string[];
  loadingSlots: boolean;
  onDate: (k: string) => void;
  onTime: (t: string) => void;
  scheduleBlocks: { start_date: string; end_date: string; reason: string }[];
}) {
  function getBlock(dateStr: string) {
    return scheduleBlocks.find((b) => dateStr >= b.start_date && dateStr <= b.end_date) ?? null;
  }

  const selectedBlock = date ? getBlock(date) : null;

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Quando você quer vir?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Próximos 10 dias disponíveis.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const selected = d.key === date;
          const block = getBlock(d.key);
          if (block) {
            const abbr = block.reason === "ferias" ? "Fér." : block.reason === "feriado" ? "Fer." : "Bloq.";
            return (
              <div
                key={d.key}
                className="flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl border border-border/40 bg-secondary/40 px-2 py-3 text-center opacity-50"
                title={`Agenda bloqueada: ${abbr}`}
              >
                <span className="text-[9px] font-semibold tracking-wider text-muted-foreground">{d.weekday}</span>
                <span className="font-display text-xl font-bold leading-none line-through text-muted-foreground">{d.day}</span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-primary leading-none">{abbr}</span>
              </div>
            );
          }
          return (
            <button
              key={d.key}
              onClick={() => onDate(d.key)}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl border px-3 py-3 text-center transition active:scale-95",
                selected
                  ? "border-primary gradient-primary text-white shadow-glow"
                  : "border-border/60 bg-card hover:border-primary/40",
              )}
            >
              <span className={cn("text-[10px] font-semibold tracking-wider", selected ? "text-white/80" : "text-muted-foreground")}>
                {d.weekday}
              </span>
              <span className="font-display text-xl font-bold leading-none">{d.day}</span>
              <span className={cn("text-[10px]", selected ? "text-white/80" : "text-muted-foreground")}>{d.month}</span>
            </button>
          );
        })}
      </div>

      <h4 className="mt-6 mb-3 text-sm font-semibold">Horários disponíveis</h4>
      {selectedBlock ? (
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            Agenda indisponível neste período ({selectedBlock.reason === "ferias" ? "Férias" : "Bloqueado"}).
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Por favor, selecione outra data.</p>
        </div>
      ) : loadingSlots ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : !date ? (
        <p className="text-sm text-muted-foreground">Selecione uma data para ver os horários.</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((t) => {
            const selected = t === time;
            return (
              <button
                key={t}
                onClick={() => onTime(t)}
                className={cn(
                  "rounded-2xl border py-3 text-sm font-semibold transition active:scale-95",
                  selected
                    ? "border-primary gradient-primary text-white shadow-glow"
                    : "border-border/60 bg-card hover:border-primary/40",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepDetails({
  name,
  phone,
  email,
  notes,
  onName,
  onPhone,
  onEmail,
  onNotes,
}: {
  name: string;
  phone: string;
  email: string;
  notes: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onEmail: (v: string) => void;
  onNotes: (v: string) => void;
}) {
  const emailInvalid = email.length > 0 && !isValidEmail(email);
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Seus dados</h3>
      <p className="mt-1 text-sm text-muted-foreground">Para confirmarmos seu agendamento via WhatsApp e e-mail.</p>
      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="b-name">Nome completo</Label>
          <Input id="b-name" value={name} onChange={(e) => onName(e.target.value)} placeholder="Seu nome" className="mt-1 h-12 rounded-2xl" />
        </div>
        <div>
          <Label htmlFor="b-phone">WhatsApp</Label>
          <PhoneInputBR
            id="b-phone"
            value={phone}
            onChange={onPhone}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="b-email">E-mail</Label>
          <Input
            id="b-email"
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            inputMode="email"
            autoComplete="email"
            className="mt-1 h-12 rounded-2xl"
          />
          {emailInvalid && (
            <p className="mt-1 text-xs text-destructive">Informe um e-mail válido.</p>
          )}
        </div>
        <div>
          <Label htmlFor="b-notes">Observações (opcional)</Label>
          <Textarea
            id="b-notes"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="Alguma preferência, alergia ou recado?"
            className="mt-1 min-h-[88px] rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({
  service,
  date,
  time,
  name,
  phone,
  email,
  notes,
  accepted,
  onAcceptedChange,
  onOpenPolicy,
  pix,
}: {
  service: PublicService;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  accepted: boolean;
  onAcceptedChange: (v: boolean) => void;
  onOpenPolicy: () => void;
  pix: PublicPixSettings;
}) {
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Tudo certo?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Revise antes de confirmar.</p>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 shadow-card">
        <div className="gradient-soft p-5">
          <Badge variant="secondary" className="bg-white/70">{categoryMeta(service.category).label}</Badge>
          <div className="mt-2 font-display text-2xl font-bold">{service.name}</div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration} min</span>
            <span>·</span>
            <span className="font-semibold text-gradient">{formatPrice(service.price)}</span>
          </div>
        </div>
        <div className="divide-y divide-border/60 bg-card">
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Data" value={fmt.charAt(0).toUpperCase() + fmt.slice(1)} />
          <Row icon={<Clock className="h-4 w-4" />} label="Horário" value={time} />
          <Row icon={<User className="h-4 w-4" />} label="Cliente" value={name} />
          <Row icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={phone} />
          {email && <Row icon={<Mail className="h-4 w-4" />} label="E-mail" value={email} />}
          {notes && <Row icon={<MessageCircle className="h-4 w-4" />} label="Observações" value={notes} />}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-card">
        <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-white">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sinal para reservar
            </div>
            <div className="text-sm font-semibold text-foreground">
              {pix?.enabled && pix?.key
                ? `PIX pessoal · ${pix.beneficiaryName || "profissional"}`
                : "Pagamento via Mercado Pago"}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-muted-foreground">Sinal (30%)</span>
          <span className="font-display text-xl font-bold text-gradient">
            {formatPrice(Math.round(service.price_cents * 0.3) / 100)}
          </span>
        </div>
        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          O restante de <strong className="text-foreground">{formatPrice(service.price - Math.round(service.price_cents * 0.3) / 100)}</strong> é pago no atendimento.
        </div>
      </div>


      <div className="mt-5 rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="b-policy"
            checked={accepted}
            onCheckedChange={(v) => onAcceptedChange(v === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="b-policy" className="cursor-pointer text-sm font-medium leading-snug">
              Li e concordo com as políticas de agendamento.
            </Label>
            <button
              type="button"
              onClick={onOpenPolicy}
              aria-haspopup="dialog"
              aria-controls="booking-policy-dialog"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden="true" /> Ler políticas de agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyDialog({
  open,
  onOpenChange,
  professionalName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  professionalName: string;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="booking-policy-dialog"
        aria-labelledby="booking-policy-title"
        aria-describedby="booking-policy-desc"
        onOpenAutoFocus={(e) => {
          // Foco inicial no botão "Entendi" — mais útil que o X de fechar
          e.preventDefault();
          confirmRef.current?.focus();
        }}
        className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle id="booking-policy-title" className="font-display text-xl">
            Políticas de agendamento
          </DialogTitle>
          <DialogDescription id="booking-policy-desc">
            Regras combinadas com {professionalName} para garantir um atendimento tranquilo para todos.
            Use Tab para navegar e Esc para fechar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed text-foreground">
          <section aria-labelledby="pol-cancel">
            <h4 id="pol-cancel" className="mb-1 font-semibold text-foreground">Cancelamento</h4>
            <p className="text-muted-foreground">
              Cancelamentos devem ser feitos com no mínimo <strong>24 horas</strong> de antecedência.
              Cancelamentos fora do prazo podem gerar uma taxa de 50% do valor do serviço.
            </p>
          </section>
          <section aria-labelledby="pol-resched">
            <h4 id="pol-resched" className="mb-1 font-semibold text-foreground">Reagendamento</h4>
            <p className="text-muted-foreground">
              Você pode reagendar gratuitamente até <strong>12 horas</strong> antes do horário marcado,
              sujeito à disponibilidade na agenda.
            </p>
          </section>
          <section aria-labelledby="pol-noshow">
            <h4 id="pol-noshow" className="mb-1 font-semibold text-foreground">Não comparecimento (no-show)</h4>
            <p className="text-muted-foreground">
              Em caso de falta sem aviso prévio, será cobrada uma taxa de <strong>100%</strong> do valor
              do serviço para garantir um novo agendamento.
            </p>
          </section>
          <section aria-labelledby="pol-late">
            <h4 id="pol-late" className="mb-1 font-semibold text-foreground">Atrasos</h4>
            <p className="text-muted-foreground">
              Tolerância de <strong>15 minutos</strong>. Após esse período, o atendimento poderá ser
              reduzido ou remarcado para preservar os horários seguintes.
            </p>
          </section>
          <section aria-labelledby="pol-confirm">
            <h4 id="pol-confirm" className="mb-1 font-semibold text-foreground">Confirmação</h4>
            <p className="text-muted-foreground">
              Você receberá uma confirmação via WhatsApp e e-mail. Responda à mensagem de
              confirmação para garantir seu horário.
            </p>
          </section>
        </div>
        <div className="pt-2">
          <Button
            ref={confirmRef}
            onClick={() => onOpenChange(false)}
            className="h-12 w-full rounded-2xl gradient-primary text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}


function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function SuccessView({
  service,
  date,
  time,
  name,
  professionalName,
  onClose,
}: {
  service: PublicService;
  date: string;
  time: string;
  name: string;
  professionalName: string;
  onClose: () => void;
}) {
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="px-6 pb-8 pt-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-white shadow-glow"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>
      <h3 className="mt-5 font-display text-2xl font-bold">Agendamento solicitado!</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {name?.split(" ")[0] || "Você"}, seu horário com <span className="font-semibold">{professionalName}</span> está reservado.
        <br />Enviamos a confirmação para seu WhatsApp e e-mail.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-border/60 gradient-soft p-5 text-left shadow-card">
        <div className="font-display text-lg font-bold">{service.name}</div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="capitalize">{fmt}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" /> {time} · {service.duration} min
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Sinal de <strong className="text-foreground">{formatPrice(Math.round(service.price_cents * 0.3) / 100)}</strong> pago via PIX pessoal.
      </div>

      <Button
        onClick={onClose}
        size="lg"
        className="mt-6 h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
      >
        Concluir
      </Button>
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  service,
  clientName,
  professionalName,
  professionalPhone,
  pix,
  onConfirmed,
  onExpired,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: PublicService;
  clientName: string;
  professionalName: string;
  professionalPhone: string;
  pix: PublicPixSettings;
  onConfirmed: () => void;
  onExpired: () => void;
}) {
  const TOTAL_SECONDS = 10 * 60;
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [processing, setProcessing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // valor em reais (consistente com o resto da UI)
  const depositValue = Math.round(service.price_cents * 0.3) / 100;

  const pixPayload = useMemo(() => {
    if (!pix?.enabled || !pix?.key) return null;
    return buildPixPayload({
      key: normalizePixKey(pix.keyType, pix.key),
      name: pix.beneficiaryName || professionalName,
      city: pix.city || "BRASIL",
      amount: depositValue,
      description: `Sinal ${service.name}`.slice(0, 50),
    });
  }, [pix, professionalName, depositValue, service.name]);

  // reset ao abrir
  useEffect(() => {
    if (open) {
      setRemaining(TOTAL_SECONDS);
      setProcessing(false);
      setCopied(false);
    }
  }, [open]);

  // QR code real (lado cliente)
  useEffect(() => {
    if (!open || !pixPayload) { setQrDataUrl(null); return; }
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(pixPayload, { width: 200, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    });
  }, [open, pixPayload]);

  // contador
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { window.clearInterval(id); onExpired(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, onExpired]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = (remaining / TOTAL_SECONDS) * 100;
  const urgent = remaining <= 60;
  const firstName = clientName?.split(" ")[0] || "Você";

  // Link WhatsApp para enviar comprovante
  const proDigits = professionalPhone?.replace(/\D/g, "") || "";
  const waNumber = proDigits.startsWith("55") ? proDigits : `55${proDigits}`;
  const waComprovanteLink = proDigits
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Olá! Sou ${clientName} e acabei de realizar o pagamento do sinal para ${service.name}. Segue meu comprovante:`,
      )}`
    : null;

  async function copyPix() {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  function handleConfirm() {
    setProcessing(true);
    setTimeout(() => onConfirmed(), 600);
  }

  const hasPix = pix?.enabled && !!pix?.key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Barra de progresso topo */}
          <div className="h-1.5 w-full bg-secondary">
            <div
              className={cn("h-full transition-all duration-1000 ease-linear", urgent ? "bg-destructive" : "gradient-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="px-6 pb-6 pt-5">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="font-display text-lg">Pagamento do sinal</DialogTitle>
                  <DialogDescription className="text-xs">
                    {hasPix
                      ? `PIX pessoal · ${pix.beneficiaryName || professionalName}`
                      : "Confirme com o profissional"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Timer */}
            <div
              className={cn("mt-4 flex items-center justify-between rounded-2xl border px-4 py-3", urgent ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border/60 bg-secondary/40")}
              role="status" aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Timer className="h-4 w-4" /> Slot reservado por
              </div>
              <div className="font-display text-xl font-bold tabular-nums">{mm}:{ss}</div>
            </div>

            {/* Valor */}
            <div className="mt-4 flex items-center justify-between rounded-2xl gradient-soft px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sinal a pagar</div>
                <div className="text-xs text-muted-foreground">{service.name}</div>
              </div>
              <div className="font-display text-2xl font-bold text-gradient">{formatPrice(depositValue)}</div>
            </div>

            {/* QR Code real ou placeholder */}
            <div className="mt-4 flex flex-col items-center rounded-3xl border border-border/60 bg-card p-5">
              {hasPix ? (
                qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code PIX" className="h-[176px] w-[176px] rounded-xl" />
                ) : (
                  <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground">
                    <QrCode className="h-16 w-16 animate-pulse" />
                  </div>
                )
              ) : (
                <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground">
                  <QrCode className="h-16 w-16 opacity-40" />
                </div>
              )}

              {hasPix ? (
                <>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Abra o app do seu banco e escaneie o QR Code,<br />ou copie o código PIX abaixo.
                  </p>
                  <button
                    type="button"
                    onClick={copyPix}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/70"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </>
              ) : (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  O profissional ainda não configurou uma chave PIX. Entre em contato para combinar o pagamento.
                </p>
              )}
            </div>

            {/* Instrução comprovante (só se tem PIX e WA) */}
            {hasPix && waComprovanteLink && (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3">
                <p className="text-xs font-medium text-foreground">
                  Após pagar, envie o comprovante para confirmarmos seu agendamento:
                </p>
                <a
                  href={waComprovanteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar comprovante pelo WhatsApp
                </a>
              </div>
            )}

            {/* Aviso */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {firstName}, após enviar o comprovante seu agendamento será confirmado manualmente.
              Se o tempo expirar, o slot será liberado para outras pessoas.
            </p>

            {/* CTA */}
            {hasPix && (
              <Button
                onClick={handleConfirm}
                disabled={processing || remaining === 0}
                size="lg"
                className="mt-5 h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {processing ? "Registrando…" : <><Check className="mr-2 h-5 w-5" /> Já enviei o comprovante</>}
              </Button>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar e liberar o horário
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
