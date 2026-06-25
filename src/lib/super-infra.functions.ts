import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";
import { getServerEnv } from "@/lib/server-env";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiStatus = "ok" | "error" | "unconfigured";

export type InfraStats = {
  storageBuckets: string[];
  apiHealth: { asaas: ApiStatus; resend: ApiStatus; evolution: ApiStatus; supabase: "ok" };
  envConfigured: {
    ASAAS_API_KEY: boolean;
    RESEND_API_KEY: boolean;
    EVOLUTION_API_URL: boolean;
    EVOLUTION_API_KEY: boolean;
    HOSTINGER_API_TOKEN: boolean;
  };
};

export type VpsStats = {
  configured: boolean;
  error?: string;
  plan: string;
  state: string;
  hostname: string;
  ipv4: string;
  cpus: number;
  memoryMB: number;
  diskMB: number;
  bandwidthMB: number;
  uptimeSeconds: number;
  cpuPercent: number;
  ramUsedBytes: number;
  diskUsedBytes: number;
  template: string;
  createdAt: string;
};

// ─── Supabase Stats ───────────────────────────────────────────────────────────

export type SupabasePlan = "free" | "pro" | "team";

export type SupabaseTableStat = {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
};

export type SupabaseBucketStat = {
  bucket: string;
  fileCount: number;
  sizeBytes: number;
};

export type SupabaseStats = {
  plan: SupabasePlan;
  region: string;
  dbBytes: number;
  authUsers: number;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  tables: SupabaseTableStat[];
  buckets: SupabaseBucketStat[];
  storageTotalBytes: number;
  limits: {
    dbBytes: number;       // 500 MB free / 8 GB pro
    storageBytes: number;  // 1 GB free / 100 GB pro
    connections: number;   // 60 free / 120 pro
  };
};

export type EvolutionInstance = {
  name: string;
  state: "open" | "close" | "connecting" | string;
  profileName: string;
  profilePicture: string | null;
  number: string | null;
};

export type EvolutionStats = {
  configured: boolean;
  instances: EvolutionInstance[];
  version: string;
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function latestMetricValue(usage: Record<string, number> | undefined): number {
  if (!usage) return 0;
  const entries = Object.entries(usage);
  if (entries.length === 0) return 0;
  return entries[entries.length - 1][1];
}

// ─── Server Functions ──────────────────────────────────────────────────────────

export const getInfraStats = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<InfraStats> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const storageBuckets = (buckets ?? []).map((b) => b.name);

    const asaasKey     = getServerEnv("ASAAS_API_KEY");
    const resendKey    = getServerEnv("RESEND_API_KEY");
    const evolutionUrl = getServerEnv("EVOLUTION_API_URL");
    const evolutionKey = getServerEnv("EVOLUTION_API_KEY");
    const hostingerKey = getServerEnv("HOSTINGER_API_TOKEN");
    const asaasEnv     = getServerEnv("ASAAS_ENV") === "production" ? "production" : "sandbox";

    const envConfigured = {
      ASAAS_API_KEY:        !!asaasKey,
      RESEND_API_KEY:       !!resendKey,
      EVOLUTION_API_URL:    !!evolutionUrl,
      EVOLUTION_API_KEY:    !!evolutionKey,
      HOSTINGER_API_TOKEN:  !!hostingerKey,
    };

    // Probe APIs in parallel
    const [asaasStatus, evolutionStatus] = await Promise.all([
      (async (): Promise<ApiStatus> => {
        if (!asaasKey) return "unconfigured";
        try {
          const base = asaasEnv === "production" ? "https://api.asaas.com" : "https://sandbox.asaas.com";
          const r = await fetch(`${base}/api/v3/customers?limit=1`, { headers: { access_token: asaasKey } });
          return r.ok ? "ok" : "error";
        } catch { return "error"; }
      })(),
      (async (): Promise<ApiStatus> => {
        if (!evolutionUrl || !evolutionKey) return "unconfigured";
        try {
          const base = evolutionUrl.replace(/\/+$/, "");
          const r = await fetch(`${base}/instance/all`, { headers: { apikey: evolutionKey } });
          return r.ok ? "ok" : "error";
        } catch { return "error"; }
      })(),
    ]);

    return {
      storageBuckets,
      apiHealth: {
        asaas:    asaasStatus,
        resend:   resendKey ? "ok" : "unconfigured",
        evolution: evolutionStatus,
        supabase: "ok",
      },
      envConfigured,
    };
  });

