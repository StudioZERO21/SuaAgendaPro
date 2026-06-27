import postgres from "postgres";

let _sql: postgres.Sql | undefined;

function buildVpsUrl(): string {
  // Formato 1 — URL completa
  const url = process.env.VPS_DATABASE_URL;
  if (url) return url;

  // Formato 2 — variáveis separadas (mesmas que o container PostgreSQL da VPS usa)
  const user     = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const db       = process.env.POSTGRES_DB;
  const host     = process.env.POSTGRES_HOST ?? "187.77.244.198";
  const port     = process.env.POSTGRES_PORT ?? "32774";

  if (user && password && db) {
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }

  throw new Error(
    "PostgreSQL VPS não configurado. Defina VPS_DATABASE_URL ou POSTGRES_USER + POSTGRES_PASSWORD + POSTGRES_DB no .env",
  );
}

export function getVpsDb(): postgres.Sql {
  if (!_sql) {
    _sql = postgres(buildVpsUrl(), {
      max: 5,             // pool pequeno — banco auxiliar, não principal
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: false,         // rede interna da VPS
    });
  }
  return _sql;
}
