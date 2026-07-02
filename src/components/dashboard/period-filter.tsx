import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PeriodPreset, type DashboardPeriod, buildPeriod } from "@/hooks/useDashboard";

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "hoje",        label: "Hoje" },
  { id: "semana",      label: "Semana" },
  { id: "mes",         label: "Mês" },
  { id: "mes_passado", label: "Mês passado" },
  { id: "custom",      label: "Personalizado" },
];

export function PeriodFilter({
  period,
  onChange,
}: {
  period: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
}) {
  const [showPicker, setShowPicker] = useState(period.preset === "custom");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {PRESETS.map((p) => {
          const active = period.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.id === "custom") {
                  setShowPicker(true);
                  if (period.preset !== "custom") onChange(buildPeriod("custom"));
                } else {
                  setShowPicker(false);
                  onChange(buildPeriod(p.id));
                }
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {p.id === "custom" && (
                <Calendar className="mr-1 inline-block h-3 w-3" />
              )}
              {p.label}
            </button>
          );
        })}
      </div>

      {(showPicker || period.preset === "custom") && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
          <input
            type="date"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm [color-scheme:light] dark:[color-scheme:dark]"
            value={period.preset === "custom" ? period.from.toISOString().slice(0, 10) : ""}
            onChange={(e) => {
              const from = e.target.value
                ? new Date(e.target.value + "T00:00:00")
                : new Date();
              const to = period.preset === "custom" ? period.to : from;
              onChange(buildPeriod("custom", from, to));
            }}
          />
          <span className="shrink-0 text-xs text-muted-foreground">até</span>
          <input
            type="date"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm [color-scheme:light] dark:[color-scheme:dark]"
            value={period.preset === "custom" ? period.to.toISOString().slice(0, 10) : ""}
            onChange={(e) => {
              const to = e.target.value
                ? new Date(e.target.value + "T23:59:59")
                : new Date();
              const from = period.preset === "custom" ? period.from : to;
              onChange(buildPeriod("custom", from, to));
            }}
          />
        </div>
      )}
    </div>
  );
}
