import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { verifySuperToken } from "@/lib/super-auth.server";

async function requireSuperAuth() {
  const req = getRequest();
  const token = req?.headers.get("x-super-token") ?? null;
  if (!await verifySuperToken(token)) throw new Error("Unauthorized");
}

export type TableStat = { name: string; rows: number; sizeBytes: number; sizePretty: string };
export type ApiStatus = "ok" | "error" | "unconfigured";

export type InfraStats = {
  tables: TableStat[];
  totalDbBytes: number;
  storageBytes: number;
  storageBuckets: string[];
  apiHealth: { asaas: ApiStatus; resend: "ok" | "unconfigured"; evolution: ApiStatus; supabase: "ok" };
  envConfigured: { ASAAS_API_KEY: boolean; RESEND_API_KEY: boolean; EVOLUTION_API_URL: boolean; EVOLUTION_API_KEY: boolean };
};

const TRACKED_TABLES = [
  "profiles", "subscriptions", "plans", "billing_events",
  "message_templates", "admin_audit_log", "system_settings",
  "services", "appointments", "clients",
];

export const getInfraStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<InfraStats> => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Table row counts
    const tables = await Promise.all(
      TRACKED_TABLES.map(async (name) => {
        const { count, error } = await supabaseAdmin
          .from(name as any)
          .select("*", { count: "exact", head: true });
        return { name, rows: error ? -1 : (count ?? 0), sizeBytes: 0, sizePretty: "—" };
      }),
    );

    // Storage buckets
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const storageBuckets = (buckets ?? []).map((b) => b.name);

    // Env vars
    const asaasKey      = process.env.ASAAS_API_KEY        ?? "";
    const resendKey     = process.env.RESEND_API_KEY        ?? "";
    const evolutionUrl  = process.env.EVOLUTION_API_URL     ?? "";
    const evolutionKey  = process.env.EVOLUTION_API_KEY     ?? "";
    const asaasEnv      = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";

    const envConfigured = {
      ASAAS_API_KEY:    !!asaasKey,
      RESEND_API_KEY:   !!resendKey,
      EVOLUTION_API_URL: !!evolutionUrl,
      EVOLUTION_API_KEY: !!evolutionKey,
    };

    // API health — lightweight probes
    let asaasStatus: ApiStatus = "unconfigured";
    if (asaasKey) {
      try {
        const url = asaasEnv === "production"
          ? "https://api.asaas.com/api/v3/customers?limit=1"
          : "https://sandbox.asaas.com/api/v3/customers?limit=1";
        const r = await fetch(url, { headers: { access_token: asaasKey } });
        asaasStatus = r.ok ? "ok" : "error";
      } catch { asaasStatus = "error"; }
    }

    let evolutionStatus: ApiStatus = "unconfigured";
    if (evolutionUrl && evolutionKey) {
      try {
        const r = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
          headers: { apikey: evolutionKey },
        });
        evolutionStatus = r.ok ? "ok" : "error";
      } catch { evolutionStatus = "error"; }
    }

    const resendStatus: "ok" | "unconfigured" = resendKey ? "ok" : "unconfigured";

    return {
      tables,
      totalDbBytes:   0,
      storageBytes:   0,
      storageBuckets,
      apiHealth:      { asaas: asaasStatus, resend: resendStatus, evolution: evolutionStatus, supabase: "ok" },
      envConfigured,
    };
  },
);

export type AuditEntry = {
  id: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  details: Record<string, unknown>;
  performed_at: string;
};

export const getRecentLogs = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuditEntry[]> => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AuditEntry[];
  },
);
