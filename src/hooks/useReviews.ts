import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/integrations/supabase/types";

const KEY = ["reviews"] as const;
const MAX_PUBLIC = 10;

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

export function useReviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const id = await currentUserId();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useToggleReviewPublic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_public, currentPublicCount }: { id: string; is_public: boolean; currentPublicCount: number }) => {
      if (is_public && currentPublicCount >= MAX_PUBLIC) {
        throw new Error(`Limite de ${MAX_PUBLIC} avaliações públicas atingido. Desative uma antes de ativar outra.`);
      }
      const { error } = await supabase
        .from("reviews")
        .update({ is_public })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export { MAX_PUBLIC };
