import logoUrl from "@/assets/logo-oficial.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  const heights = {
    sm: "h-7",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
    "2xl": "h-24",
  } as const;

  return (
    <img
      src={logoUrl}
      alt="SuaAgenda.Pro"
      className={cn("w-auto object-contain", heights[size], className)}
    />
  );
}

