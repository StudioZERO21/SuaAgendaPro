import iconPng from "@/assets/brand/icon.png";
import iconWebp from "@/assets/brand/icon.webp";
import stackPng from "@/assets/brand/logo-stack.png";
import stackWebp from "@/assets/brand/logo-stack.webp";
import horizontalPng from "@/assets/brand/logo-horizontal.png";
import horizontalWebp from "@/assets/brand/logo-horizontal.webp";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "stack" | "horizontal" | "icon";

const ASSETS = {
  stack: { png: stackPng, webp: stackWebp, w: 420, h: 292 },
  horizontal: { png: horizontalPng, webp: horizontalWebp, w: 300, h: 169 },
  icon: { png: iconPng, webp: iconWebp, w: 256, h: 256 },
} as const;

const HEIGHTS = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
  "2xl": "h-28",
} as const;

/**
 * Logo SuaAgenda.Pro — variantes por contexto de layout.
 *
 * - stack: login, splash, telas centradas (ícone + wordmark vertical)
 * - horizontal: header, footer, barras estreitas
 * - icon: espaços compactos (calendário 3D)
 */
export function BrandLogo({
  className,
  variant = "stack",
  size = "md",
  priority = false,
}: {
  className?: string;
  variant?: BrandLogoVariant;
  size?: keyof typeof HEIGHTS;
  /** true em login/splash — evita flash no carregamento. */
  priority?: boolean;
}) {
  const asset = ASSETS[variant];
  const height = HEIGHTS[size];

  return (
    <picture>
      <source srcSet={asset.webp} type="image/webp" />
      <img
        src={asset.png}
        alt="SuaAgenda.Pro"
        width={asset.w}
        height={asset.h}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn(
          "w-auto object-contain",
          variant === "icon" && "aspect-square",
          height,
          className,
        )}
      />
    </picture>
  );
}

/** Ícone do calendário 3D — mesmo asset do PWA. */
export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const box = {
    xs: "h-7 w-7",
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    xl: "h-16 w-16",
  } as const;

  return (
    <picture className={cn("inline-block shrink-0", box[size], className)}>
      <source srcSet={iconWebp} type="image/webp" />
      <img
        src={iconPng}
        alt=""
        aria-hidden
        width={256}
        height={256}
        className="h-full w-full object-contain"
      />
    </picture>
  );
}
