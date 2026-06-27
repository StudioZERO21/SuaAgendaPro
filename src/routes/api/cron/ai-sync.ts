import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/cron/ai-sync").methods({
  POST: async ({ request }) => {
    // Protegido por token — nunca exposto publicamente
    const auth     = request.headers.get("authorization") ?? "";
    const token    = auth.replace(/^Bearer\s+/i, "");
    const expected = process.env.AI_SYNC_TOKEN ?? "";

    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { runAiSync } = await import("@/lib/ai-sync.server");
      const stats = await runAiSync();
      return new Response(JSON.stringify({ ok: true, stats }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
