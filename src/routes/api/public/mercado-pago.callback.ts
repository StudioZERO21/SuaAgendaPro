import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercado-pago/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const origin = url.origin;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const finalize = async (
          attemptId: string | null,
          status: "success" | "failed",
          reason: string | null,
        ) => {
          if (!attemptId) return;
          try {
            await supabaseAdmin
              .from("mercado_pago_oauth_attempts")
              .update({ status, reason, completed_at: new Date().toISOString() })
              .eq("id", attemptId);
          } catch {}
        };

        const fail = async (attemptId: string | null, reason: string) => {
          await finalize(attemptId, "failed", reason);
          return Response.redirect(
            `${origin}/pagamentos?mp=error&reason=${encodeURIComponent(reason)}`,
            302,
          );
        };

        const { verifyOAuthState, getMpOAuthCredentials, exchangeCodeForToken } = await import(
          "@/lib/mp-oauth.server"
        );

        const verified = state ? verifyOAuthState(state) : null;
        const attemptId = verified?.attemptId ?? null;

        if (errorParam) return fail(attemptId, errorParam);
        if (!code || !state) return fail(attemptId, "missing_params");
        if (!verified) return fail(null, "invalid_state");

        const creds = getMpOAuthCredentials();
        if (!creds) return fail(attemptId, "not_configured");

        const token = await exchangeCodeForToken({
          clientId: creds.clientId,
          clientSecret: creds.clientSecret,
          code,
          redirectUri: verified.redirectUri,
          codeVerifier: verified.pkceVerifier,
        });
        if (!token?.access_token) return fail(attemptId, "exchange_failed");

        let email: string | null = null;
        try {
          const me = await fetch("https://api.mercadopago.com/users/me", {
            headers: { Authorization: `Bearer ${token.access_token}` },
          });
          if (me.ok) {
            const data = (await me.json()) as { email?: string };
            email = data.email ?? null;
          }
        } catch {}

        const { error: secretError } = await supabaseAdmin
          .from("mercado_pago_account_secrets")
          .upsert(
            { user_id: verified.userId, access_token: token.access_token },
            { onConflict: "user_id" },
          );
        if (secretError) return fail(attemptId, "secret_save_failed");

        const { error: settingsError } = await supabaseAdmin
          .from("professional_payment_settings")
          .upsert(
            {
              user_id: verified.userId,
              mercado_pago_connected: true,
              mercado_pago_account_email: email,
              mercado_pago_public_key: token.public_key ?? null,
            },
            { onConflict: "user_id" },
          );
        if (settingsError) return fail(attemptId, "settings_save_failed");

        await finalize(attemptId, "success", null);
        return Response.redirect(`${origin}/pagamentos?mp=success`, 302);
      },
    },
  },
});
