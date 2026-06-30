import { useCallback, useSyncExternalStore } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PEAK_DAYS, PEAK_SLOTS, type PeakCell } from "@/hooks/useDashboard";
import { peakIntensityAlpha, primaryRgba } from "@/lib/theme-color";

function subscribeTheme(cb: () => void) {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });
  window.addEventListener("storage", cb);
  return () => {
    obs.disconnect();
    window.removeEventListener("storage", cb);
  };
}

function readPrimaryHex(): string {
  if (typeof document === "undefined") return "#6b7280";
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
    "#6b7280"
  );
}

type Props = {
  peakTop: PeakCell[];
  peakMatrix: number[][];
};

/** Heatmap de pico de atendimento — cores sempre seguem o accent ativo. */
export function PeakHeatmap({ peakTop, peakMatrix }: Props) {
  const primaryHex = useSyncExternalStore(subscribeTheme, readPrimaryHex, () => "#6b7280");

  const cellColor = useCallback(
    (intensity: number) => primaryRgba(peakIntensityAlpha(intensity), primaryHex),
    [primaryHex],
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
      <div className="grid grid-cols-3 gap-2">
        {peakTop.map((p, i) => (
          <div
            key={`${p.day}-${p.slot}`}
            style={{ animationDelay: `${i * 80}ms` }}
            className={cn(
              "rounded-md p-3 animate-sa-fade-in-up",
              i === 0 ? "gradient-primary text-white" : "bg-muted text-foreground",
            )}
          >
            <p
              className={cn(
                "text-[9px] font-semibold uppercase tracking-wider",
                i === 0 ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {p.day}
            </p>
            <p className="mt-1 font-display text-lg font-bold leading-none">{p.slot}</p>
            <p
              className={cn(
                "mt-2 text-[10px] font-semibold",
                i === 0 ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {p.count} atend.
            </p>
          </div>
        ))}
      </div>

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
                        animationDelay: `${(ri * 6 + ci) * 12}ms`,
                        backgroundColor: cellColor(v),
                      }}
                      className={cn(
                        "relative aspect-square rounded-sm animate-sa-scale-in",
                        isMax && "ring-2 ring-primary",
                      )}
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
              style={{ backgroundColor: primaryRgba(o, primaryHex) }}
            />
          ))}
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mais
          </span>
        </div>
      </div>
    </div>
  );
}

export function PeakHeatmapSection({
  peakTop,
  peakMatrix,
}: Props) {
  return (
    <section className="mt-6 px-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pico de atendimento
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          <Flame className="h-3 w-3" /> Alta demanda
        </span>
      </div>
      <PeakHeatmap peakTop={peakTop} peakMatrix={peakMatrix} />
    </section>
  );
}
