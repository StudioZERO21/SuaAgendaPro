import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  head: () => ({ meta: [] }),
});

export async function GET() {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
