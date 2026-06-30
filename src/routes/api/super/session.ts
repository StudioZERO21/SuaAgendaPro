import { createFileRoute } from "@tanstack/react-router";
import {
  buildSuperClearCookieHeader,
  buildSuperSetCookieHeader,
} from "@/lib/super-auth-cookie.server";
import { verifySuperToken } from "@/lib/super-auth.server";

export const Route = createFileRoute("/api/super/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { token?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        const token = body.token ?? "";
        if (!await verifySuperToken(token)) {
          return new Response("Unauthorized", { status: 401 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildSuperSetCookieHeader(token),
          },
        });
      },
      DELETE: async () => {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildSuperClearCookieHeader(),
          },
        });
      },
    },
  },
});