export const getVpsStats = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<VpsStats> => {
    await requireSuperAuth(data._st ?? null);

    const token = process.env.HOSTINGER_API_TOKEN ?? "";
    const vmId  = parseInt(process.env.HOSTINGER_VM_ID ?? "1772059", 10);

    const empty = (error?: string): VpsStats => ({
      configured: !!token, error,
      plan: "", state: "", hostname: "", ipv4: "",
      cpus: 0, memoryMB: 0, diskMB: 0, bandwidthMB: 0,
      uptimeSeconds: 0, cpuPercent: 0, ramUsedBytes: 0, diskUsedBytes: 0,
      template: "", createdAt: "",
    });

    try {
      // O MCP da Hostinger usa OAuth2 (JWT) armazenado em credentials.json
      // Lemos o mesmo arquivo para usar o token válido
      const { readFile, writeFile } = await import("node:fs/promises");
      const { join } = await import("node:path");

      const credsPath = process.env.APPDATA
        ? join(process.env.APPDATA, "hostinger-mcp", "credentials.json")
        : join(process.env.HOME ?? "", ".config", "hostinger-mcp", "credentials.json");

      let accessToken = token; // fallback para .env se não conseguir ler o arquivo

      try {
        const raw = JSON.parse(await readFile(credsPath, "utf8")) as {
          client_id: string; access_token: string; refresh_token: string; expires_at: number;
        };

        // Verifica se o access_token ainda é válido (com 60s de margem)
        if (raw.expires_at > Date.now() + 60_000) {
          accessToken = raw.access_token;
        } else {
          // Refresh via OAuth2
          const refreshRes = await fetch("https://auth.hostinger.com/api/external/v1/oauth-server/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: raw.refresh_token,
              client_id: raw.client_id,
            }),
          });
          if (refreshRes.ok) {
            const newTokens = await refreshRes.json() as any;
            accessToken = newTokens.access_token;
            // Salva novos tokens
            await writeFile(credsPath, JSON.stringify({
              ...raw,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token ?? raw.refresh_token,
              expires_at: Date.now() + (newTokens.expires_in ?? 3600) * 1000,
            }, null, 2), "utf8").catch(() => {});
          }
        }
      } catch { /* usa token do .env como fallback */ }

      if (!accessToken) return empty("Sem credencial — configure HOSTINGER_API_TOKEN no .env");

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };

      // O MCP usa https://developers.hostinger.com (não api.hostinger.com) com path /api/vps/v1/...
      const HAPI = "https://developers.hostinger.com";
      const vmRes = await fetch(`${HAPI}/api/vps/v1/virtual-machines/${vmId}`, { headers });
      if (!vmRes.ok) {
        const body = await vmRes.text().catch(() => "");
        return empty(`Hostinger ${vmRes.status}: ${body.slice(0, 150)}`);
      }

      const vm = await vmRes.json() as any;

      // Métricas em tempo real (opcional — não quebra se falhar)
      let cpuPercent = 0, ramUsedBytes = 0, diskUsedBytes = 0, uptimeSeconds = 0;
      try {
        const now  = new Date();
        const from = new Date(now.getTime() - 30 * 60 * 1000);
        const metricsRes = await fetch(
          `${HAPI}/api/vps/v1/virtual-machines/${vmId}/metrics?date_from=${from.toISOString()}&date_to=${now.toISOString()}`,
          { headers },
        );
        if (metricsRes.ok) {
          const m = await metricsRes.json() as any;
          cpuPercent    = latestMetricValue(m.cpu_usage?.usage);
          ramUsedBytes  = latestMetricValue(m.ram_usage?.usage);
          diskUsedBytes = latestMetricValue(m.disk_space?.usage);
          uptimeSeconds = latestMetricValue(m.uptime?.usage);
        }
      } catch { /* métricas são opcionais */ }

      return {
        configured: true,
        plan:         vm.plan               ?? "",
        state:        vm.state              ?? "unknown",
        hostname:     vm.hostname           ?? "",
        ipv4:         vm.ipv4?.[0]?.address ?? "",
        cpus:         vm.cpus               ?? 0,
        memoryMB:     vm.memory             ?? 0,
        diskMB:       vm.disk               ?? 0,
        bandwidthMB:  vm.bandwidth          ?? 0,
        uptimeSeconds, cpuPercent, ramUsedBytes, diskUsedBytes,
        template:     vm.template?.name     ?? "",
        createdAt:    vm.created_at         ?? "",
      };
    } catch (e: any) {
      return empty(e?.message ?? "Erro de conexão");
    }
  });

export const getEvolutionStats = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<EvolutionStats> => {
    await requireSuperAuth(data._st ?? null);

    const url = process.env.EVOLUTION_API_URL ?? "";
    const key = process.env.EVOLUTION_API_KEY ?? "";

    if (!url || !key) {
      return { configured: false, instances: [], version: "" };
    }

    const headers = { apikey: key };
    const base = url.replace(/\/+$/, "");

    let instances: EvolutionInstance[] = [];
    let version = "";
    let error: string | undefined;

    // Evolution Go (evoapicloud/evolution-go) usa GET /instance/all
    // (diferente do Evolution API v2 Node.js que usa /instance/fetchInstances)
    try {
      const r = await fetch(`${base}/instance/all`, { headers });
      if (r.ok) {
        const raw = await r.json() as any;
        // Normaliza: pode ser array ou { data: [] }
        const list: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.instances ?? []);
        instances = list.map((item: any) => {
          // Evolution Go usa item.connected (boolean) para estado
          const state: "open" | "close" | "connecting" =
            item.connected === true ? "open"
            : (item.status === "open" || item.status === "connected") ? "open"
            : "close";
          // item.jid = "5521984095453:3@s.whatsapp.net" → extrair só o número
          const rawJid = item.jid ?? item.owner ?? item.ownerJid ?? "";
          const number = rawJid.split("@")[0].split(":")[0] || null;
          return {
            name:           item.name          ?? item.instanceName ?? "",
            state,
            profileName:    item.profileName   ?? item.profile_name ?? "",
            profilePicture: item.profilePicUrl ?? item.profile_pic  ?? null,
            number,
          };
        });
      } else {
        const body = await r.text().catch(() => "");
        error = `Evolution ${r.status}: ${body.slice(0, 150)}`;
      }
    } catch (e: any) {
      error = `Evolution conexão: ${e?.message ?? "timeout"}`;
    }

    // Fetch versão (opcional)
    try {
      const versionRes = await fetch(`${base}/`, { headers });
      if (versionRes.ok) {
        const v = await versionRes.json() as any;
        version = v.version ?? v.EvolutionAPI?.VERSION ?? "";
      }
    } catch { /* version is optional */ }

    return { configured: true, instances, version, error };
  });

