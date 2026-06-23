import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WorkingHours, WorkingHoursInsert, ScheduleBlock } from "@/integrations/supabase/types";

const WH_KEY = ["working_hours"] as const;
const SB_KEY = ["schedule_blocks"] as const;

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

// ── Schedule Blocks ───────────────────────────────────────────

export function useScheduleBlocks() {
  return useQuery({
    queryKey: SB_KEY,
    queryFn: async () => {
      const uid = await getCurrentUserId();
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("professional_id", uid)
        .order("start_date");
      if (error) throw error;
      return (data ?? []) as ScheduleBlock[];
    },
  });
}

export function useAddScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      start,
      end,
      reason,
      title,
    }: {
      start: string;
      end: string;
      reason: string;
      title?: string;
    }) => {
      const uid = await getCurrentUserId();

      // Check for existing appointments in the range
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", uid)
        .gte("scheduled_at", `${start}T00:00:00`)
        .lte("scheduled_at", `${end}T23:59:59`)
        .not("status", "in", "(cancelled,no_show)");

      if (count && count > 0) {
        throw new Error(`CONFLICT:${count}`);
      }

      const { error } = await supabase
        .from("schedule_blocks")
        .insert({
          professional_id: uid,
          start_date: start,
          end_date: end,
          reason,
          title: title?.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SB_KEY }),
  });
}

export function useUpdateScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, start, end, reason, title,
    }: { id: string; start: string; end: string; reason: string; title?: string }) => {
      const uid = await getCurrentUserId();
      // check conflicts excluding the current block's own dates
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", uid)
        .gte("scheduled_at", `${start}T00:00:00`)
        .lte("scheduled_at", `${end}T23:59:59`)
        .not("status", "in", "(cancelled,no_show)");
      if (count && count > 0) throw new Error(`CONFLICT:${count}`);

      const { error } = await supabase
        .from("schedule_blocks")
        .update({ start_date: start, end_date: end, reason, title: title?.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SB_KEY }),
  });
}

export function useRemoveScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SB_KEY }),
  });
}

// ── Helpers ───────────────────────────────────────────────────

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
