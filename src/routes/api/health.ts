import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  ssr: false,
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
