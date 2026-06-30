import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Rótulo de seção — padrão Dashboard / Super Admin. */
export function AppSectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("sa-section-label", className)}>
      {children}
    </p>
  );
}

/** Cabeçalho padrão das telas do app logado (tipografia do Dashboard). */
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
    <header className={cn("border-b border-border px-5 pb-5 pt-6", className)}>
      <AppSectionLabel>{eyebrow}</AppSectionLabel>
      <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm capitalize text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
