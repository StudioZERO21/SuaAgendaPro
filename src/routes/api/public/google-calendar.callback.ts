import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/google-calendar/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const origin = url.origin;

        const fail = (reason: string) =>
          Response.redirect(
            `${origin}/google-calendar?gcal=error&reason=${encodeURIComponent(reason)}`,
            302,
          );

        if (errorParam) return fail(errorParam);
        if (!code || !state) return fail("missing_params");

        const { verifyOAuthState } = await import("@/lib/mp-oauth.server");
        const verified = verifyOAuthState(state);
        if (!verified) return fail("invalid_state");

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) return fail("not_configured");

        const redirectUri = verified.redirectUri;

        // Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) return fail("exchange_failed");

        const tokens = (await tokenRes.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
          token_type: string;
        };

        if (!tokens.access_token) return fail("no_access_token");

        // Get Google account email
        let googleEmail: string | null = null;
        try {
          const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (infoRes.ok) {
            const info = (await infoRes.json()) as { email?: string };
            googleEmail = info.email ?? null;
          }
        } catch {}

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gcalTable = (supabaseAdmin as any).from("google_calendar_tokens");
        const { error } = await gcalTable
          .upsert(
            {
              user_id: verified.userId,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              expires_at: expiresAt,
              google_email: googleEmail,
            },
            { onConflict: "user_id" },
          );

        if (error) return fail("save_failed");

        return Response.redirect(`${origin}/google-calendar?gcal=success`, 302);
      },
    },
  },
});
