import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service, ServiceInsert, ServiceUpdate } from "@/integrations/supabase/types";

const KEY = ["services"] as const;

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

// ── Queries ──────────────────────────────────────────────────

export function useServices() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const uid = await getCurrentUserId();
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("professional_id", uid)
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Service;
    },
    enabled: Boolean(id),
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ServiceInsert, "professional_id">) => {
      const uid = await getCurrentUserId();
      const { data, error } = await supabase
        .from("services")
        .insert({ ...payload, professional_id: uid })
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: ServiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── Formatters ───────────────────────────────────────────────

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function parsePriceToCents(raw: string): number {
  const clean = raw.replace(/[R$\s]/g, "").replace(",", ".");
  return Math.round(parseFloat(clean) * 100) || 0;
}
