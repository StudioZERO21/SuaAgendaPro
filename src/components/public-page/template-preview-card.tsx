import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_META } from "@/lib/theme-meta";
import type { Theme } from "@/lib/themes";

type Props = {
  theme: Theme;
  selected?: boolean;
  onSelect: () => void;
};

/** Mini mockup da página pública para escolha de template. */
export function TemplatePreviewCard({ theme, selected, onSelect }: Props) {
  const c = theme.colors;
  const f = theme.fonts;
  const sh = theme.shape;
  const meta = THEME_META[theme.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all",
        "hover:shadow-md active:scale-[0.99]",
        selected
          ? "border-primary ring-2 ring-primary/35 shadow-md"
          : "border-border/70 bg-card hover:border-primary/30",
      )}
    >
      {/* Mockup do celular */}
      <div className="relative bg-muted/40 p-3 pb-2">
        <div
          className="mx-auto overflow-hidden shadow-sm"
          style={{
            width: "100%",
            maxWidth: 148,
            borderRadius: 14,
            border: `1px solid ${c.border}`,
            background: c.bg,
            fontFamily: f.body,
          }}
        >
          <PreviewNav c={c} f={f} sh={sh} />
          <PreviewHero theme={theme} />
          <PreviewBody c={c} f={f} sh={sh} />
          <PreviewFab c={c} sh={sh} />
        </div>
        {selected && (
          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 border-t border-border/50 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="truncate text-[13px] font-bold leading-tight text-foreground"
              style={{ fontFamily: f.heading }}
            >
              {theme.name}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
              {meta.description}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{ background: c.tagBg, color: c.primary }}
          >
            {theme.category}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {meta.segments.slice(0, 2).map((seg) => (
            <span
              key={seg}
              className="rounded-md px-1.5 py-px text-[9px] text-muted-foreground"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              {seg}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function PreviewNav({
  c,
  f,
  sh,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 7px",
        background: c.surface,
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: c.ctaBg,
        }}
      />
      <span
        style={{
          fontFamily: f.body,
          fontSize: 6,
          fontWeight: 600,
          color: c.primary,
          border: `1px solid ${c.primary}`,
          borderRadius: sh.btn,
          padding: "2px 5px",
        }}
      >
        Agendar
      </span>
    </div>
  );
}

function PreviewHero({ theme }: { theme: Theme }) {
  const c = theme.colors;
  const f = theme.fonts;
  const style = theme.heroStyle;

  if (style === "simple") return <HeroSimple c={c} f={f} sh={theme.shape} />;
  if (style === "cinematic") return <HeroCinematic c={c} f={f} sh={theme.shape} />;
  if (style === "premium") return <HeroPremium c={c} f={f} sh={theme.shape} />;
  if (style === "soft") return <HeroColorful c={c} f={f} sh={theme.shape} script />;
  return <HeroColorful c={c} f={f} sh={theme.shape} />;
}

function HeroPremium({
  c,
  f,
  sh,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
}) {
  return (
    <div
      style={{
        background: c.hero,
        padding: "10px 8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `1.5px solid ${c.primary}`,
          padding: 1,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: c.card,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: f.heading,
          fontSize: 8,
          fontWeight: 700,
          color: c.text,
          lineHeight: 1.1,
        }}
      >
        Studio
      </div>
      <div style={{ fontSize: 5, color: c.starColor, letterSpacing: 1, marginTop: 2 }}>
        ★★★★★
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 5,
          color: c.primary,
          border: `1px solid ${c.border}`,
          borderRadius: sh.btn,
          padding: "2px 4px",
        }}
      >
        @studio
      </div>
    </div>
  );
}

function HeroColorful({
  c,
  f,
  sh,
  script,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
  script?: boolean;
}) {
  return (
    <div
      style={{
        background: c.hero,
        padding: "10px 8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.85)",
          marginBottom: 4,
          background: "rgba(255,255,255,0.15)",
        }}
      />
      <div
        style={{
          fontFamily: f.heading,
          fontSize: 8,
          fontWeight: 700,
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        Studio
      </div>
      {script ? (
        <span style={{ fontFamily: f.accent, fontSize: 7, color: "rgba(255,255,255,0.9)" }}>
          Beleza
        </span>
      ) : (
        <span
          style={{
            fontSize: 5,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Profissional
        </span>
      )}
      <div
        style={{
          marginTop: 4,
          fontSize: 5,
          color: "#fff",
          background: "rgba(255,255,255,0.2)",
          borderRadius: 999,
          padding: "2px 5px",
        }}
      >
        ★ 5.0
      </div>
    </div>
  );
}

function HeroSimple({
  c,
  f,
  sh,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
}) {
  return (
    <div style={{ background: c.hero, padding: "8px 7px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: sh.card,
            border: `1px solid ${c.border}`,
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: f.heading,
              fontSize: 7,
              fontWeight: 700,
              color: c.text,
            }}
          >
            Studio
          </div>
          <div
            style={{
              fontSize: 5,
              color: c.textSec,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Profissional
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCinematic({
  c,
  f,
  sh,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 52,
        background: c.hero,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 22,
          height: 30,
          borderRadius: sh.photo,
          border: `1px solid ${c.border}`,
          background: c.surface,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 60%)",
        }}
      />
      <div style={{ position: "absolute", bottom: 5, left: 7, right: 7 }}>
        <div
          style={{
            fontFamily: f.heading,
            fontSize: 9,
            fontWeight: 700,
            color: "#fff",
            textTransform: "uppercase",
            lineHeight: 0.9,
          }}
        >
          STUDIO
        </div>
        <div style={{ fontSize: 4, color: c.primary, letterSpacing: 1.5, marginTop: 2 }}>
          BARBER
        </div>
      </div>
    </div>
  );
}

function PreviewBody({
  c,
  f,
  sh,
}: {
  c: Theme["colors"];
  f: Theme["fonts"];
  sh: Theme["shape"];
}) {
  return (
    <div style={{ padding: "5px 6px 8px", background: c.bg }}>
      <p
        style={{
          fontFamily: f.heading,
          fontSize: 6,
          fontWeight: 700,
          color: c.sectionTitle,
          margin: "0 0 3px",
        }}
      >
        Serviços
      </p>
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: sh.card,
          padding: "4px 5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: c.tagBg,
            }}
          />
          <span style={{ fontSize: 5.5, fontWeight: 600, color: c.text }}>Corte</span>
        </div>
        <span style={{ fontFamily: f.heading, fontSize: 5.5, fontWeight: 700, color: c.primary }}>
          R$ 80
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: sh.photo,
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewFab({
  c,
  sh,
}: {
  c: Theme["colors"];
  sh: Theme["shape"];
}) {
  return (
    <div style={{ position: "relative", height: 14, background: c.bg }}>
      <div
        style={{
          position: "absolute",
          right: 6,
          bottom: 3,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: c.ctaBg,
          boxShadow: `0 2px 6px ${c.ctaBg}66`,
        }}
      />
    </div>
  );
}
