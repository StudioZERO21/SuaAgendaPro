import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";
import { getServerEnv, getServerEnvStatus } from "@/lib/server-env";

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
      const url = getServerEnv("EVOLUTION_API_URL");
      const key = getServerEnv("EVOLUTION_API_KEY");
      if (!url || !key) return { ok: false, message: "EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurado no .env" };
      try {
        const base = url.replace(/\/+$/, "");
        const r = await fetch(`${base}/instance/all`, { headers: { apikey: key } });
        if (r.ok) {
          const json = await r.json() as any;
          const count = Array.isArray(json) ? json.length : (json?.data?.length ?? "?");
          return { ok: true, message: `Evolution conectado — ${count} instância(s)` };
        }
        return { ok: false, message: `Evolution retornou status ${r.status}` };
      } catch (e: any) { return { ok: false, message: e?.message ?? "Erro de conexão" }; }
    }

    return { ok: false, message: "API desconhecida" };
  });
