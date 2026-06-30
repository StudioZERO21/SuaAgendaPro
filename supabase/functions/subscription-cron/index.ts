// Cron de assinaturas — roda 3x/dia (ex.: pg_cron '0 11,15,19 * * *').
// NÃO envia mais direto: ENFILEIRA avisos em subscription_notifications (status=pending).
// O envio real (com throttle/janela) é feito pela função notification-worker.
//
//   select cron.schedule('subscription-daily-cron', '0 11,15,19 * * *', $$
//     select net.http_post(
//       url:='https://itqsrpmovqeyhzsertqe.supabase.co/functions/v1/subscription-cron',
//       headers:=jsonb_build_object('Content-Type','application/json',
//         'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
//       body:='{}'::jsonb) $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

type Channel = "email" | "whatsapp";

async function getConfig() {
  const { data } = await supabase.from("notification_settings").select("*").eq("id", true).maybeSingle();
  return data ?? { channels: {} };
}

function channelsFor(kind: string, config: any): Channel[] {
  const v = config?.channels?.[kind] ?? "off";
  if (v === "off") return [];
  if (v === "both") return ["email", "whatsapp"];
  if (v === "email" || v === "whatsapp") return [v];
  return [];
}

// Evita re-enfileirar (ou duplicar com já-enviado) o mesmo aviso no mesmo ciclo.
async function alreadyQueuedOrSent(userId: string, kind: string): Promise<boolean> {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("subscription_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .in("status", ["pending", "sent"])
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function getUserEmail(userId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.email ?? "";
}

async function enqueue(userId: string, kind: string, channels: Channel[], phone: string) {
  const rows: any[] = [];
  for (const channel of channels) {
    const target = channel === "email" ? await getUserEmail(userId) : phone;
    if (!target) continue;
    rows.push({
      user_id: userId,
      kind,
      channel,
      status: "pending",
      target,
      scheduled_for: new Date().toISOString(),
    });
  }
  if (rows.length) await supabase.from("subscription_notifications").insert(rows);
  return rows.length;
}

type Result = { queued: number; suspended: number; errors: number };

// Avisos por janela (trial_3d, trial_1d, billing_3d, billing_1d)
async function enqueueWindow(
  kind: string, statusEq: string, dateField: string, fromDays: number, toDays: number,
  config: any, r: Result,
) {
  const from = new Date(); from.setDate(from.getDate() + fromDays);
  const to   = new Date(); to.setDate(to.getDate() + toDays);

  const channels = channelsFor(kind, config);
  if (channels.length === 0) return; // canal desligado para este tipo

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(phone)")
    .eq("status", statusEq)
    .gte(dateField, from.toISOString())
    .lt(dateField, to.toISOString());
  if (error) { console.error(`[${kind}]`, error.message); r.errors++; return; }

  for (const row of data ?? []) {
    if (await alreadyQueuedOrSent(row.user_id, kind)) continue;
    const phone = (row.profiles as any)?.phone ?? "";
    r.queued += await enqueue(row.user_id, kind, channels, phone);
  }
}

// Suspensões (trial expirado / inadimplente) — suspende JÁ e enfileira o aviso
async function enqueueSuspend(kind: string, statusEq: string, dateField: string, config: any, r: Result) {
  const q = supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(phone)")
    .eq("status", statusEq)
    .lt(dateField, new Date().toISOString());
  const { data, error } = kind === "suspended_overdue"
    ? await q.not(dateField, "is", null)
    : await q;
  if (error) { console.error(`[${kind}]`, error.message); r.errors++; return; }

  const channels = channelsFor(kind, config);

  for (const row of data ?? []) {
    await supabase.from("subscriptions").update({ status: "suspended" }).eq("user_id", row.user_id);
    r.suspended++;
    if (channels.length && !(await alreadyQueuedOrSent(row.user_id, kind))) {
      const phone = (row.profiles as any)?.phone ?? "";
      r.queued += await enqueue(row.user_id, kind, channels, phone);
    }
  }
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(serviceKey)) return new Response("Unauthorized", { status: 401 });

  const r: Result = { queued: 0, suspended: 0, errors: 0 };
  const t0 = Date.now();
  const config = await getConfig();

  await enqueueWindow("trial_3d",   "trial",  "trial_ends_at",      3, 4, config, r);
  await enqueueWindow("trial_1d",   "trial",  "trial_ends_at",      1, 2, config, r);
  await enqueueSuspend("trial_expired", "trial", "trial_ends_at", config, r);
  await enqueueWindow("billing_3d", "active", "current_period_end", 3, 4, config, r);
  await enqueueWindow("billing_1d", "active", "current_period_end", 1, 2, config, r);
  await enqueueSuspend("suspended_overdue", "active", "current_period_end", config, r);

  const ms = Date.now() - t0;
  try {
    await supabase.from("cron_runs").insert({
      job: "subscription-cron",
      notified: r.queued,      // quantos foram enfileirados
      suspended: r.suspended,
      errors: r.errors,
      duration_ms: ms,
      details: { queued: r.queued },
    });
  } catch (e) { console.error("[subscription-cron] cron_run:", e); }

  return new Response(JSON.stringify({ ok: true, ms, ...r }), { headers: { "Content-Type": "application/json" } });
});
