import { createServerFileRoute } from "@tanstack/react-start/server";
import { timingSafeEqual } from "node:crypto";

function safeTokenEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export const ServerRoute = createServerFileRoute("/api/cron/data-retention").methods({
  POST: async ({ request }) => {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const expected = process.env.AI_SYNC_TOKEN ?? "";

    if (!expected || !safeTokenEqual(token, expected)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { runDataRetention } = await import("@/lib/data-retention.server");
      const stats = await runDataRetention();
      return new Response(JSON.stringify({ ok: true, stats }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return new Response(JSON.stringify({ ok: false, error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
