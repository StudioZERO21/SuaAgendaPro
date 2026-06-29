import { useEffect, useState } from "react";
import { Wrench, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemConfig } from "./system-mode-provider";

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) { setRemaining(null); return; }
    const calc = () => Math.max(0, new Date(endsAt).getTime() - Date.now());
    setRemaining(calc());
    const iv = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  return remaining;
}

function formatCountdown(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function MaintenanceOverlay() {
  const { config, refresh } = useSystemConfig();
  const remaining = useCountdown(config?.maintenanceEndsAt ?? null);

  useEffect(() => {
    if (remaining === 0) setTimeout(refresh, 5_000);
  }, [remaining, refresh]);

  if (!config?.maintenanceModeActive) return null;

  const endsAtFormatted = config.maintenanceEndsAt
    ? new Date(config.maintenanceEndsAt).toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="gradient-primary flex h-20 w-20 items-center justify-center rounded-3xl shadow-glow mb-6">
        <Wrench className="h-10 w-10 text-white" />
      </div>

      <h1 className="font-display text-3xl font-bold text-foreground mb-3">
        Manutenção Preventiva
      </h1>

      <p className="text-muted-foreground max-w-sm text-base leading-relaxed mb-6">
        {config.maintenanceMessage}
      </p>

      {remaining !== null && remaining > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Previsão de retorno em {formatCountdown(remaining)}
        </div>
      )}

      {endsAtFormatted && (
        <p className="text-xs text-muted-foreground mb-8">
          Previsão: {endsAtFormatted}
        </p>
      )}

      <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Verificar agora
      </Button>
    </div>
  );
}
