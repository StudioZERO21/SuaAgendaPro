/**
 * Job de retenção de dados (LGPD — princípio da necessidade).
 * Purga logs e mensagens além do período configurado.
 */

import { getVpsDb } from "@/lib/db-vps.server";

const LOG_RETENTION_MONTHS = 12;
const WHATSAPP_RETENTION_MONTHS = 24;

export async function runDataRetention(): Promise<Record<string, number>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stats: Record<string, number> = {};

  const logCutoff = new Date();
  logCutoff.setMonth(logCutoff.getMonth() - LOG_RETENTION_MONTHS);

  const waCutoff = new Date();
  waCutoff.setMonth(waCutoff.getMonth() - WHATSAPP_RETENTION_MONTHS);

  const { count: faqDeleted } = await supabaseAdmin
    .from("faq_view_logs")
    .delete({ count: "exact" })
    .lt("created_at", logCutoff.toISOString());
  stats.faq_view_logs = faqDeleted ?? 0;

  const { count: waDeleted } = await supabaseAdmin
    .from("whatsapp_messages")
    .delete({ count: "exact" })
    .lt("sent_at", waCutoff.toISOString());
  stats.whatsapp_messages = waDeleted ?? 0;

  try {
    const sql = getVpsDb();
    const activity = await sql`
      DELETE FROM professional_activity_log
      WHERE created_at < ${logCutoff.toISOString()}
    `;
    stats.professional_activity_log = activity.count;
    await sql.end();
  } catch {
    stats.professional_activity_log = 0;
  }

  return stats;
}
