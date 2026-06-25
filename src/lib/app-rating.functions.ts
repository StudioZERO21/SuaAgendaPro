import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ── Tipos ─────────────────────────────────────────────────────

export type MyRating = { rating: number; comment: string | null } | null;

export type AppRatingRow = {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

// ── Client-side (usa sessão autenticada + RLS) ─────────────────

export async function getMyAppRating(): Promise<MyRating> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await (supabase as any)
    .from("app_ratings")
    .select("rating, comment")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as MyRating) ?? null;
}

export async function submitAppRating(rating: number, comment: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await (supabase as any)
    .from("app_ratings")
    .upsert(
      { user_id: user.id, rating, comment: comment.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
}

// ── Server-side: Super Admin ───────────────────────────────────

export const getAppRatings = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<AppRatingRow[]> => {
    const { requireSuperAuth } = await import("@/lib/super-auth.server");
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("app_ratings")
      .select("id, user_id, rating, comment, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id:        r.id,
      userId:    r.user_id,
      rating:    r.rating,
      comment:   r.comment ?? null,
      createdAt: r.created_at,
    }));
  });
