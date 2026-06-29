import { useEffect, useState } from "react";
import { FlaskConical, Clock } from "lucide-react";
import { useSystemConfig } from "./system-mode-provider";

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }
    const calc = () => Math.max(0, new Date(expiresAt).getTime() - Date.now());
    setRemaining(calc());
    const iv = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  return remaining;
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function TestModeBanner() {
  const { config, refresh } = useSystemConfig();
  const remaining = useCountdown(config?.testModeExpiresAt ?? null);

  useEffect(() => {
    if (remaining === 0) refresh();
  }, [remaining, refresh]);

  if (!config?.testModeActive) return null;

  return (
    <div className="sticky top-0 z-[9999] w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span className="font-bold uppercase tracking-wide text-xs whitespace-nowrap">Modo Teste</span>
        <span className="text-amber-100 text-xs hidden sm:inline">—</span>
        <span className="text-amber-100 text-xs hidden sm:inline truncate">
          Dados criados serão apagados ao final do período de teste
        </span>
      </div>
      {remaining !== null && remaining > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-600 rounded-full px-3 py-1 text-xs font-mono shrink-0">
          <Clock className="h-3 w-3" />
          {formatCountdown(remaining)}
        </div>
      )}
    </div>
  );
}
