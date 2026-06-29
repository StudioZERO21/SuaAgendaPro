import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SystemConfig = {
  testModeActive: boolean;
  testModeExpiresAt: string | null;
  testSessionId: string;
  maintenanceModeActive: boolean;
  maintenanceEndsAt: string | null;
  maintenanceMessage: string;
  updatedAt: string;
  updatedBy: string | null;
};

const CACHE_KEY = "sa.sysconfig";
const CACHE_TTL_MS = 90_000;

function isExpired(isoString: string | null): boolean {
  if (!isoString) return false;
  return new Date(isoString).getTime() < Date.now();
}

function readCache(): { config: SystemConfig; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

const SystemConfigContext = createContext<{
  config: SystemConfig | null;
  loading: boolean;
  refresh: () => void;
}>({ config: null, loading: true, refresh: () => {} });

export function SystemModeProvider({ children }: { children: React.ReactNode }) {
  const cached = typeof window !== "undefined" ? readCache() : null;
  const [config, setConfig] = useState<SystemConfig | null>(cached?.config ?? null);
  const [loading, setLoading] = useState(!cached);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("system_config")
        .select("*")
        .eq("id", 1)
        .single();
      if (!data) return;
      const cfg: SystemConfig = {
        testModeActive:        data.test_mode_active && !isExpired(data.test_mode_expires_at),
        testModeExpiresAt:     data.test_mode_expires_at,
        testSessionId:         data.test_session_id,
        maintenanceModeActive: data.maintenance_mode_active && !isExpired(data.maintenance_ends_at),
        maintenanceEndsAt:     data.maintenance_ends_at,
        maintenanceMessage:    data.maintenance_message,
        updatedAt:             data.updated_at,
        updatedBy:             data.updated_by,
      };
      setConfig(cfg);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ config: cfg, ts: Date.now() }));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return (
    <SystemConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  return useContext(SystemConfigContext);
}
