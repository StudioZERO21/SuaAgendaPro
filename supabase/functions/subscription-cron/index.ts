// ETAPA 6 — Edge Function: cron diário de assinaturas
// Agendada via pg_cron no Supabase: 1x por dia às 08:00 BRT
//
// Para ativar no Supabase:
//   select cron.schedule('subscription-cron', '0 11 * * *',
//     $$select net.http_post(
//       url:='https://SEU_PROJECT.supabase.co/functions/v1/subscription-cron',
//       headers:='{"Authorization":"Bearer SEU_SERVICE_ROLE_KEY"}'::jsonb
//     )$$
//   );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Validação simples de autorização
  const auth = req.headers.get("Authorization");
  if (!auth?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const results = { notified: 0, suspended: 0, errors: 0 };

  // TODO (Etapa 6): implementar cada step abaixo

  // STEP 1 — Trials expirando em 3 dias → Email
  // const trialsIn3 = await supabase.from("subscriptions")
  //   .select("user_id, trial_ends_at, profiles(email, display_name, phone)")
  //   .eq("status", "trial")
  //   .gte("trial_ends_at", now + 3d)
  //   .lte("trial_ends_at", now + 4d)
  // → sendTrialWarningEmail para cada um

  // STEP 2 — Trials expirando em 1 dia → WhatsApp

  // STEP 3 — Trials expirados → suspender + WhatsApp

  // STEP 4 — Assinaturas vencendo em 3 dias → Email
  // (Asaas já notifica, mas podemos reforçar)

  // STEP 5 — Assinaturas vencendo em 1 dia → WhatsApp

  console.log("[subscription-cron] concluído:", results);

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