export const getSupabaseStats = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<SupabaseStats> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const plan: SupabasePlan = (process.env.SUPABASE_PLAN as SupabasePlan) ?? "free";
    const limits = {
      free: { dbBytes: 500 * 1024 * 1024, storageBytes: 1024 * 1024 * 1024, connections: 60 },
      pro:  { dbBytes: 8 * 1024 * 1024 * 1024, storageBytes: 100 * 1024 * 1024 * 1024, connections: 120 },
      team: { dbBytes: 8 * 1024 * 1024 * 1024, storageBytes: 100 * 1024 * 1024 * 1024, connections: 120 },
    }[plan];

    // Chama a função PG que foi criada via migration — única query para tudo
    const { data: raw, error } = await (supabaseAdmin as any).rpc("get_infra_stats");
    if (error) throw new Error(error.message);

    const d = raw as any;
    const tables: SupabaseTableStat[] = (d.tables ?? []).map((t: any) => ({
      tableName: t.table_name,
      rowCount:  Number(t.row_count),
      sizeBytes: Number(t.total_bytes),
    }));
    const buckets: SupabaseBucketStat[] = (d.buckets ?? []).map((b: any) => ({
      bucket:    b.bucket,
      fileCount: Number(b.file_count),
      sizeBytes: Number(b.size_bytes),
    }));
    const storageTotalBytes = buckets.reduce((acc, b) => acc + b.sizeBytes, 0);

    // Região vem da URL do projeto: ex. itqsrpmovqeyhzsertqe.supabase.co → us-east-1
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const region = supabaseUrl.includes("supabase.co") ? "us-east-1" : "—";

    return {
      plan,
      region,
      dbBytes:           Number(d.db_bytes),
      authUsers:         Number(d.auth_users),
      totalConnections:  Number(d.total_connections),
      activeConnections: Number(d.active_connections),
      idleConnections:   Number(d.idle_connections),
      tables,
      buckets,
      storageTotalBytes,
      limits,
    };
  });

const PHONE_E164 = /^\+?[1-9]\d{6,14}$/;

export const sendEvolutionMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st:          z.string().optional(),
      instanceName: z.string().min(1).max(100),
      to:           z.string().regex(PHONE_E164, "Número inválido — use formato E.164 (ex: 5521997051225)"),
      text:         z.string().min(1).max(1000),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    await requireSuperAuth(data._st ?? null);

    const url = process.env.EVOLUTION_API_URL ?? "";
    const key = process.env.EVOLUTION_API_KEY ?? "";
    if (!url || !key) return { ok: false, message: "Evolution não configurado" };

    const base = url.replace(/\/+$/, "");

    // Busca o token da instância server-side — nunca exposto ao browser
    const allRes = await fetch(`${base}/instance/all`, { headers: { apikey: key } });
    if (!allRes.ok) return { ok: false, message: `Erro ao buscar instâncias: ${allRes.status}` };
    const allData = await allRes.json().catch(() => ({})) as any;
    const list: any[] = Array.isArray(allData) ? allData : (allData?.data ?? allData?.instances ?? []);
    const inst = list.find((i: any) => (i.name ?? i.instanceName) === data.instanceName);
    if (!inst?.token) return { ok: false, message: `Instância "${data.instanceName}" não encontrada ou sem token` };

    const r = await fetch(`${base}/send/text`, {
      method: "POST",
      headers: { apikey: inst.token, "Content-Type": "application/json" },
      body: JSON.stringify({ number: data.to, text: data.text }),
    });

    const body = await r.json().catch(() => ({})) as any;
    if (r.ok) return { ok: true, message: `Mensagem enviada! ID: ${body?.key?.id ?? "—"}` };
    return { ok: false, message: `Erro ${r.status}: ${body?.error ?? JSON.stringify(body)}` };
  });

// Kept for backward compat — used by audit page
export type AuditEntry = {
  id: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  details: Record<string, any>;
  performed_at: string;
};

export const getRecentLogs = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<AuditEntry[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("admin_audit_log")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (rows ?? []) as AuditEntry[];
  });
