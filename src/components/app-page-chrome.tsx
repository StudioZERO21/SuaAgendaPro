import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rótulo de seção — tom editorial, sem gritar ALL CAPS. */
export function AppSectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-medium tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Cabeçalho padrão das telas do app logado. */
export function AppPageHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("px-5 pt-6", className)}>
      <AppSectionLabel>{eyebrow}</AppSectionLabel>
      <h1 className="mt-1 font-display text-[1.75rem] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
