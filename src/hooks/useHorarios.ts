import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WorkingHours, WorkingHoursInsert, BlockedDate } from "@/integrations/supabase/types";

const WH_KEY = ["working_hours"] as const;
const BD_KEY = ["blocked_dates"] as const;

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

// ── Working Hours ─────────────────────────────────────────────

export function useWorkingHours() {
  return useQuery({
    queryKey: WH_KEY,
    queryFn: async () => {
      const uid = await getCurrentUserId();
      const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("professional_id", uid)
        .order("day_of_week");
      if (error) throw error;
      return (data ?? []) as WorkingHours[];
    },
  });
}

export function useSaveWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<WorkingHoursInsert, "professional_id">[]) => {
      const uid = await getCurrentUserId();
      const payload = rows.map((r) => ({ ...r, professional_id: uid }));
      const { error } = await supabase
        .from("working_hours")
        .upsert(payload, { onConflict: "professional_id,day_of_week" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WH_KEY }),
  });
}

// ── Blocked Dates ─────────────────────────────────────────────

export function useBlockedDates() {
  return useQuery({
    queryKey: BD_KEY,
    queryFn: async () => {
      const uid = await getCurrentUserId();
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("professional_id", uid)
        .order("blocked_date");
      if (error) throw error;
      return (data ?? []) as BlockedDate[];
    },
  });
}

export function useAddBlockedDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason?: string }) => {
      const uid = await getCurrentUserId();
      const { error } = await supabase
        .from("blocked_dates")
        .insert({ professional_id: uid, blocked_date: date, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BD_KEY }),
  });
}

export function useAddBlockedRange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ start, end, reason }: { start: string; end: string; reason?: string }) => {
      const uid = await getCurrentUserId();
      // Expand range to individual dates
      const dates: string[] = [];
      const cur = new Date(start + "T12:00:00");
      const endDate = new Date(end + "T12:00:00");
      while (cur <= endDate) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      const rows = dates.map((d) => ({
        professional_id: uid,
        blocked_date: d,
        reason: reason || null,
      }));
      const { error } = await supabase
        .from("blocked_dates")
        .upsert(rows, { onConflict: "professional_id,blocked_date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BD_KEY }),
  });
}

export function useRemoveBlockedDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BD_KEY }),
  });
}

// ── Helpers ───────────────────────────────────────────────────

/** Build a map of day_of_week → WorkingHours for easy access */
export function buildDayMap(rows: WorkingHours[]) {
  return Object.fromEntries(rows.map((r) => [r.day_of_week, r])) as Record<number, WorkingHours>;
}

export const DAY_INFO = [
  { dow: 0, label: "Domingo",  short: "Dom" },
  { dow: 1, label: "Segunda",  short: "Seg" },
  { dow: 2, label: "Terça",    short: "Ter" },
  { dow: 3, label: "Quarta",   short: "Qua" },
  { dow: 4, label: "Quinta",   short: "Qui" },
  { dow: 5, label: "Sexta",    short: "Sex" },
  { dow: 6, label: "Sábado",   short: "Sáb" },
] as const;
