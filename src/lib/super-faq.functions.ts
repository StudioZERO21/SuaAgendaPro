import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaqCategory = {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  icon:        string;
  sortOrder:   number;
  enabled:     boolean;
  itemCount:   number;
  createdAt:   string;
  updatedAt:   string;
};

export type FaqSubcategory = {
  id:         string;
  categoryId: string;
  name:       string;
  sortOrder:  number;
  enabled:    boolean;
  itemCount:  number;
  createdAt:  string;
};

export type FaqItem = {
  id:             string;
  categoryId:     string;
  categoryName:   string;
  subcategoryId:  string | null;
  subcategoryName:string | null;
  question:       string;
  answer:         string;
  keywords:       string[];
  sortOrder:      number;
  enabled:        boolean;
  viewCount:      number;
  aiViewCount:    number;
  lastViewedAt:   string | null;
  createdAt:      string;
  updatedAt:      string;
};

export type FaqMetrics = {
  totalItems:      number;
  enabledItems:    number;
  disabledItems:   number;
  totalCategories: number;
  totalViews:      number;
  aiViews:         number;
  viewsThisMonth:  number;
  aiViewsThisMonth:number;
  topItems:        { id: string; question: string; viewCount: number; aiViewCount: number }[];
  viewsByDay:      { date: string; views: number; aiViews: number }[];
  viewsByCategory: { category: string; views: number }[];
  viewsBySource:   { source: string; count: number }[];
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const getFaqCategories = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ _st }).parse(i ?? {}))
  .handler(async ({ data }): Promise<FaqCategory[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [{ data: cats }, { data: counts }] = await Promise.all([
      db.from("faq_categories").select("*").order("sort_order").order("name"),
      db.from("faq_items").select("category_id, id"),
    ]);

    const countMap: Record<string, number> = {};
    for (const item of counts ?? []) {
      countMap[item.category_id] = (countMap[item.category_id] ?? 0) + 1;
    }

    return (cats ?? []).map((c: any) => ({
      id:          c.id,
      name:        c.name,
      slug:        c.slug,
      description: c.description ?? "",
      icon:        c.icon ?? "❓",
      sortOrder:   c.sort_order,
      enabled:     c.enabled,
      itemCount:   countMap[c.id] ?? 0,
      createdAt:   c.created_at,
      updatedAt:   c.updated_at,
    }));
  });

export const saveFaqCategory = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({
      _st,
      id:          z.string().uuid().optional(),
      name:        z.string().min(2).max(80),
      slug:        z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
      description: z.string().max(300).default(""),
      icon:        z.string().max(10).default("❓"),
      sortOrder:   z.number().int().default(0),
      enabled:     z.boolean().default(true),
    }).parse(i),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const payload = {
      name:        data.name,
      slug:        data.slug,
      description: data.description,
      icon:        data.icon,
      sort_order:  data.sortOrder,
      enabled:     data.enabled,
      updated_at:  new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await db.from("faq_categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await db.from("faq_categories").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteFaqCategory = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { count } = await db.from("faq_items").select("id", { count: "exact", head: true }).eq("category_id", data.id);
    if ((count ?? 0) > 0) throw new Error("Remova todos os itens desta categoria antes de excluí-la.");

    const { error } = await db.from("faq_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Subcategories ────────────────────────────────────────────────────────────

export const getFaqSubcategories = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ _st, categoryId: z.string().uuid().optional() }).parse(i ?? {}))
  .handler(async ({ data }): Promise<FaqSubcategory[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    let q = db.from("faq_subcategories").select("*").order("sort_order").order("name");
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    const { data: subs, error } = await q;
    if (error) throw new Error(error.message);

    const { data: counts } = await db.from("faq_items").select("subcategory_id, id");
    const countMap: Record<string, number> = {};
    for (const item of counts ?? []) {
      if (item.subcategory_id) countMap[item.subcategory_id] = (countMap[item.subcategory_id] ?? 0) + 1;
    }

    return (subs ?? []).map((s: any) => ({
      id:         s.id,
      categoryId: s.category_id,
      name:       s.name,
      sortOrder:  s.sort_order,
      enabled:    s.enabled,
      itemCount:  countMap[s.id] ?? 0,
      createdAt:  s.created_at,
    }));
  });

