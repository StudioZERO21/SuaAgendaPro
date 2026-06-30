// Envio de Web Push (PWA) para profissionais. Gated por VAPID — se não houver
// chaves configuradas, vira no-op (não quebra nada).
import webpush from "web-push";

let configured: boolean | null = null;

function ensure(): boolean {
  if (configured !== null) return configured;
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) { configured = false; return false; }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@suaagenda.pro", pub, priv);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Envia um push para todas as inscrições do profissional. Remove inscrições expiradas. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensure()) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  await Promise.all((subs ?? []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (e: any) {
      // 404/410 = inscrição morta → limpa
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
      } else {
        console.error("[push] erro ao enviar:", e?.statusCode ?? e);
      }
    }
  }));
}
