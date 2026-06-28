/**
 * GET/POST /api/faq/search
 * Endpoint público para N8N/IA consultar o FAQ.
 *
 * Query params (GET): ?q=pergunta&limit=5&source=ai
 * Body (POST): { query: string, limit?: number, source?: string }
 *
 * Retorna: { results: FaqSearchResult[] }
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/faq/search")({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url    = new URL(request.url);
        const query  = url.searchParams.get("q") ?? "";
        const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "5"), 20);
        const source = url.searchParams.get("source") ?? "ai";
        return handleSearch(query, limit, source);
      },
      POST: async ({ request }) => {
        const body   = await request.json().catch(() => ({}));
        const query  = String(body.query ?? "");
        const limit  = Math.min(Number(body.limit ?? 5), 20);
        const source = String(body.source ?? "ai");
        return handleSearch(query, limit, source);
      },
    },
  },
});

async function handleSearch(query: string, limit: number, source: string): Promise<Response> {
  if (!query.trim()) {
    return Response.json({ error: "Parâmetro 'query' ou 'q' é obrigatório." }, { status: 400 });
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    // Busca full-text
    const tsQuery = query.trim().split(/\s+/).filter(Boolean).join(" & ");
    const { data: ftsRows } = await db
      .from("faq_items")
      .select("id, question, answer, keywords, faq_categories(name), faq_subcategories(name)")
      .eq("enabled", true)
      .textSearch("question,answer", tsQuery, { type: "websearch", config: "portuguese" })
      .limit(limit);

    let rows = ftsRows ?? [];

    // Fallback ILIKE
    if (rows.length === 0) {
      const { data: likeRows } = await db
        .from("faq_items")
        .select("id, question, answer, keywords, faq_categories(name), faq_subcategories(name)")
        .eq("enabled", true)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
        .limit(limit);
      rows = likeRows ?? [];
    }

    // Registra views
    if (rows.length > 0) {
      const ids: string[] = rows.map((r: any) => r.id);
      const isAi = source === "ai";
      await Promise.all([
        db.from("faq_view_logs").insert(ids.map((id) => ({ faq_id: id, source, query_text: query }))),
        ...ids.map((id) => db.rpc("increment_faq_view", { p_id: id, p_is_ai: isAi })),
      ]);
    }

    const results = rows.map((r: any) => ({
      id:          r.id,
      category:    r.faq_categories?.name ?? "",
      subcategory: r.faq_subcategories?.name ?? null,
      question:    r.question,
      answer:      r.answer,
      keywords:    r.keywords ?? [],
    }));

    return Response.json({ results, total: results.length, query });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
