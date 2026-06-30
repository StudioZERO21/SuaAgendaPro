import { ACCENTS, FONTS, type AccentId } from "@/lib/accents-data";

/** Inline surface vars set by accent in light mode; removed in dark so `.dark` CSS wins. */
export const ACCENT_SURFACE_VARS = [
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--input",
  "--rose-cloud",
  "--gradient-soft",
  "--gradient-card",
] as const;

export type CompactAccent = {
  p: string;
  g: string;
  a: string;
  r: string;
  s: string;
  sf: string;
  m: string;
  mf: string;
  b: string;
  cl: string;
  gs: string;
  gc: string;
};

export const THEME_ACCENTS: Record<AccentId, CompactAccent> = Object.fromEntries(
  ACCENTS.map((x) => [
    x.id,
    {
      p: x.primary,
      g: x.glow,
      a: x.accent,
      r: x.ring,
      s: x.secondary,
      sf: x.secondaryFg,
      m: x.muted,
      mf: x.mutedFg,
      b: x.border,
      cl: x.cloud,
      gs: x.gradientSoft,
      gc: x.gradientCard,
    },
  ]),
) as Record<AccentId, CompactAccent>;

export const THEME_FONTS: Record<string, string> = Object.fromEntries(
  FONTS.map((f) => [f.id, f.stack]),
);

export const THEME_GRAY: CompactAccent = {
  p: "#6b7280",
  g: "#9ca3af",
  a: "#4b5563",
  r: "#6b7280",
  s: "#f9fafb",
  sf: "#374151",
  m: "#f3f4f6",
  mf: "#6b7280",
  b: "#e5e7eb",
  cl: "#f9fafb",
  gs: "linear-gradient(135deg,#f3f4f6 0%,#f9fafb 50%,#f3f4f6 100%)",
  gc: "linear-gradient(135deg,#ffffff 0%,#f9fafb 100%)",
};

export function resolveIsDark(theme: ThemeId): boolean {
  if (typeof window === "undefined") return theme === "dark";
  return (
    theme === "dark" ||
    (theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

/**
 * Applies brand (accent) CSS variables. In dark mode, surface tokens are cleared
 * so the `.dark` block in styles.css governs backgrounds and borders.
 */
export function applyAccentVars(
  root: HTMLElement,
  accent: CompactAccent,
  isDark: boolean,
) {
  root.style.setProperty("--primary", accent.p);
  root.style.setProperty("--primary-glow", accent.g);
  root.style.setProperty("--accent", accent.a);
  root.style.setProperty("--ring", accent.r);
  root.style.setProperty("--primary-foreground", "#ffffff");
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg,${accent.p} 0%,${accent.a} 100%)`,
  );
  root.style.setProperty("--shadow-glow", `0 10px 30px -10px ${accent.p}73`);

  if (isDark) {
    for (const v of ACCENT_SURFACE_VARS) {
      root.style.removeProperty(v);
    }
  } else {
    root.style.setProperty("--secondary", accent.s);
    root.style.setProperty("--secondary-foreground", accent.sf);
    root.style.setProperty("--muted", accent.m);
    root.style.setProperty("--muted-foreground", accent.mf);
    root.style.setProperty("--border", accent.b);
    root.style.setProperty("--input", accent.b);
    root.style.setProperty("--rose-cloud", accent.cl);
    root.style.setProperty("--gradient-soft", accent.gs);
    root.style.setProperty("--gradient-card", accent.gc);
  }
}

/** Inline script for SSR / first paint — must stay in sync with applyAccentVars. */
export function buildThemeInitScript(): string {
  const surfaceKeys = ACCENT_SURFACE_VARS.map((k) => JSON.stringify(k)).join(",");
  return `(function(){try{
var A=${JSON.stringify(THEME_ACCENTS)};
var F=${JSON.stringify(THEME_FONTS)};
var G=${JSON.stringify(THEME_GRAY)};
var SK=[${surfaceKeys}];
var d=JSON.parse(localStorage.getItem("sa.personalizacao")||"null");
var ac=(d&&A[d.accent])||G;var font=(d&&F[d.font])||F.playfair;var theme=(d&&d.theme)||"light";
var e=document.documentElement;
var dark=theme==="dark"||(theme==="auto"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
e.style.setProperty("--primary",ac.p);e.style.setProperty("--primary-glow",ac.g);
e.style.setProperty("--accent",ac.a);e.style.setProperty("--ring",ac.r);
e.style.setProperty("--primary-foreground","#ffffff");
e.style.setProperty("--gradient-primary","linear-gradient(135deg,"+ac.p+" 0%,"+ac.a+" 100%)");
e.style.setProperty("--shadow-glow","0 10px 30px -10px "+ac.p+"73");
if(dark){for(var i=0;i<SK.length;i++)e.style.removeProperty(SK[i]);}
else{
e.style.setProperty("--secondary",ac.s);e.style.setProperty("--secondary-foreground",ac.sf);
e.style.setProperty("--muted",ac.m);e.style.setProperty("--muted-foreground",ac.mf);
e.style.setProperty("--border",ac.b);e.style.setProperty("--input",ac.b);
e.style.setProperty("--rose-cloud",ac.cl);
e.style.setProperty("--gradient-soft",ac.gs);e.style.setProperty("--gradient-card",ac.gc);
}
e.style.setProperty("--font-display",font);
e.lang="pt-BR";e.setAttribute("translate","no");
e.classList.toggle("dark",dark);if(d&&d.highContrast)e.classList.add("high-contrast");
var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute("content",ac.p);
}catch(e){}})();`;
}
