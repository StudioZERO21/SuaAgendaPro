import postgres from "postgres";

function buildVpsUrl(): string {
  const url = process.env.VPS_DATABASE_URL;
  if (url) return url;

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

// Sem singleton — lê process.env sempre que chamado
// (evita conectar com credenciais desatualizadas se o .env mudar em dev)
export function getVpsDb(): postgres.Sql {
  return postgres(buildVpsUrl(), {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: false,
  });
}
