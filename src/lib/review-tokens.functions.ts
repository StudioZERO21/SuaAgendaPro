import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export type TokenValidation =
  | { ok: true; professionalId: string; professionalName: string; avatarUrl: string | null; slug: string; expiresAt: string }
  | { ok: false; error: string };

// ── Generate token — server fn (authenticated, no admin key needed) ──

export const generateReviewToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ token: string; expiresAt: string }> => {
    // Uses the authenticated user's client — RLS policy allows insert where professional_id = auth.uid()
    const { data, error } = await context.supabase
      .from("review_tokens")
      .insert({ professional_id: context.userId })
      .select("id, expires_at")
      .single();

    if (error || !data) throw new Error("Erro ao gerar link de avaliação.");
    return { token: data.id, expiresAt: data.expires_at };
  });

// ── Validate token — client-side RPC (SECURITY DEFINER bypasses RLS) ──

export async function validateReviewToken(token: string): Promise<TokenValidation> {
  const { data, error } = await supabase.rpc("validate_review_token", { p_token: token });
  if (error || !data) return { ok: false, error: "Não foi possível verificar este link." };
  const result = data as Record<string, unknown>;
  if (result.error) return { ok: false, error: result.error as string };
  return {
    ok: true,
    professionalId:   result.professional_id   as string,
    professionalName: result.professional_name  as string,
    avatarUrl:        result.avatar_url         as string | null,
    slug:             result.slug               as string,
    expiresAt:        result.expires_at         as string,
  };
}

// ── Submit review — client-side RPC (SECURITY DEFINER handles auth) ──

export async function submitReviewWithToken(input: {
  token: string;
  clientName: string;
  rating: number;
  message: string;
  isAnonymous: boolean;
}): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc("submit_review_with_token", {
    p_token:        input.token,
    p_client_name:  input.clientName,
    p_rating:       input.rating,
    p_message:      input.message,
    p_is_anonymous: input.isAnonymous,
  });
  if (error) throw new Error(error.message);
  const result = data as Record<string, unknown>;
  if (result.error) throw new Error(result.error as string);
  return { success: true };
}
