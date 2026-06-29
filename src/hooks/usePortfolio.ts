import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadBlob, dataUrlToBlob, deleteUpload } from "@/lib/storage";

export const MAX_PORTFOLIO_ITEMS = 10;

export type UIPortfolioItem = {
  id: string;
  src: string;
  title: string;
  category: string;
  description: string;
  order_index: number;
};

async function getUid(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

const KEY = ["portfolio"] as const;

// ── Queries ───────────────────────────────────────────────────

export function usePortfolio() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<UIPortfolioItem[]> => {
      const uid = await getUid();
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id, image_url, title, description, order_index")
        .eq("professional_id", uid)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        src: row.image_url,
        title: row.title ?? "",
        category: "Geral",
        description: row.description ?? "",
        order_index: row.order_index,
      }));
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useAddPortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dataUrl,
      currentCount,
    }: {
      dataUrl: string;
      currentCount: number;
    }): Promise<UIPortfolioItem> => {
      if (currentCount >= MAX_PORTFOLIO_ITEMS) {
        throw new Error(`Limite de ${MAX_PORTFOLIO_ITEMS} fotos.`);
      }

      const uid = await getUid();

      const blob = await dataUrlToBlob(dataUrl);
      const imageUrl = await uploadBlob(blob, "portfolio");

      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          professional_id: uid,
          image_url: imageUrl,
          title: "",
          description: "",
          order_index: currentCount,
        })
        .select("id, image_url, title, description, order_index")
        .single();

      if (error) throw error;

      return {
        id: data.id,
        src: data.image_url,
        title: data.title ?? "",
        category: "Geral",
        description: data.description ?? "",
        order_index: data.order_index,
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
    }: {
      id: string;
      title: string;
      description: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from("portfolio_items")
        .update({ title, description })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const { data: item } = await supabase
        .from("portfolio_items")
        .select("image_url")
        .eq("id", itemId)
        .single();

      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;

      await deleteUpload(item?.image_url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; order_index: number }[]): Promise<void> => {
      await Promise.all(
        items.map(({ id, order_index }) =>
          supabase.from("portfolio_items").update({ order_index }).eq("id", id),
        ),
      );
    },
    onMutate: async (newOrder) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old: UIPortfolioItem[] | undefined) => {
        if (!old) return old;
        const map = new Map(newOrder.map((x) => [x.id, x.order_index]));
        return [...old].sort(
          (a, b) => (map.get(a.id) ?? a.order_index) - (map.get(b.id) ?? b.order_index),
        );
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
