import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let fileEnv: Record<string, string> | null = null;

/**
 * Faz parse manual de linhas do `.env`, preservando `$` em chaves Asaas.
 *
 * Args:
 *   content: Conteúdo bruto do arquivo `.env`.
 *
 * Returns:
 *   Mapa chave → valor já normalizado.
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Converte `\$` (escape do dotenv) de volta para `$` literal.
    value = value.replace(/\\\$/g, "$");
    result[key] = value;
  }

  return result;
}

/**
 * Carrega variáveis dos arquivos `.env` do projeto (fallback server-side).
 *
 * Returns:
 *   Mapa mesclado respeitando prioridade `.env.local` > `.env`.
 */
function loadFileEnv(): Record<string, string> {
  if (fileEnv) return fileEnv;

  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const candidates = [
    `.env.${mode}.local`,
    `.env.local`,
    `.env.${mode}`,
    `.env`,
  ];

  fileEnv = {};
  for (const name of candidates) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    Object.assign(fileEnv, parseEnvFile(readFileSync(path, "utf8")));
  }

  return fileEnv;
}

/**
 * Lê variável de ambiente do servidor (somente server-side).
 *
 * Usa `process.env` primeiro; se vazio, relê o `.env` com parser seguro
 * para chaves que contêm `$` (ex: Asaas).
 *
 * Args:
 *   key: Nome da variável (ex: `ASAAS_API_KEY`).
 *
 * Returns:
 *   Valor da variável ou string vazia se ausente.
 */
export function getServerEnv(key: string): string {
  return process.env[key] || loadFileEnv()[key] || "";
}

/**
 * Indica se variáveis sensíveis estão presentes no `.env` do servidor.
 *
 * Returns:
 *   Mapa booleano por chave de integração.
 */
export function getServerEnvStatus(): Record<string, boolean> {
  return {
    ASAAS_API_KEY: !!getServerEnv("ASAAS_API_KEY"),
    RESEND_API_KEY: !!getServerEnv("RESEND_API_KEY"),
    EVOLUTION_API_URL: !!getServerEnv("EVOLUTION_API_URL"),
    EVOLUTION_API_KEY: !!getServerEnv("EVOLUTION_API_KEY"),
    HOSTINGER_API_TOKEN: !!getServerEnv("HOSTINGER_API_TOKEN"),
  };
}
