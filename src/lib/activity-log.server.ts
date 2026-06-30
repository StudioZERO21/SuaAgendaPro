// Logs de atividade do profissional gravados no PostgreSQL da VPS.
// Eventos: login_success | login_failed | session_kicked | logout
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
      ip              TEXT,
      user_agent      TEXT,
      meta            JSONB,
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_prof  ON professional_activity_log (professional_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_email ON professional_activity_log (email, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pal_event ON professional_activity_log (event, created_at DESC)`;
  ensured = true;
}

export type ActivityInput = {
  event: string;
  email?: string | null;
  professionalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function recordActivityVps(input: ActivityInput): Promise<void> {
  const sql = getVpsDb();
  try {
    await ensure(sql);
    await sql`
      INSERT INTO professional_activity_log (professional_id, email, event, ip, user_agent, meta)
      VALUES (
        ${input.professionalId ?? null},
        ${input.email ?? null},
        ${input.event},
        ${input.ip ?? null},
        ${input.userAgent ?? null},
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
  ip: string | null;
  userAgent: string | null;
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
      SELECT id, professional_id, email, event, ip, user_agent, created_at
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
      ip:             r.ip ?? null,
      userAgent:      r.user_agent ?? null,
      createdAt:      new Date(r.created_at).toISOString(),
    }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}
