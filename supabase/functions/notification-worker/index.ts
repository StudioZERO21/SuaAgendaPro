// notification-worker — envia as notificações enfileiradas, com throttle e janela de horário.
// Agende no pg_cron a cada poucos minutos (ex.: '*/5 * * * *'):
//
//   select cron.schedule('notification-worker', '*/5 * * * *', $$
//     select net.http_post(
//       url:='https://itqsrpmovqeyhzsertqe.supabase.co/functions/v1/notification-worker',
//       headers:=jsonb_build_object('Content-Type','application/json',
//         'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
//       body:='{}'::jsonb) $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const APP_URL = "https://app.suaagenda.pro";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Envio ──────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) { console.warn("[worker:email] sem RESEND_API_KEY"); return false; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") ?? "suaAgendaPro <noreply@suaagenda.pro>",
      to: [to], subject, html,
    }),
  });
  if (!res.ok) { console.error("[worker:email]", await res.text()); return false; }
  return true;
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const apiUrl = Deno.env.get("EVOLUTION_API_URL");
  const instanceToken = Deno.env.get("EVOLUTION_API_KEY");
  const instanceId = Deno.env.get("EVOLUTION_INSTANCE_ID");
  if (!apiUrl || !instanceToken) { console.warn("[worker:wa] Evolution nao configurada"); return false; }
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const body: Record<string, string> = { number, text: message };
  if (instanceId) body["instanceId"] = instanceId;
  const res = await fetch(`${apiUrl}/send/text`, {
    method: "POST",
    headers: { "apikey": instanceToken, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error("[worker:wa]", await res.text()); return false; }
  return true;
}

// ─── Templates (por tipo, renderizados conforme o canal) ─────────────────────

const emailShell = (subject: string, body: string) => `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;color:#18181b">
<div style="background:linear-gradient(135deg,#ec4899,#f472b6);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
  <h1 style="color:white;margin:0;font-size:22px">suaAgendaPro</h1></div>
<h2 style="font-size:18px">${subject}</h2>${body}
<div style="text-align:center;margin:28px 0">
  <a href="${APP_URL}/plano" style="background:#ec4899;color:white;padding:13px 28px;border-radius:12px;text-decoration:none;font-weight:700">Acessar minha conta</a></div>
<p style="color:#a1a1aa;font-size:11px;text-align:center;margin-top:32px">suaAgendaPro</p>
</body></html>`;

type Tpl = { emailSubject: string; emailHtml: string; wa: string };

function template(kind: string, name: string): Tpl {
  const n = name || "Profissional";
  switch (kind) {
    case "trial_3d":
      return {
        emailSubject: "Seu Acesso Livre termina em 3 dias",
        emailHtml: emailShell("Acesso Livre termina em 3 dias",
          `<p>Ola <strong>${n}</strong>, seu periodo gratuito termina em <strong>3 dias</strong>. Assine o Premium por R$ 49,90/mes e continue sem interrupcoes.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}! Seu Acesso Livre termina em *3 dias*. Assine o Premium e nao perca nenhum agendamento.\n${APP_URL}/plano`,
      };
    case "trial_1d":
      return {
        emailSubject: "Seu Acesso Livre termina amanha",
        emailHtml: emailShell("Acesso Livre termina amanha",
          `<p>Ola <strong>${n}</strong>, seu Acesso Livre termina <strong>amanha</strong>. Assine o Premium para nao perder o acesso.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}! Seu Acesso Livre termina *amanha*. Assine o Premium e continue usando.\n${APP_URL}/plano`,
      };
    case "trial_expired":
      return {
        emailSubject: "Seu Acesso Livre encerrou",
        emailHtml: emailShell("Acesso Livre encerrado",
          `<p>Ola <strong>${n}</strong>, seu Acesso Livre encerrou e seu acesso foi suspenso. Assine o Premium para voltar a usar.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}, seu Acesso Livre *encerrou* e seu acesso foi suspenso. Para voltar:\n${APP_URL}/plano`,
      };
    case "billing_3d":
      return {
        emailSubject: "Sua fatura vence em 3 dias",
        emailHtml: emailShell("Fatura vencendo em 3 dias",
          `<p>Ola <strong>${n}</strong>, sua fatura do Premium vence em <strong>3 dias</strong>. Garanta que seu cartao esta ativo ou pague via PIX.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}! Sua fatura vence em *3 dias*. Garanta o pagamento e evite a suspensao.\n${APP_URL}/plano`,
      };
    case "billing_1d":
      return {
        emailSubject: "Sua fatura vence amanha",
        emailHtml: emailShell("Fatura vence amanha",
          `<p>Ola <strong>${n}</strong>, sua fatura vence <strong>amanha</strong>. Evite a suspensao pagando via PIX.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}! Sua fatura vence *amanha*. Evite a suspensao pagando via PIX.\n${APP_URL}/plano`,
      };
    case "suspended_overdue":
      return {
        emailSubject: "Seu acesso foi suspenso",
        emailHtml: emailShell("Acesso suspenso por inadimplencia",
          `<p>Ola <strong>${n}</strong>, seu acesso foi suspenso por inadimplencia. Regularize o pagamento para reativar.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}, seu acesso foi *suspenso* por inadimplencia. Regularize para reativar:\n${APP_URL}/plano`,
      };
    default:
      return {
        emailSubject: "suaAgendaPro",
        emailHtml: emailShell("suaAgendaPro", `<p>Ola <strong>${n}</strong>.</p>`),
        wa: `*suaAgendaPro*\n\nOla ${n}.\n${APP_URL}/plano`,
      };
  }
}

// ─── Janela de horário ───────────────────────────────────────────────────────

function hourInTz(tz: string): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date());
  return parseInt(h, 10) % 24;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(serviceKey)) return new Response("Unauthorized", { status: 401 });

  const { data: cfg } = await supabase.from("notification_settings").select("*").eq("id", true).maybeSingle();
  const tz       = cfg?.timezone ?? "America/Sao_Paulo";
  const start    = cfg?.window_start_hour ?? 9;
  const end      = cfg?.window_end_hour ?? 20;
  const limit    = cfg?.throttle_per_run ?? 8;
  const delayMs  = cfg?.send_delay_ms ?? 1500;

  const hour = hourInTz(tz);
  if (hour < start || hour >= end) {
    return new Response(JSON.stringify({ ok: true, skipped: "fora da janela", hour }), { headers: { "Content-Type": "application/json" } });
  }

  // Pega pendentes prontos para envio
  const { data: pending, error } = await supabase
    .from("subscription_notifications")
    .select("id, user_id, kind, channel, target")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0, failed = 0;

  for (const row of pending ?? []) {
    // nome do profissional para o template
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle();
    const tpl = template(row.kind, prof?.display_name ?? "");

    let ok = false;
    if (row.channel === "email") ok = await sendEmail(row.target, tpl.emailSubject, tpl.emailHtml);
    else                          ok = await sendWhatsApp(row.target, tpl.wa);

    await supabase.from("subscription_notifications").update({
      status: ok ? "sent" : "failed",
      sent_at: ok ? new Date().toISOString() : null,
      attempts: 1,
      error: ok ? null : "falha no envio",
    }).eq("id", row.id);

    if (ok) sent++; else failed++;
    if (delayMs > 0) await sleep(delayMs); // espaçamento anti-bloqueio
  }

  return new Response(JSON.stringify({ ok: true, sent, failed, window: [start, end], hour }), {
    headers: { "Content-Type": "application/json" },
  });
});
