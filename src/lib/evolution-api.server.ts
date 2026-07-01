import { getServerEnv } from "@/lib/server-env";

export type EvolutionConfig = {
  url: string;
  /** Chave global do painel Evolution (`GLOBAL_API_KEY` no servidor Evolution). */
  globalApiKey: string;
  /** Token UUID da instância — envio de mensagens. */
  instanceApiKey: string;
  instanceId: string;
  /** URL + pelo menos uma chave (global ou instância). */
  configured: boolean;
  /** URL + chave global (listagem / admin). */
  adminConfigured: boolean;
  /** URL + token + instanceId (envio WhatsApp). */
  messagingConfigured: boolean;
};

function cleanEnvValue(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "");
}

/**
 * Configuração Evolution API para o servidor (VPS / local).
 *
 * Global e token de instância são chaves **diferentes** — não misturar.
 */
export function getEvolutionConfig(): EvolutionConfig {
  const url = cleanEnvValue(getServerEnv("EVOLUTION_API_URL")).replace(/\/+$/, "");
  const globalApiKey = cleanEnvValue(getServerEnv("EVOLUTION_GLOBAL_API_KEY"));
  const instanceApiKey = cleanEnvValue(getServerEnv("EVOLUTION_API_KEY"));
  const instanceId = cleanEnvValue(getServerEnv("EVOLUTION_INSTANCE_ID"));

  return {
    url,
    globalApiKey,
    instanceApiKey,
    instanceId,
    configured: !!(url && (globalApiKey || instanceApiKey)),
    adminConfigured: !!(url && globalApiKey),
    messagingConfigured: !!(url && instanceApiKey && instanceId),
  };
}

export type EvolutionKeyDiagnostics = {
  globalKeySet: boolean;
  instanceKeySet: boolean;
  /** Erro comum: colar o token da instância em EVOLUTION_GLOBAL_API_KEY. */
  keysAreIdentical: boolean;
  usesProductionFile: boolean;
};

/** Diagnóstico sem expor valores das chaves. */
export function getEvolutionKeyDiagnostics(): EvolutionKeyDiagnostics {
  const cfg = getEvolutionConfig();
  return {
    globalKeySet: !!cfg.globalApiKey,
    instanceKeySet: !!cfg.instanceApiKey,
    keysAreIdentical:
      !!cfg.globalApiKey &&
      !!cfg.instanceApiKey &&
      cfg.globalApiKey === cfg.instanceApiKey,
    usesProductionFile: process.env.NODE_ENV === "production",
  };
}

export type EvolutionFetchResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

/**
 * GET autenticado na Evolution.
 *
 * Endpoints admin (`/instance/all`) exigem `EVOLUTION_GLOBAL_API_KEY`.
 * Passe `apiKey` explicitamente ou use `keyKind: "global"`.
 */
export async function evolutionFetch(
  path: string,
  options?: { apiKey?: string; keyKind?: "global" | "instance" },
): Promise<EvolutionFetchResult> {
  const cfg = getEvolutionConfig();
  const key =
    options?.apiKey ??
    (options?.keyKind === "instance"
      ? cfg.instanceApiKey
      : cfg.globalApiKey);

  if (!cfg.url || !key) {
    const missing =
      options?.keyKind === "instance"
        ? "EVOLUTION_API_KEY"
        : "EVOLUTION_GLOBAL_API_KEY";
    return {
      ok: false,
      status: 0,
      error: `Evolution: ${missing} não configurada no servidor`,
    };
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

export type EvolutionMessagingProbe = {
  ok: boolean;
  status: number;
  error?: string;
};

/**
 * Verifica se o token da instância é aceito **sem enviar mensagem**.
 *
 * POST /send/text com body incompleto → 400 (número obrigatório) se a chave
 * for válida; 401 se a chave for rejeitada.
 */
export async function probeEvolutionMessaging(): Promise<EvolutionMessagingProbe> {
  const cfg = getEvolutionConfig();
  if (!cfg.url || !cfg.instanceApiKey) {
    return { ok: false, status: 0, error: "EVOLUTION_API_KEY não configurada" };
  }

  try {
    const body: Record<string, string> = {};
    if (cfg.instanceId) body.instanceId = cfg.instanceId;

    const r = await fetch(`${cfg.url}/send/text`, {
      method: "POST",
      headers: {
        apikey: cfg.instanceApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (r.status === 401 || r.status === 403) {
      return { ok: false, status: r.status, error: "Token da instância rejeitado" };
    }

    // 400 = autenticado, payload inválido (esperado no probe)
    return { ok: true, status: r.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro de conexão";
    return { ok: false, status: 0, error: msg };
  }
}

/** Monta mensagem de erro legível para falha de autenticação admin. */
export function formatEvolutionAdminError(
  status: number,
  error: string,
): string {
  const diag = getEvolutionKeyDiagnostics();
  const parts = [`Evolution ${status || "erro"}: ${error}`];

  if (!diag.globalKeySet) {
    parts.push(
      "EVOLUTION_GLOBAL_API_KEY ausente — na VPS edite /opt/suaagendapro/.env.production (não o .env local) e rode docker compose up -d --force-recreate",
    );
  } else if (diag.keysAreIdentical) {
    parts.push(
      "EVOLUTION_GLOBAL_API_KEY é igual a EVOLUTION_API_KEY — use o GLOBAL_API_KEY do .env do Evolution Go (painel Hostinger), não o token da instância",
    );
  } else if (status === 401 || status === 403) {
    parts.push(
      "GLOBAL_API_KEY incorreta — confira no servidor Evolution Go: grep GLOBAL_API_KEY .env (valor diferente do token UUID da instância)",
    );
  }

  if (diag.usesProductionFile) {
    parts.push("Ambiente: produção (.env.production via Docker)");
  }

  return parts.join(" — ");
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
  const diag = getEvolutionKeyDiagnostics();
  return {
    EVOLUTION_API_URL: !!cfg.url,
    EVOLUTION_API_KEY: !!cfg.instanceApiKey,
    EVOLUTION_GLOBAL_API_KEY: diag.globalKeySet,
    EVOLUTION_INSTANCE_ID: !!cfg.instanceId,
    usesProductionFile: diag.usesProductionFile,
  };
}