export const saveFaqSubcategory = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({
      _st,
      id:         z.string().uuid().optional(),
      categoryId: z.string().uuid(),
      name:       z.string().min(2).max(80),
      sortOrder:  z.number().int().default(0),
      enabled:    z.boolean().default(true),
    }).parse(i),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const payload = { category_id: data.categoryId, name: data.name, sort_order: data.sortOrder, enabled: data.enabled };
    if (data.id) {
      const { error } = await db.from("faq_subcategories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await db.from("faq_subcategories").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteFaqSubcategory = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { error } = await db.from("faq_subcategories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Items ────────────────────────────────────────────────────────────────────

export const getFaqItems = createServerFn({ method: "GET" })
  .validator((i: unknown) =>
    z.object({ _st, categoryId: z.string().uuid().optional(), search: z.string().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data }): Promise<FaqItem[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    let q = db.from("faq_items").select("*, faq_categories(name), faq_subcategories(name)").order("sort_order").order("created_at");
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let items: FaqItem[] = (rows ?? []).map((r: any) => ({
      id:             r.id,
      categoryId:     r.category_id,
      categoryName:   r.faq_categories?.name ?? "",
      subcategoryId:  r.subcategory_id ?? null,
      subcategoryName:r.faq_subcategories?.name ?? null,
      question:       r.question,
      answer:         r.answer,
      keywords:       r.keywords ?? [],
      sortOrder:      r.sort_order,
      enabled:        r.enabled,
      viewCount:      r.view_count,
      aiViewCount:    r.ai_view_count,
      lastViewedAt:   r.last_viewed_at ?? null,
      createdAt:      r.created_at,
      updatedAt:      r.updated_at,
    }));

    if (data.search?.trim()) {
      const q = data.search.toLowerCase();
      items = items.filter(i =>
        i.question.toLowerCase().includes(q) ||
        i.answer.toLowerCase().includes(q) ||
        i.keywords.some(k => k.toLowerCase().includes(q)),
      );
    }

    return items;
  });

export const saveFaqItem = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({
      _st,
      id:            z.string().uuid().optional(),
      categoryId:    z.string().uuid(),
      subcategoryId: z.string().uuid().nullable().optional(),
      question:      z.string().min(5).max(500),
      answer:        z.string().min(10).max(5000),
      keywords:      z.array(z.string()).default([]),
      sortOrder:     z.number().int().default(0),
      enabled:       z.boolean().default(true),
    }).parse(i),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const payload = {
      category_id:    data.categoryId,
      subcategory_id: data.subcategoryId ?? null,
      question:       data.question,
      answer:         data.answer,
      keywords:       data.keywords,
      sort_order:     data.sortOrder,
      enabled:        data.enabled,
      updated_at:     new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await db.from("faq_items").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await db.from("faq_items").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteFaqItem = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { error } = await db.from("faq_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFaqItem = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid(), enabled: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { error } = await db.from("faq_items").update({ enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFaqCategory = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ _st, id: z.string().uuid(), enabled: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { error } = await db.from("faq_categories").update({ enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Metrics ──────────────────────────────────────────────────────────────────

export const getFaqMetrics = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ _st }).parse(i ?? {}))
  .handler(async ({ data }): Promise<FaqMetrics> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const start14d = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    const [
      { data: items },
      { data: cats },
      { data: logs },
      { data: logsPeriod },
    ] = await Promise.all([
      db.from("faq_items").select("id, question, view_count, ai_view_count, enabled, category_id, faq_categories(name)"),
      db.from("faq_categories").select("id"),
      db.from("faq_view_logs").select("faq_id, source, created_at").gte("created_at", start14d),
      db.from("faq_view_logs").select("source, created_at").gte("created_at", startMonth),
    ]);

    const allItems: any[] = items ?? [];
    const allLogs:  any[] = logs ?? [];

    const topItems = [...allItems]
      .sort((a, b) => (b.view_count + b.ai_view_count) - (a.view_count + a.ai_view_count))
      .slice(0, 10)
      .map(i => ({ id: i.id, question: i.question, viewCount: i.view_count, aiViewCount: i.ai_view_count }));

    // Views by day (last 14 days)
    const dayMap: Record<string, { views: number; aiViews: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = { views: 0, aiViews: 0 };
    }
    for (const log of allLogs) {
      const day = log.created_at.slice(0, 10);
      if (dayMap[day]) {
        dayMap[day].views++;
        if (log.source === "ai") dayMap[day].aiViews++;
      }
    }

    // Views by category
    const catViewMap: Record<string, { name: string; count: number }> = {};
    for (const item of allItems) {
      const catName = item.faq_categories?.name ?? "Sem categoria";
      if (!catViewMap[item.category_id]) catViewMap[item.category_id] = { name: catName, count: 0 };
      catViewMap[item.category_id].count += item.view_count + item.ai_view_count;
    }

    // Source breakdown (month)
    const sourceMap: Record<string, number> = {};
    for (const log of logsPeriod ?? []) {
      sourceMap[log.source] = (sourceMap[log.source] ?? 0) + 1;
    }

    const monthLogs: any[] = logsPeriod ?? [];
    const aiMonthLogs = monthLogs.filter(l => l.source === "ai");

    return {
      totalItems:       allItems.length,
      enabledItems:     allItems.filter(i => i.enabled).length,
      disabledItems:    allItems.filter(i => !i.enabled).length,
      totalCategories:  (cats ?? []).length,
      totalViews:       allItems.reduce((s, i) => s + i.view_count, 0),
      aiViews:          allItems.reduce((s, i) => s + i.ai_view_count, 0),
      viewsThisMonth:   monthLogs.filter(l => l.source !== "ai").length,
      aiViewsThisMonth: aiMonthLogs.length,
      topItems,
      viewsByDay:      Object.entries(dayMap).map(([date, v]) => ({ date, ...v })),
      viewsByCategory: Object.values(catViewMap).sort((a, b) => b.count - a.count).map(v => ({ category: v.name, views: v.count })),
      viewsBySource:   Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
    };
  });

