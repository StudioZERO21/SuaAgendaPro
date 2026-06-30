// Etapa 6 — Cron diário de assinaturas
// Agenda no Supabase via pg_cron (todo dia às 08:00 BRT = 11:00 UTC):
//
//   select cron.schedule(
//     'subscription-daily-cron',
//     '0 11 * * *',
//     $$
//       select net.http_post(
//         url:='https://itqsrpmovqeyhzsertqe.supabase.co/functions/v1/subscription-cron',
//         headers:=jsonb_build_object(
//           'Content-Type','application/json',
//           'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')
//         ),
//         body:='{}'::jsonb
//       )
//     $$
//   );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Domínio correto do app (era app.suaagendapro.com — link quebrado)
const APP_URL = "https://app.suaagenda.pro";

// ─── Email via Resend ──────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[cron:email] RESEND_API_KEY não configurada →", to);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") ?? "suaAgendaPro <noreply@suaagenda.pro>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) { console.error("[cron:email] Resend error:", await res.text()); return false; }
  return true;
}

// ─── WhatsApp via Evolution API ────────────────────────────────────────────────

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const apiUrl       = Deno.env.get("EVOLUTION_API_URL");
  const instanceToken = Deno.env.get("EVOLUTION_API_KEY");   // token da instância
  const instanceId    = Deno.env.get("EVOLUTION_INSTANCE_ID"); // UUID da instância

  if (!apiUrl || !instanceToken) {
    console.warn("[cron:wa] Evolution API não configurada →", phone);
    return false;
  }

  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;

  const body: Record<string, string> = { number, text: message };
  if (instanceId) body["instanceId"] = instanceId;

  const res = await fetch(`${apiUrl}/send/text`, {
    method: "POST",
    headers: { "apikey": instanceToken, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error("[cron:wa] error:", phone, await res.text()); return false; }
  return true;
}

// ─── Buscar email pelo user_id (admin API) ────────────────────────────────────

async function getUserEmail(userId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.email ?? "";
}

// ─── Log de notificações + dedup ──────────────────────────────────────────────

// Evita reenviar o mesmo aviso (kind) para o mesmo usuário no mesmo ciclo.
// Janela de 2 dias: protege contra execução dupla no dia e não bloqueia o
// próximo ciclo (trial é único; cobrança recorre a cada ~30 dias).
async function alreadySent(userId: string, kind: string): Promise<boolean> {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("subscription_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function logNotif(
  userId: string,
  kind: string,
  channel: "email" | "whatsapp",
  ok: boolean,
  target: string,
  error?: string,
): Promise<void> {
  await supabase.from("subscription_notifications").insert({
    user_id: userId,
    kind,
    channel,
    status: ok ? "sent" : "failed",
    target,
    error: error ?? null,
  });
}

// ─── Templates de mensagens ───────────────────────────────────────────────────

const emailHtml = (name: string, subject: string, body: string) => `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;color:#18181b">
<div style="background:linear-gradient(135deg,#ec4899,#f472b6);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
  <h1 style="color:white;margin:0;font-size:22px">suaAgendaPro</h1>
</div>
<h2 style="font-size:18px">${subject}</h2>
<p>Olá <strong>${name}</strong>,</p>
${body}
<div style="text-align:center;margin:28px 0">
  <a href="${APP_URL}/plano"
     style="background:#ec4899;color:white;padding:13px 28px;border-radius:12px;text-decoration:none;font-weight:700">
    Acessar minha conta
  </a>
</div>
<p style="color:#a1a1aa;font-size:11px;text-align:center;margin-top:32px">suaAgendaPro · Você recebe este email por ter uma conta ativa.</p>
</body></html>`;

const MSG = {
  trialWarning3dEmail: (name: string) => ({
    subject: "⏳ Seu Acesso Livre termina em 3 dias",
    html: emailHtml(name, "Acesso Livre termina em 3 dias",
      `<p>Seu período gratuito termina em <strong>3 dias</strong>. Assine o plano <strong>Premium por R$ 49,90/mês</strong> e continue sem interrupções.</p>
       <p>PIX ou cartão · Cancele quando quiser.</p>`),
  }),
  billingWarning3dEmail: (name: string) => ({
    subject: "📅 Sua fatura vence em 3 dias",
    html: emailHtml(name, "Fatura vencendo em 3 dias",
      `<p>Sua fatura do plano <strong>Premium</strong> vence em <strong>3 dias</strong>. Certifique-se de que seu cartão está ativo ou pague via PIX.</p>`),
  }),
  trialWarning1dWa: (name: string) =>
    `⚠️ *suaAgendaPro*\n\nOlá ${name}! Seu Acesso Livre termina *amanhã*.\n\nAssine o Premium por R$ 49,90/mês e não perca nenhum agendamento 💅\n👉 ${APP_URL}/plano`,
  trialExpiredWa: (name: string) =>
    `🔒 *suaAgendaPro*\n\nOlá ${name}, seu Acesso Livre *encerrou* e seu acesso foi suspenso.\n\nPara voltar a usar o sistema:\n👉 ${APP_URL}/plano`,
  billingWarning1dWa: (name: string) =>
    `⏰ *suaAgendaPro*\n\nOlá ${name}! Sua fatura vence *amanhã*.\n\nEvite a suspensão pagando via PIX:\n👉 ${APP_URL}/plano`,
  suspendedWa: (name: string) =>
    `🔒 *suaAgendaPro*\n\nOlá ${name}, seu acesso foi *suspenso* por inadimplência.\n\nRegularize o pagamento para reativar:\n👉 ${APP_URL}/plano`,
};

// ─── Steps do cron ────────────────────────────────────────────────────────────

type Result = { notified: number; suspended: number; errors: number };

async function step1_trialExpiring3d(r: Result) {
  const from = new Date(); from.setDate(from.getDate() + 3);
  const to   = new Date(); to.setDate(to.getDate() + 4);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name)")
    .eq("status", "trial")
    .gte("trial_ends_at", from.toISOString())
    .lt("trial_ends_at", to.toISOString());

  if (error) { console.error("[step1]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    if (await alreadySent(row.user_id, "trial_3d")) continue;
    const name  = (row.profiles as any)?.display_name ?? "Profissional";
    const email = await getUserEmail(row.user_id);
    if (!email) continue;
    const { subject, html } = MSG.trialWarning3dEmail(name);
    const ok = await sendEmail(email, subject, html);
    await logNotif(row.user_id, "trial_3d", "email", ok, email);
    if (ok) r.notified++; else r.errors++;
  }
}

async function step2_trialExpiring1d(r: Result) {
  const from = new Date(); from.setDate(from.getDate() + 1);
  const to   = new Date(); to.setDate(to.getDate() + 2);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name, phone)")
    .eq("status", "trial")
    .gte("trial_ends_at", from.toISOString())
    .lt("trial_ends_at", to.toISOString());

  if (error) { console.error("[step2]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    if (await alreadySent(row.user_id, "trial_1d")) continue;
    const p     = row.profiles as any;
    const name  = p?.display_name ?? "Profissional";
    const phone = p?.phone ?? "";
    if (!phone) continue;
    const ok = await sendWhatsApp(phone, MSG.trialWarning1dWa(name));
    await logNotif(row.user_id, "trial_1d", "whatsapp", ok, phone);
    if (ok) r.notified++; else r.errors++;
  }
}

async function step3_suspendExpiredTrials(r: Result) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name, phone)")
    .eq("status", "trial")
    .lt("trial_ends_at", new Date().toISOString());

  if (error) { console.error("[step3]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    const p     = row.profiles as any;
    const name  = p?.display_name ?? "Profissional";
    const phone = p?.phone ?? "";

    await supabase.from("subscriptions").update({ status: "suspended" }).eq("user_id", row.user_id);
    r.suspended++;

    if (phone && !(await alreadySent(row.user_id, "trial_expired"))) {
      const ok = await sendWhatsApp(phone, MSG.trialExpiredWa(name));
      await logNotif(row.user_id, "trial_expired", "whatsapp", ok, phone);
    }
  }
}

async function step4_billingWarning3d(r: Result) {
  const from = new Date(); from.setDate(from.getDate() + 3);
  const to   = new Date(); to.setDate(to.getDate() + 4);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name)")
    .eq("status", "active")
    .gte("current_period_end", from.toISOString())
    .lt("current_period_end", to.toISOString());

  if (error) { console.error("[step4]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    if (await alreadySent(row.user_id, "billing_3d")) continue;
    const name  = (row.profiles as any)?.display_name ?? "Profissional";
    const email = await getUserEmail(row.user_id);
    if (!email) continue;
    const { subject, html } = MSG.billingWarning3dEmail(name);
    const ok = await sendEmail(email, subject, html);
    await logNotif(row.user_id, "billing_3d", "email", ok, email);
    if (ok) r.notified++; else r.errors++;
  }
}

async function step5_billingWarning1d(r: Result) {
  const from = new Date(); from.setDate(from.getDate() + 1);
  const to   = new Date(); to.setDate(to.getDate() + 2);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name, phone)")
    .eq("status", "active")
    .gte("current_period_end", from.toISOString())
    .lt("current_period_end", to.toISOString());

  if (error) { console.error("[step5]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    if (await alreadySent(row.user_id, "billing_1d")) continue;
    const p     = row.profiles as any;
    const name  = p?.display_name ?? "Profissional";
    const phone = p?.phone ?? "";
    if (!phone) continue;
    const ok = await sendWhatsApp(phone, MSG.billingWarning1dWa(name));
    await logNotif(row.user_id, "billing_1d", "whatsapp", ok, phone);
    if (ok) r.notified++; else r.errors++;
  }
}

async function step6_suspendOverdue(r: Result) {
  // Segurança: suspende active com current_period_end expirado (webhook pode ter falhado)
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(display_name, phone)")
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .lt("current_period_end", new Date().toISOString());

  if (error) { console.error("[step6]", error.message); r.errors++; return; }

  for (const row of data ?? []) {
    const p     = row.profiles as any;
    const name  = p?.display_name ?? "Profissional";
    const phone = p?.phone ?? "";

    await supabase.from("subscriptions").update({ status: "suspended" }).eq("user_id", row.user_id);
    r.suspended++;

    if (phone && !(await alreadySent(row.user_id, "suspended_overdue"))) {
      const ok = await sendWhatsApp(phone, MSG.suspendedWa(name));
      await logNotif(row.user_id, "suspended_overdue", "whatsapp", ok, phone);
    }
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const r: Result = { notified: 0, suspended: 0, errors: 0 };
  const t0 = Date.now();

  console.log("[subscription-cron] iniciando", new Date().toISOString());

  await step1_trialExpiring3d(r);
  await step2_trialExpiring1d(r);
  await step3_suspendExpiredTrials(r);
  await step4_billingWarning3d(r);
  await step5_billingWarning1d(r);
  await step6_suspendOverdue(r);

  const ms = Date.now() - t0;
  console.log(`[subscription-cron] concluído ${ms}ms`, r);

  // Registra a execução para o painel de Cobranças (health do cron)
  try {
    await supabase.from("cron_runs").insert({
      job: "subscription-cron",
      notified: r.notified,
      suspended: r.suspended,
      errors: r.errors,
      duration_ms: ms,
    });
  } catch (e) {
    console.error("[subscription-cron] falha ao registrar cron_run:", e);
  }

  return new Response(JSON.stringify({ ok: true, ms, ...r }), {
    headers: { "Content-Type": "application/json" },
  });
});
