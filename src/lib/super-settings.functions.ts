import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";
import { getServerEnv, getServerEnvStatus } from "@/lib/server-env";
import { evolutionFetch, formatEvolutionAdminError, getEvolutionConfig, probeEvolutionMessaging } from "@/lib/evolution-api.server";

const _st = z.string().optional();

export const getSettings = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<Record<string, string>> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const { data: rows, error } = await db.from("system_settings").select("key, value");
    if (error) throw new Error(error.message);
    return Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value ?? ""]));
  });

export const updateSettings = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st, settings: z.record(z.string()) }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const rows = Object.entries(data.settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await db.from("system_settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
  });

export const getEnvStatus = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    return getServerEnvStatus();
  });

export const testApiConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, api: z.enum(["asaas", "resend", "evolution"]) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    await requireSuperAuth(data._st ?? null);

    if (data.api === "asaas") {
      const key = getServerEnv("ASAAS_API_KEY");
      if (!key) return { ok: false, message: "ASAAS_API_KEY não configurado no .env" };
      try {
        const env = getServerEnv("ASAAS_ENV") === "production" ? "production" : "sandbox";
        const base = env === "production" ? "https://api.asaas.com" : "https://sandbox.asaas.com";
        const r = await fetch(`${base}/api/v3/customers?limit=1`, { headers: { access_token: key } });
        if (r.ok) return { ok: true, message: `Asaas ${env} conectado com sucesso` };
        return { ok: false, message: `Asaas retornou status ${r.status}` };
      } catch (e: any) { return { ok: false, message: e?.message ?? "Erro de conexão" }; }
    }

    if (data.api === "resend") {
      const key = getServerEnv("RESEND_API_KEY");
      if (!key) return { ok: false, message: "RESEND_API_KEY não configurado no .env" };
      try {
        const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
        if (r.ok) return { ok: true, message: "Resend conectado com sucesso" };
        return { ok: false, message: `Resend retornou status ${r.status}` };
      } catch (e: any) { return { ok: false, message: e?.message ?? "Erro de conexão" }; }
    }

    if (data.api === "evolution") {
      const cfg = getEvolutionConfig();
      if (!cfg.configured) {
        return {
          ok: false,
          message:
            "Evolution não configurado. Na VPS use .env.production (não .env) e recrie: docker compose up -d --force-recreate",
        };
      }

      if (cfg.adminConfigured) {
        const admin = await evolutionFetch("/instance/all", { keyKind: "global" });
        if (admin.ok) {
          const json = admin.data as any;
          const count = Array.isArray(json) ? json.length : (json?.data?.length ?? "?");
          return { ok: true, message: `Evolution admin OK — ${count} instância(s)` };
        }
      }

      const messaging = await probeEvolutionMessaging();
      if (messaging.ok) {
        return {
          ok: true,
          message: cfg.adminConfigured
            ? "WhatsApp envio OK (token instância). Listagem admin falhou — veja Infra."
            : "WhatsApp envio OK — configure EVOLUTION_GLOBAL_API_KEY para listar instâncias",
        };
      }

      const adminFail = cfg.adminConfigured
        ? await evolutionFetch("/instance/all", { keyKind: "global" })
        : { ok: false as const, status: 0, error: "EVOLUTION_GLOBAL_API_KEY ausente" };

      return {
        ok: false,
        message: formatEvolutionAdminError(adminFail.status, adminFail.error),
      };
    }

    return { ok: false, message: "API desconhecida" };
  });
