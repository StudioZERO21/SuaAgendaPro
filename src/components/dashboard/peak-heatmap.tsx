import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PEAK_DAYS, PEAK_SLOTS, type PeakCell } from "@/hooks/useDashboard";
import {
  peakIntensityAlpha,
  peakTopCardStyle,
  primaryRgba,
  useThemeBrand,
} from "@/lib/theme-color";
import {
  listContainerVariants,
  listItemVariants,
  useDashboardMotion,
} from "@/lib/dashboard-motion";

type Props = {
  peakTop: PeakCell[];
  peakMatrix: number[][];
};

/** Heatmap de pico de atendimento — cores sempre seguem o accent ativo. */
export const PeakHeatmap = memo(function PeakHeatmap({ peakTop, peakMatrix }: Props) {
  const brand = useThemeBrand();
  const { reduced } = useDashboardMotion();

  const cellColor = useCallback(
    (intensity: number) => primaryRgba(peakIntensityAlpha(intensity), brand.primary),
    [brand.primary],
  );

  if (peakTop[0]?.count === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <p className="py-4 text-center text-sm text-muted-foreground">
          Ainda sem dados de atendimento para calcular picos.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <motion.div
        className="grid grid-cols-3 gap-2"
        variants={listContainerVariants(reduced)}
        initial="hidden"
        animate="show"
      >
        {peakTop.map((p, i) => {
          const isLead = i === 0;
          return (
            <motion.div
              key={`${p.day}-${p.slot}`}
              variants={listItemVariants(reduced)}
              style={peakTopCardStyle(i, brand)}
              className={cn(
                "rounded-md p-3",
                isLead ? "text-white shadow-glow" : "text-foreground",
              )}
            >
              <p
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider",
                  isLead ? "text-white/70" : "text-muted-foreground",
                )}
                style={!isLead ? { color: brand.primary } : undefined}
              >
                {p.day}
              </p>
              <p
                className="mt-1 font-display text-lg font-bold leading-none"
                style={!isLead ? { color: brand.primary } : undefined}
              >
                {p.slot}
              </p>
              <p
                className={cn(
                  "mt-2 text-[10px] font-semibold",
                  isLead ? "text-white/80" : "opacity-80",
                )}
                style={!isLead ? { color: brand.primary } : undefined}
              >
                {p.count} atend.
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <div className="w-8" />
          <div className="grid flex-1 grid-cols-6 gap-1">
            {PEAK_DAYS.map((day) => (
              <span
                key={day}
                className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1.5 space-y-1">
          {peakMatrix.map((row, ri) => (
            <div key={PEAK_SLOTS[ri]} className="flex items-center gap-2">
              <span className="w-8 text-[10px] font-semibold text-muted-foreground">
                {PEAK_SLOTS[ri]}
              </span>
              <div className="grid flex-1 grid-cols-6 gap-1">
                {row.map((v, ci) => {
                  const isMax = v >= 9;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      style={{
                        backgroundColor: cellColor(v),
                        boxShadow: isMax ? `0 0 0 2px ${brand.primary}` : undefined,
                      }}
                      className="relative aspect-square rounded-sm transition-colors duration-150"
                      title={`${PEAK_DAYS[ci]} ${PEAK_SLOTS[ri]} — ${v}/10`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menos
          </span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
            <span
              key={o}
              className="h-2.5 w-3 rounded-sm"
              style={{ backgroundColor: primaryRgba(o, brand.primary) }}
            />
          ))}
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mais
          </span>
        </div>
      </div>
    </div>
  );
});

export function PeakHeatmapSection({ peakTop, peakMatrix }: Props) {
  const brand = useThemeBrand();

  return (
    <section className="mt-6 px-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pico de atendimento
        </h2>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: primaryRgba(0.12, brand.primary),
            color: brand.primary,
          }}
        >
          <Flame className="h-3 w-3" /> Alta demanda
        </span>
      </div>
      <PeakHeatmap peakTop={peakTop} peakMatrix={peakMatrix} />
    </section>
  );
}
