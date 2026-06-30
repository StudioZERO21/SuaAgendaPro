import { cn } from "@/lib/utils";
import { useThemeBrand } from "@/lib/theme-color";

type Props = {
  time: string;
  className?: string;
};

/** Badge de horário que segue o accent ativo (ex.: Próximos hoje no dashboard). */
export function ThemeTimeBadge({ time, className }: Props) {
  const brand = useThemeBrand();

  return (
    <div
      style={{ background: brand.gradient }}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-lg text-white shadow-glow",
        className,
      )}
    >
      <span className="font-display text-sm font-bold leading-none">{time}</span>
    </div>
  );
}
