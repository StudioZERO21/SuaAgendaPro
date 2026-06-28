import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getPublicProfile, type PublicData } from "@/lib/public-booking.functions";
import { buildPublicPageModel } from "@/lib/public-page-model";
import { getPublicOpenStatus as getOpenStatus } from "@/lib/public-page-types";
import { getTheme, GOOGLE_FONTS_URL } from "@/lib/themes";
import { BookingSheet } from "@/components/public-page/public-booking-sheet";
import type { PublicService } from "@/lib/public-page-types";

export const Route = createFileRoute("/(public)/agendar/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Agendamento — SuaAgenda.Pro" },
      { property: "og:url", content: `/agendar/${params.slug}` },
    ],
    links: [
      { rel: "canonical", href: `/agendar/${params.slug}` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: GOOGLE_FONTS_URL },
    ],
  }),
  component: PublicBookingPage,
});

// ── SVG icons inlined to avoid dependency on lucide ──────────────────────────

function IgIcon({ stroke, size = 12 }: { stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <circle cx="17.5" cy="6.5" r="1.3" fill={stroke}/>
    </svg>
  );
}

function WaIcon({ stroke, size = 12 }: { stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" fill={stroke}/>
      <path d="M12 1C5.93 1 1 5.93 1 12c0 2.07.53 4.01 1.47 5.7L1 23l5.47-1.43A11 11 0 0012 23c6.07 0 11-4.93 11-11S18.07 1 12 1z" fill="none" stroke={stroke} strokeWidth="2"/>
    </svg>
  );
}

function CalIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function ClockIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function MapPinIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );
}

function StarIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function ChevronRight({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function ChevronUp({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

function CheckIcon({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function PublicBookingPage() {
  const { slug } = Route.useParams();

  const [loaderData, setLoaderData] = useState<PublicData | null | undefined>(undefined);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselect, setPreselect] = useState<PublicService | undefined>();
  const [ctaExpanded, setCtaExpanded] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const avatarRef = useRef<HTMLImageElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getPublicProfile({ data: { slug } }).then((d) => setLoaderData(d as PublicData | null)); }, [slug]);
  useEffect(() => { if (avatarRef.current?.complete) setAvatarLoaded(true); }, []);

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
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Collapse CTA on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => { if (ctaExpanded) setCtaExpanded(false); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ctaExpanded]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loaderData === undefined) {
    return (
      <div style={{ background: "#e8e8e8", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 430, background: "#fff" }}>
          <div style={{ height: 60, background: "#f0f0f0" }} />
          <div style={{ padding: "32px 20px" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#e0e0e0", margin: "0 auto 16px" }} />
            <div style={{ height: 20, background: "#e0e0e0", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 14, background: "#e8e8e8", borderRadius: 4, width: "60%", margin: "0 auto" }} />
          </div>
        </div>
      </div>
    );
  }

  if (loaderData === null) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Página não encontrada</h1>
          <p style={{ color: "#666" }}>Este link de agendamento não existe.</p>
          <a href="/" style={{ display: "inline-block", marginTop: 24, padding: "10px 24px", background: "#ec4899", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  const { profile, services, portfolio, reviews } = buildPublicPageModel(loaderData);
  const theme = getTheme(profile.templateId);
  const c = theme.colors;
  const f = theme.fonts;
  const sh = theme.shape;

  const isPremium = theme.heroStyle === "premium";
  const isLight = theme.heroStyle === "simple";
  const isCinematic = theme.heroStyle === "cinematic";
  const isColorful = !isPremium && !isLight && !isCinematic;
  const isScriptAccent = theme.heroStyle === "soft";

  const openStatus = getOpenStatus(profile.hours);
  const phoneDigits = "55" + profile.phone.replace(/\D/g, "");
  const igLink = profile.socialLinks.find(l => l.network === "instagram");

  const initials = profile.initials;

  function startBooking(s?: PublicService) {
    setPreselect(s);
    setBookingOpen(true);
  }

  // ── Inline-style helpers ──────────────────────────────────────────────────
  const S = {
    container: { width: "100%", maxWidth: 430, height: "100vh", background: c.bg, position: "relative" as const, display: "flex", flexDirection: "column" as const, overflow: "hidden" },
    nav: { position: "sticky" as const, top: 0, zIndex: 50, background: c.surface, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", flexShrink: 0 },
    navBadge: { width: 36, height: 36, borderRadius: 8, background: c.ctaBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" as const },
    navBadgeText: { color: c.ctaText, fontSize: 13, fontWeight: 700, fontFamily: f.heading },
    navBtn: { background: "transparent", border: `1.5px solid ${c.primary}`, borderRadius: 999, padding: "6px 16px", fontFamily: f.body, fontSize: 12, fontWeight: 600, color: c.primary, cursor: "pointer" },
    scroll: { flex: 1, overflowY: "auto" as const, WebkitOverflowScrolling: "touch" as const },
    sectionTitle: { fontFamily: f.heading, color: c.sectionTitle, fontSize: 18, fontWeight: 700, marginBottom: 11, letterSpacing: "-0.2px" },
    card: { background: c.card, borderRadius: sh.card, border: `1px solid ${c.border}` },
    ctaBtn: { background: c.ctaBg, color: c.ctaText, border: "none", borderRadius: sh.btn, fontFamily: f.heading, fontWeight: 700, cursor: "pointer" },
  };

  return (
    <div style={{ background: "#c8c8c8", minHeight: "100vh", display: "flex", justifyContent: "center", overflow: "hidden" }}>
      <div style={S.container}>

        {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
        <div style={S.nav}>
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.name}
              style={{ height: 34, maxWidth: 110, objectFit: "contain", display: "block" }}
            />
          ) : profile.avatar?.url ? (
            <div style={S.navBadge}>
              <img src={profile.avatar.url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={S.navBadge}>
              <span style={S.navBadgeText}>{initials.charAt(0)}</span>
            </div>
          )}
          <button onClick={() => startBooking()} style={S.navBtn}>Agendar</button>
        </div>

        {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
        <div ref={scrollRef} style={S.scroll}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>

          {/* ── HERO: LUXE / PREMIUM ──────────────────────────────────────── */}
          {isPremium && (
            <div style={{ ...(profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center top" } : { background: c.hero }), minHeight: 360, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}>
              {profile.bannerUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.62)", zIndex: 1 }} />}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 0%,${c.primary} 50%,transparent 100%)`, zIndex: 2 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 36px", position: "relative", zIndex: 3 }}>
                <span style={{ fontFamily: f.accent, color: c.primary, fontSize: 11, letterSpacing: 5, textTransform: "uppercase" as const, fontStyle: "italic", marginBottom: 6 }}>
                  {profile.tagline || "Studio"}
                </span>
                <div style={{ width: 112, height: 112, borderRadius: "50%", border: `2px solid ${c.primary}`, padding: 3, marginBottom: 14 }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `linear-gradient(135deg,${c.surface} 0%,${c.card} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {profile.avatar ? (
                      <img ref={avatarRef} src={profile.avatar.url} alt={profile.avatar.alt} onLoad={() => setAvatarLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: avatarLoaded ? "block" : "none" }} />
                    ) : null}
                    {(!profile.avatar || !avatarLoaded) && (
                      <span style={{ fontFamily: f.heading, fontSize: 34, fontWeight: 700, color: c.primary }}>{initials}</span>
                    )}
                  </div>
                </div>
                <h1 style={{ fontFamily: f.heading, color: c.text, fontSize: 27, fontWeight: 700, textAlign: "center", margin: "0 0 3px", letterSpacing: "-0.3px" }}>{profile.name}</h1>
                <p style={{ fontFamily: f.accent, color: c.textSec, fontSize: 15, fontStyle: "italic", margin: "0 0 14px" }}>{profile.tagline || "Profissional"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <span style={{ color: c.starColor, letterSpacing: 2, fontSize: 13 }}>★★★★★</span>
                  <span style={{ fontFamily: f.body, color: c.text, fontWeight: 600, fontSize: 13 }}>{profile.rating.toFixed(1)}</span>
                  <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 12 }}>({profile.reviewsCount} avaliações)</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, justifyContent: "center" }}>
                  {igLink && (
                    <a href={`https://instagram.com/${igLink.handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ background: c.tagBg, border: `1px solid ${c.border}`, padding: "8px 14px", borderRadius: sh.btn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textDecoration: "none" }}>
                      <IgIcon stroke={c.primary} />
                      <span style={{ fontFamily: f.body, color: c.text, fontSize: 11, fontWeight: 500 }}>@{igLink.handle.replace(/^@/, "")}</span>
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" style={{ background: c.tagBg, border: `1px solid ${c.border}`, padding: "8px 14px", borderRadius: sh.btn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textDecoration: "none" }}>
                      <WaIcon stroke={c.primary} />
                      <span style={{ fontFamily: f.body, color: c.text, fontSize: 11, fontWeight: 500 }}>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 0%,${c.primary} 50%,transparent 100%)` }} />
            </div>
          )}

          {/* ── HERO: COLORFUL (BLOOM / GLOW HOT / BOLD) ──────────────────── */}
          {isColorful && (
            <div style={{ ...(profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center top" } : { background: c.hero }), minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}>
              {profile.bannerUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 0 }} />}
              <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, padding: "28px 24px 40px" }}>
                <div style={{ width: 108, height: 108, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.85)", padding: 2, marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {profile.avatar ? (
                      <img ref={avatarRef} src={profile.avatar.url} alt={profile.avatar.alt} onLoad={() => setAvatarLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: avatarLoaded ? "block" : "none" }} />
                    ) : null}
                    {(!profile.avatar || !avatarLoaded) && (
                      <span style={{ fontFamily: f.heading, fontSize: 34, fontWeight: 700, color: "#fff" }}>{initials}</span>
                    )}
                  </div>
                </div>
                <h1 style={{ fontFamily: f.heading, color: "#fff", fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 3px", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{profile.name}</h1>
                {isScriptAccent ? (
                  <span style={{ fontFamily: f.accent, color: "rgba(255,255,255,0.92)", fontSize: 21, marginBottom: 12 }}>{profile.tagline || "Profissional"}</span>
                ) : (
                  <span style={{ fontFamily: f.body, color: "rgba(255,255,255,0.85)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12 }}>{profile.tagline || "Profissional"}</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 999, marginBottom: 16 }}>
                  <span style={{ color: "#fff", fontSize: 12, letterSpacing: 1 }}>★★★★★</span>
                  <span style={{ fontFamily: f.body, color: "#fff", fontWeight: 700, fontSize: 13 }}>{profile.rating.toFixed(1)}</span>
                  <span style={{ fontFamily: f.body, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>({profile.reviewsCount})</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, justifyContent: "center" }}>
                  {igLink && (
                    <a href={`https://instagram.com/${igLink.handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", padding: "7px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textDecoration: "none" }}>
                      <IgIcon stroke="white" />
                      <span style={{ fontFamily: f.body, color: "#fff", fontSize: 11, fontWeight: 600 }}>@{igLink.handle.replace(/^@/, "")}</span>
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", padding: "7px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textDecoration: "none" }}>
                      <WaIcon stroke="white" />
                      <span style={{ fontFamily: f.body, color: "#fff", fontSize: 11, fontWeight: 600 }}>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── HERO: LIGHT / SIMPLE (PURE) ────────────────────────────────── */}
          {isLight && (
            <div style={{ background: c.hero, padding: "28px 20px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 78, height: 78, borderRadius: sh.card, border: `2px solid ${c.border}`, background: c.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {profile.avatar ? (
                    <img ref={avatarRef} src={profile.avatar.url} alt={profile.avatar.alt} onLoad={() => setAvatarLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: avatarLoaded ? "block" : "none" }} />
                  ) : null}
                  {(!profile.avatar || !avatarLoaded) && (
                    <span style={{ fontFamily: f.heading, fontSize: 28, fontWeight: 700, color: c.primary }}>{initials}</span>
                  )}
                </div>
                <div>
                  <h1 style={{ fontFamily: f.heading, color: c.text, fontSize: 21, fontWeight: 700, margin: "0 0 2px" }}>{profile.name}</h1>
                  <p style={{ fontFamily: f.body, color: c.textSec, fontSize: 11, margin: "0 0 8px", letterSpacing: "1.2px", textTransform: "uppercase" as const }}>{profile.tagline || "Profissional"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: c.starColor, fontSize: 12 }}>★★★★★</span>
                    <span style={{ fontFamily: f.body, color: c.text, fontWeight: 600, fontSize: 13 }}>{profile.rating.toFixed(1)}</span>
                    <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 11 }}>({profile.reviewsCount})</span>
                  </div>
                </div>
              </div>
              {igLink && (
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <a href={`https://instagram.com/${igLink.handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: c.card, border: `1px solid ${c.border}`, padding: "9px 12px", borderRadius: sh.card, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" }}>
                    <IgIcon stroke={c.primary} size={14} />
                    <span style={{ fontFamily: f.body, color: c.text, fontSize: 12 }}>@{igLink.handle.replace(/^@/, "")}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── HERO: CINEMATIC (URBAN) ─────────────────────────────────────── */}
          {isCinematic && (
            <div style={{ height: 390, position: "relative", ...(profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: c.hero }), overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(0,0,0,0.96) 0%,rgba(0,0,0,0.1) 55%,rgba(0,0,0,0.4) 100%)", pointerEvents: "none", zIndex: 1 }} />
              <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", width: 130, height: 185, borderRadius: sh.photo, overflow: "hidden", border: `1px solid ${c.border}`, zIndex: 2, background: c.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profile.avatar ? (
                  <img src={profile.avatar.url} alt={profile.avatar.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontFamily: f.heading, fontSize: 44, fontWeight: 700, color: c.primary, letterSpacing: 3 }}>{initials}</span>
                )}
              </div>
              <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 10 }}>
                {igLink && (
                  <a href={`https://instagram.com/${igLink.handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none" }}>
                    <IgIcon stroke={c.primary} size={13} />
                  </a>
                )}
                {profile.phone && (
                  <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none" }}>
                    <WaIcon stroke={c.primary} size={13} />
                  </a>
                )}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px 22px", zIndex: 2 }}>
                <p style={{ fontFamily: f.body, color: c.primary, fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, margin: "0 0 4px" }}>STUDIO</p>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <h1 style={{ fontFamily: f.heading, color: "#ffffff", fontSize: 50, fontWeight: 700, lineHeight: 0.85, margin: 0, textTransform: "uppercase" as const, letterSpacing: 1 }}>{profile.name.toUpperCase()}</h1>
                    <p style={{ fontFamily: f.body, color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, margin: "8px 0 0" }}>{profile.tagline || "Profissional"}</p>
                  </div>
                  <div style={{ textAlign: "right", paddingBottom: 4 }}>
                    <span style={{ color: c.starColor, fontSize: 14, display: "block", letterSpacing: 1 }}>★★★★★</span>
                    <span style={{ fontFamily: f.heading, color: "#ffffff", fontSize: 22, fontWeight: 700, display: "block" }}>{profile.rating.toFixed(1)}</span>
                    <span style={{ fontFamily: f.body, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>({profile.reviewsCount} avaliações)</span>
                  </div>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c.primary},transparent)` }} />
            </div>
          )}

          {/* ── SOBRE MIM ──────────────────────────────────────────────────── */}
          <div style={{ background: c.bg, padding: "20px 18px" }}>
            <h2 style={S.sectionTitle}>Sobre Mim</h2>
            <p style={{ fontFamily: f.body, color: c.text, fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>
              {profile.bio || `Olá! Sou ${profile.name}, ${profile.tagline || "profissional de beleza"}. Atendo com cuidado e dedicação para que você se sinta incrível.`}
            </p>
            <div style={{ display: "flex", borderTop: `1px solid ${c.border}`, paddingTop: 16 }}>
              <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${c.border}` }}>
                <span style={{ fontFamily: f.heading, fontSize: 22, fontWeight: 700, color: c.primary, display: "block" }}>{services.length}</span>
                <span style={{ fontFamily: f.body, fontSize: 10, color: c.textSec, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Serviços</span>
              </div>
              <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${c.border}` }}>
                <span style={{ fontFamily: f.heading, fontSize: 22, fontWeight: 700, color: c.primary, display: "block" }}>{profile.reviewsCount}+</span>
                <span style={{ fontFamily: f.body, fontSize: 10, color: c.textSec, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Avaliações</span>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontFamily: f.heading, fontSize: 22, fontWeight: 700, color: c.primary, display: "block" }}>{profile.rating.toFixed(1)}</span>
                <span style={{ fontFamily: f.body, fontSize: 10, color: c.textSec, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>Nota</span>
              </div>
            </div>
          </div>

          {/* ── PORTFÓLIO ─────────────────────────────────────────────────── */}
          {portfolio.length > 0 && (
            <div style={{ background: c.surface, padding: "20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Portfólio</h2>
                <span style={{ fontFamily: f.body, color: c.primary, fontSize: 13, fontWeight: 600 }}>{portfolio.length} fotos</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {portfolio.slice(0, 6).map((p, i) => (
                  <div key={p.id} style={{ aspectRatio: "1", borderRadius: sh.photo, background: theme.portfolioGradients[i % 6], overflow: "hidden", position: "relative" }}>
                    <img src={p.src} alt={p.title || "Portfólio"} loading={i < 3 ? "eager" : "lazy"} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                    <div style={{ position: "absolute", inset: 0, background: theme.portfolioOverlay }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 4px", textAlign: "center" }}>
                      <span style={{ fontFamily: f.body, fontSize: 9, color: theme.portfolioLabelColor, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{p.title || p.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SERVIÇOS ──────────────────────────────────────────────────── */}
          <div style={{ background: c.bg, padding: "20px 18px" }}>
            <h2 style={S.sectionTitle}>Serviços</h2>
            {!showServices ? (
              <button onClick={() => setShowServices(true)} style={{ width: "100%", background: c.card, color: c.primary, border: `1.5px solid ${c.primary}`, borderRadius: sh.card, padding: "16px 20px", fontFamily: f.heading, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Conheça Nossos Serviços</span>
                <ChevronRight color={c.primary} />
              </button>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  {services.map((sv, i) => (
                    <div key={sv.id} style={{ background: c.card, borderRadius: sh.card, border: `1px solid ${c.border}`, padding: 14, boxShadow: theme.shadowStyle, animation: `dropIn 0.32s ease ${i * 0.09}s both` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: c.tagBg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: c.serviceIcon, fontSize: 16 }}>◆</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                            <h3 style={{ fontFamily: f.heading, color: c.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{sv.name}</h3>
                            {profile.show_prices && (
                              <span style={{ fontFamily: f.heading, color: c.primary, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" as const, marginLeft: 8 }}>
                                R$ {sv.price.toFixed(2).replace(".", ",")}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
                            <ClockIcon color={c.textSec} />
                            <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 11 }}>{sv.duration} min</span>
                          </div>
                          {sv.description && (
                            <p style={{ fontFamily: f.body, color: c.textSec, fontSize: 12, lineHeight: 1.5, margin: "0 0 10px" }}>{sv.description}</p>
                          )}
                          <button onClick={() => startBooking(sv)} style={{ ...S.ctaBtn, padding: "7px 16px", fontSize: 12 }}>
                            Agendar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowServices(false)} style={{ width: "100%", background: "transparent", color: c.textSec, border: `1px solid ${c.border}`, borderRadius: sh.card, padding: 12, fontFamily: f.body, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ChevronUp color={c.textSec} /> Ver menos
                </button>
              </>
            )}
          </div>

          {/* ── AVALIAÇÕES ────────────────────────────────────────────────── */}
          {reviews.length > 0 && (
            <div style={{ background: c.surface, padding: "20px 18px" }}>
              <h2 style={S.sectionTitle}>Avaliações</h2>

              {/* Rating summary */}
              <div style={{ ...S.card, padding: "20px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: f.heading, fontSize: 52, fontWeight: 700, color: c.primary, lineHeight: 1, display: "block", letterSpacing: "-1px" }}>{profile.rating.toFixed(1)}</span>
                  <span style={{ color: c.starColor, fontSize: 16, display: "block", margin: "4px 0", letterSpacing: 2 }}>★★★★★</span>
                  <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 11 }}>{profile.reviewsCount} avaliações</span>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3].map((star, i) => (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 7 : 0 }}>
                      <span style={{ fontFamily: f.body, fontSize: 11, color: c.textSec, width: 10, textAlign: "right" as const }}>{star}</span>
                      <div style={{ flex: 1, height: 6, background: c.border, borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: star === 5 ? "85%" : star === 4 ? "12%" : "3%", height: "100%", background: c.primary, borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsed button */}
              {!showReviews ? (
                <button onClick={() => setShowReviews(true)} style={{ width: "100%", background: c.card, color: c.primary, border: `1.5px solid ${c.primary}`, borderRadius: sh.card, padding: "14px 20px", fontFamily: f.heading, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Ver Avaliações</span>
                  <ChevronRight color={c.primary} />
                </button>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                    {reviews.map((rv, i) => (
                      <div key={rv.id} style={{ ...S.card, padding: 14, animation: `dropIn 0.32s ease ${i * 0.1}s both` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: c.tagBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {rv.avatarUrl ? (
                              <img src={rv.avatarUrl} alt={rv.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontFamily: f.body, fontSize: 16, fontWeight: 700, color: c.primary }}>{rv.name.charAt(0)}</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: f.body, color: c.text, fontWeight: 600, fontSize: 13 }}>{rv.name}</span>
                              <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 11 }}>{rv.date}</span>
                            </div>
                            <span style={{ color: c.starColor, fontSize: 11 }}>{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                          </div>
                        </div>
                        <p style={{ fontFamily: f.body, color: c.textSec, fontSize: 13, lineHeight: 1.6, margin: 0 }}>"{rv.text}"</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowReviews(false)} style={{ width: "100%", background: "transparent", color: c.textSec, border: `1px solid ${c.border}`, borderRadius: sh.card, padding: 12, fontFamily: f.body, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ChevronUp color={c.textSec} /> Ver menos
                  </button>
                </>
              )}
            </div>
          )}

          {/* spacer pushes footer to bottom on short pages */}
          <div style={{ flex: 1 }} />

          {/* ── FOOTER ────────────────────────────────────────────────────── */}
          <div style={{ background: c.footerBg, padding: "20px 18px 80px", borderTop: `1px solid ${c.border}` }}>

            {/* Siga */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: f.heading, color: c.sectionTitle, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "2.5px", marginBottom: 10 }}>Siga</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {igLink && (
                  <a href={`https://instagram.com/${igLink.handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, ...S.card, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" }}>
                    <IgIcon stroke={c.primary} size={15} />
                    <span style={{ fontFamily: f.body, color: c.text, fontSize: 13, fontWeight: 500 }}>Instagram</span>
                  </a>
                )}
                {profile.phone && (
                  <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, ...S.card, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" }}>
                    <WaIcon stroke={c.primary} size={15} />
                    <span style={{ fontFamily: f.body, color: c.text, fontSize: 13, fontWeight: 500 }}>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Horários */}
            {(() => {
              type HGroup = { days: string[]; open: string; close: string; closed: boolean };
              const groups: HGroup[] = [];
              for (const h of profile.hours) {
                const closed = !!h.closed;
                const last = groups[groups.length - 1];
                if (last && last.closed === closed && last.open === (h.open || "") && last.close === (h.close || "")) {
                  last.days.push(h.day);
                } else {
                  groups.push({ days: [h.day], open: h.open || "", close: h.close || "", closed });
                }
              }
              const todayDay = openStatus.today?.day;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ fontFamily: f.heading, color: c.sectionTitle, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "2.5px", margin: 0 }}>Horários</h3>
                    <span style={{ background: openStatus.open ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)", color: openStatus.open ? "#4ade80" : "#f87171", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, fontFamily: f.body, letterSpacing: "0.3px" }}>
                      {openStatus.open ? `● Aberto · ${openStatus.label.replace("Aberto até ", "fecha ")}` : "● Fechado agora"}
                    </span>
                  </div>
                  <div style={{ ...S.card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
                    {groups.map((g, i) => {
                      const isToday = !!todayDay && g.days.includes(todayDay);
                      const label = g.days.length === 1
                        ? g.days[0]
                        : g.days.length === 2
                          ? `${g.days[0]} e ${g.days[1]}`
                          : `${g.days[0]} a ${g.days[g.days.length - 1]}`;
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < groups.length - 1 ? `1px solid ${c.border}` : "none" }}>
                          <span style={{ fontFamily: f.body, color: isToday ? c.primary : (g.closed ? c.textSec : c.text), fontSize: 13, fontWeight: isToday ? 700 : 400, display: "flex", alignItems: "center", gap: 5 }}>
                            {label}
                            {isToday && <span style={{ background: c.tagBg, color: c.primary, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>hoje</span>}
                          </span>
                          <span style={{ fontFamily: f.body, color: g.closed ? c.textSec : (isToday ? c.primary : c.text), fontSize: 13, fontWeight: isToday ? 700 : 500, opacity: g.closed ? 0.55 : 1 }}>
                            {g.closed ? "Fechado" : `${g.open} — ${g.close}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Endereço */}
            {(profile.streetLine || profile.city) && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: f.heading, color: c.sectionTitle, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "2.5px", marginBottom: 10 }}>Endereço</h3>
                <div style={{ ...S.card, padding: 14, display: "flex", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.tagBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPinIcon color={c.primary} />
                  </div>
                  <div>
                    <p style={{ fontFamily: f.body, color: c.text, fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>{profile.name}</p>
                    {profile.streetLine && <p style={{ fontFamily: f.body, color: c.textSec, fontSize: 12, lineHeight: 1.6, margin: "0 0 3px" }}>{profile.streetLine}{profile.neighborhood ? ` — ${profile.neighborhood}` : ""}</p>}
                    {profile.city && <p style={{ fontFamily: f.body, color: c.textSec, fontSize: 12, margin: 0 }}>{profile.city}</p>}
                    {profile.mapQuery && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${profile.mapQuery}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: f.body, color: c.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block", marginTop: 6 }}>Ver no mapa →</a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Copyright */}
            <div style={{ textAlign: "center", paddingTop: 14, borderTop: `1px solid ${c.border}` }}>
              <span style={{ fontFamily: f.body, color: c.textSec, fontSize: 11 }}>© {new Date().getFullYear()} {profile.name} · </span>
              <a href="/" style={{ fontFamily: f.body, color: c.primary, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>SuaAgenda.Pro</a>
            </div>
          </div>
        </div>{/* end flex-column wrapper */}
        </div>{/* end scroll */}

        {/* ── FLOATING CTA ─────────────────────────────────────────────────── */}
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 80, pointerEvents: "none", display: bookingOpen ? "none" : "flex", justifyContent: ctaExpanded ? "center" : "flex-end", padding: ctaExpanded ? "0" : "0 20px" }}>
          {!ctaExpanded ? (
            <button
              onClick={() => setCtaExpanded(true)}
              style={{ width: 52, height: 52, borderRadius: "50%", background: c.ctaBg, color: c.ctaText, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(0,0,0,0.35)", pointerEvents: "all" }}
              aria-label="Agendar"
            >
              <CalIcon color={c.ctaText} />
            </button>
          ) : (
            <button
              onClick={() => startBooking()}
              style={{ background: c.ctaBg, color: c.ctaText, border: "none", borderRadius: sh.btn, padding: "15px 0", fontFamily: f.heading, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 28px rgba(0,0,0,0.32)", width: 220, letterSpacing: "0.5px", pointerEvents: "all", animation: "pillIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
              Agendar Agora
            </button>
          )}
        </div>
      </div>

      {/* ── KEYFRAME STYLES ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pillIn {
          0%   { opacity: 0; transform: translateX(56px) scale(0.72); }
          40%  { opacity: 1; transform: translateX(-7px) scale(1.06); }
          65%  { transform: translateX(4px) scale(0.97); }
          82%  { transform: translateX(-2px) scale(1.01); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {/* ── BOOKING SHEET ─────────────────────────────────────────────────── */}
      <BookingSheet
        open={bookingOpen}
        onOpenChange={(o) => {
          setBookingOpen(o);
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
        themeColors={{
          primary:   c.primary,
          ctaBg:     c.ctaBg,
          ctaText:   c.ctaText,
          bg:        c.bg,
          card:      c.card,
          surface:   c.surface,
          text:      c.text,
          textMuted: c.textSec,
          border:    c.border,
        }}
      />
    </div>
  );
}
