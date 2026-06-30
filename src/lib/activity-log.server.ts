// Logs de atividade do profissional gravados no PostgreSQL da VPS.
// Eventos: login_success | login_failed | session_kicked | logout
// LGPD: NÃO armazena IP. Guarda apenas navegador / SO / aparelho (não sensível).
import { getVpsDb } from "./db-vps.server";

let ensured = false;

async function ensure(sql: ReturnType<typeof getVpsDb>) {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS professional_activity_log (
      id              BIGSERIAL    PRIMARY KEY,
      professional_id UUID,
      email           TEXT,
      event           TEXT         NOT NULL,
      browser         TEXT,
      os              TEXT,
      device          TEXT,
      meta            JSONB,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )`;
  // Garante as colunas em tabelas já existentes
  await sql`ALTER TABLE professional_activity_log ADD COLUMN IF NOT EXISTS browser TEXT`;
  await sql`ALTER TABLE professional_activity_log ADD COLUMN IF NOT EXISTS os      TEXT`;
  await sql`ALTER TABLE professional_activity_log ADD COLUMN IF NOT EXISTS device  TEXT`;
  // LGPD: remove dados sensíveis se existirem de versões anteriores
  await sql`ALTER TABLE professional_activity_log DROP COLUMN IF EXISTS ip`;
  await sql`ALTER TABLE professional_activity_log DROP COLUMN IF EXISTS user_agent`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_prof  ON professional_activity_log (professional_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_email ON professional_activity_log (email, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_event ON professional_activity_log (event, created_at DESC)`;
  ensured = true;
}

// Extrai navegador / SO / aparelho do user-agent (sem libs).
export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  const u = ua || "";

  let os = "—";
  const iosM = /OS (\d+)[._]/.exec(u);
  const andM = /Android (\d+)/.exec(u);
  if (/Windows NT 10/.test(u)) os = "Windows 10/11";
  else if (/Windows NT 6\.[123]/.test(u)) os = "Windows 7/8";
  else if (/Windows/.test(u)) os = "Windows";
  else if (/iPhone|iPad|iPod/.test(u)) os = iosM ? `iOS ${iosM[1]}` : "iOS";
  else if (/Android/.test(u)) os = andM ? `Android ${andM[1]}` : "Android";
  else if (/Mac OS X/.test(u)) os = "macOS";
  else if (/Linux/.test(u)) os = "Linux";

  let browser = "—";
  const chrM = /Chrome\/(\d+)/.exec(u);
  const ffM  = /Firefox\/(\d+)/.exec(u);
  const safM = /Version\/(\d+)[.\d]* Mobile?\/?\w* Safari/.exec(u) || /Version\/(\d+)/.exec(u);
  if (/Edg\//.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/.test(u)) browser = "Opera";
  else if (/SamsungBrowser\/(\d+)/.test(u)) browser = "Samsung Internet";
  else if (chrM && !/Edg\//.test(u)) browser = `Chrome ${chrM[1]}`;
  else if (ffM) browser = `Firefox ${ffM[1]}`;
  else if (/Safari/.test(u)) browser = safM ? `Safari ${safM[1]}` : "Safari";

  let device = "Desktop";
  if (/iPhone/.test(u)) device = "iPhone";
  else if (/iPad/.test(u)) device = "iPad";
  else if (/Android/.test(u)) {
    const m = /;\s?([^;)]+?)\s+Build\//.exec(u) || /Android[^;]*;\s?([^;)]+?)\)/.exec(u);
    device = m ? m[1].replace(/_/g, " ").trim() : "Android";
  } else if (/Macintosh/.test(u)) device = "Mac";
  else if (/Windows/.test(u)) device = "PC";

  return { browser, os, device };
}

export type ActivityInput = {
  event: string;
  email?: string | null;
  professionalId?: string | null;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function recordActivityVps(input: ActivityInput): Promise<void> {
  const sql = getVpsDb();
  try {
    await ensure(sql);
    await sql`
      INSERT INTO professional_activity_log (professional_id, email, event, browser, os, device, meta)
      VALUES (
        ${input.professionalId ?? null},
        ${input.email ?? null},
        ${input.event},
        ${input.browser ?? null},
        ${input.os ?? null},
        ${input.device ?? null},
        ${input.meta ? sql.json(input.meta as any) : null}
      )`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export type ActivityRow = {
  id: string;
  professionalId: string | null;
  email: string | null;
  event: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  createdAt: string;
};

export async function queryActivityVps(f: {
  professionalId?: string | null;
  email?: string | null;
  event?: string | null;
  limit?: number;
}): Promise<ActivityRow[]> {
  const sql = getVpsDb();
  try {
    await ensure(sql);
    const rows = await sql<any[]>`
      SELECT id, professional_id, email, event, browser, os, device, created_at
      FROM professional_activity_log
      WHERE (${f.professionalId ?? null}::uuid IS NULL OR professional_id = ${f.professionalId ?? null})
        AND (${f.email ?? null}::text  IS NULL OR email = ${f.email ?? null})
        AND (${f.event ?? null}::text  IS NULL OR event = ${f.event ?? null})
      ORDER BY created_at DESC
      LIMIT ${Math.min(f.limit ?? 200, 1000)}`;
    return rows.map((r) => ({
      id:             String(r.id),
      professionalId: r.professional_id ?? null,
      email:          r.email ?? null,
      event:          r.event,
      browser:        r.browser ?? null,
      os:             r.os ?? null,
      device:         r.device ?? null,
      createdAt:      new Date(r.created_at).toISOString(),
    }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}
