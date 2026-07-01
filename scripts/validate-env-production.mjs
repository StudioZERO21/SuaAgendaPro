#!/usr/bin/env node
/**
 * Valida .env.production no mesmo espírito do Docker Compose env_file.
 * Uso na VPS: node scripts/validate-env-production.mjs .env.production
 */
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? ".env.production";
let content;

try {
  content = readFileSync(file, "utf8");
} catch {
  console.error(`Arquivo não encontrado: ${file}`);
  process.exit(1);
}

const lines = content.split(/\r?\n/);
let errors = 0;

for (let i = 0; i < lines.length; i++) {
  const n = i + 1;
  const raw = lines[i];
  const line = raw.trim();

  if (!line || line.startsWith("#")) continue;

  const eq = line.indexOf("=");
  if (eq < 0) {
    console.error(`Linha ${n}: sem "=" — comente com # ou use CHAVE=valor`);
    console.error(`  → ${raw}`);
    errors++;
    continue;
  }

  const key = line.slice(0, eq).trim();
  if (!key) {
    console.error(`Linha ${n}: chave vazia antes do "="`);
    errors++;
    continue;
  }

  if (/\s/.test(key)) {
    console.error(`Linha ${n}: chave não pode ter espaço — use underscore (_)`);
    console.error(`  → chave atual: "${key}"`);
    console.error(`  → correto: ${key.replace(/\s+/g, "_")}=...`);
    errors++;
  }

  const value = line.slice(eq + 1);
  if (value.includes(" ") && !/^["']/.test(value.trim())) {
    console.warn(
      `Linha ${n}: valor com espaço sem aspas (pode quebrar no Docker): ${key}`,
    );
  }
}

if (errors > 0) {
  console.error(`\n${errors} erro(s). Corrija antes de: docker compose up -d`);
  process.exit(1);
}

console.log(`OK — ${file} válido (${lines.length} linhas)`);