// ─── Public search (para N8N / IA) ───────────────────────────────────────────

export type FaqSearchResult = {
  id:           string;
  category:     string;
  subcategory:  string | null;
  question:     string;
  answer:       string;
  keywords:     string[];
};

export const searchFaqPublic = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({
      query:  z.string().min(1).max(500),
      limit:  z.number().int().min(1).max(20).default(5),
      source: z.string().default("ai"),
    }).parse(i),
  )
  .handler(async ({ data }): Promise<FaqSearchResult[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    // Full-text search primeiro, depois fallback para ILIKE
    const tsQuery = data.query.trim().split(/\s+/).join(" & ");
    const { data: ftsRows } = await db
      .from("faq_items")
      .select("id, question, answer, keywords, category_id, subcategory_id, faq_categories(name), faq_subcategories(name)")
      .eq("enabled", true)
      .textSearch("question,answer", tsQuery, { type: "websearch", config: "portuguese" })
      .limit(data.limit);

    let rows = ftsRows ?? [];

    // Fallback ILIKE se FTS não retornou resultados
    if (rows.length === 0) {
      const { data: likeRows } = await db
        .from("faq_items")
        .select("id, question, answer, keywords, category_id, subcategory_id, faq_categories(name), faq_subcategories(name)")
        .eq("enabled", true)
        .or(`question.ilike.%${data.query}%,answer.ilike.%${data.query}%`)
        .limit(data.limit);
      rows = likeRows ?? [];
    }

    // Registra consultas e incrementa contadores
    if (rows.length > 0) {
      const ids: string[] = rows.map((r: any) => r.id);
      const isAi = data.source === "ai";
      await Promise.all([
        db.from("faq_view_logs").insert(
          ids.map((id) => ({ faq_id: id, source: data.source, query_text: data.query })),
        ),
        ...ids.map((id) => db.rpc("increment_faq_view", { p_id: id, p_is_ai: isAi })),
      ]);
    }

    return rows.map((r: any) => ({
      id:          r.id,
      category:    r.faq_categories?.name ?? "",
      subcategory: r.faq_subcategories?.name ?? null,
      question:    r.question,
      answer:      r.answer,
      keywords:    r.keywords ?? [],
    }));
  });
