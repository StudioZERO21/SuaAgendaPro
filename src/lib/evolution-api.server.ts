import { getServerEnv } from "@/lib/server-env";

export type EvolutionConfig = {
  url: string;
  /** Chave global do Evolution (header `apikey` em /instance/all). */
  globalApiKey: string;
  /** Token da instância — fallback se global não estiver definida. */
  instanceApiKey: string;
  instanceId: string;
  configured: boolean;
};

function cleanEnvValue(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "");
}

/**
 * Configuração Evolution API para o servidor (VPS / local).
 *
 * Prioridade da chave de administração:
 * `EVOLUTION_GLOBAL_API_KEY` → `EVOLUTION_API_KEY`
 */
export function getEvolutionConfig(): EvolutionConfig {
  const url = cleanEnvValue(getServerEnv("EVOLUTION_API_URL")).replace(/\/+$/, "");
  const globalApiKey = cleanEnvValue(getServerEnv("EVOLUTION_GLOBAL_API_KEY"));
  const instanceApiKey = cleanEnvValue(getServerEnv("EVOLUTION_API_KEY"));
  const instanceId = cleanEnvValue(getServerEnv("EVOLUTION_INSTANCE_ID"));
  const adminKey = globalApiKey || instanceApiKey;

  return {
    url,
    globalApiKey: adminKey,
    instanceApiKey,
    instanceId,
    configured: !!(url && adminKey),
  };
}

export type EvolutionFetchResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

/** GET autenticado na Evolution (lista instâncias, versão, etc.). */
export async function evolutionFetch(
  path: string,
  apiKey?: string,
): Promise<EvolutionFetchResult> {
  const cfg = getEvolutionConfig();
  const key = apiKey ?? cfg.globalApiKey;
  if (!cfg.url || !key) {
    return { ok: false, status: 0, error: "Evolution não configurado no servidor" };
  }

  try {
    const r = await fetch(`${cfg.url}${path.startsWith("/") ? path : `/${path}`}`, {
      headers: { apikey: key },
    });
    const text = await r.text().catch(() => "");
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* mantém texto bruto */
    }
    if (!r.ok) {
      const snippet =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : text.slice(0, 200);
      return {
        ok: false,
        status: r.status,
        error: snippet || `HTTP ${r.status}`,
      };
    }
    return { ok: true, status: r.status, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro de conexão";
    return { ok: false, status: 0, error: msg };
  }
}

/** Status das variáveis Evolution (sem expor valores). */
export function getEvolutionEnvStatus(): {
  EVOLUTION_API_URL: boolean;
  EVOLUTION_API_KEY: boolean;
  EVOLUTION_GLOBAL_API_KEY: boolean;
  EVOLUTION_INSTANCE_ID: boolean;
  usesProductionFile: boolean;
} {
  const cfg = getEvolutionConfig();
  return {
    EVOLUTION_API_URL: !!cfg.url,
    EVOLUTION_API_KEY: !!cfg.instanceApiKey,
    EVOLUTION_GLOBAL_API_KEY: !!cleanEnvValue(getServerEnv("EVOLUTION_GLOBAL_API_KEY")),
    EVOLUTION_INSTANCE_ID: !!cfg.instanceId,
    usesProductionFile: process.env.NODE_ENV === "production",
  };
}
