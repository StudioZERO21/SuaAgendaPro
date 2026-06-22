import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Appointment, AppointmentStatus } from "@/integrations/supabase/types";
import { isoToDateStr, isoToTimeStr } from "@/lib/availability";

// ── UI types ──────────────────────────────────────────────────

export type UIStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

export type UIAppointment = {
  id: string;
  clientId: string;
  serviceId: string;
  date: string;          // "YYYY-MM-DD"
  start: string;         // "HH:MM"
  end: string;           // "HH:MM"
  status: UIStatus;
  priceCents: number;
  durationMinutes: number;
  notes?: string | null;
};

// ── Adapters ─────────────────────────────────────────────────

const STATUS_TO_UI: Record<string, UIStatus> = {
  pending:   "pendente",
  confirmed: "confirmado",
  completed: "concluido",
  cancelled: "cancelado",
  no_show:   "cancelado",
};

export const STATUS_TO_DB: Record<UIStatus, AppointmentStatus> = {
  pendente:   "pending",
  confirmado: "confirmed",
  concluido:  "completed",
  cancelado:  "cancelled",
};

export function adaptAppointment(row: Appointment): UIAppointment {
  const startStr = isoToTimeStr(row.scheduled_at);
  const endDate  = new Date(new Date(row.scheduled_at).getTime() + row.duration_minutes * 60000);
  const endStr   = isoToTimeStr(endDate.toISOString());

  return {
    id:              row.id,
    clientId:        row.client_id,
    serviceId:       row.service_id,
    date:            isoToDateStr(row.scheduled_at),
    start:           startStr,
    end:             endStr,
    status:          STATUS_TO_UI[row.status] ?? "pendente",
    priceCents:      row.price_cents,
    durationMinutes: row.duration_minutes,
    notes:           row.notes,
  };
}

// ── Auth helper ───────────────────────────────────────────────

async function uid() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

// ── Query keys ────────────────────────────────────────────────

const KEY = ["appointments"] as const;

// ── Queries ───────────────────────────────────────────────────

/** Fetch all appointments for a ±45-day window around today */
export function useAgendamentos() {
  return useQuery({
    queryKey: [...KEY, "range"],
    queryFn: async () => {
      const id = await uid();
      const now  = new Date();
      const from = new Date(now); from.setDate(now.getDate() - 45);
      const to   = new Date(now); to.setDate(now.getDate() + 60);

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", id)
        .gte("scheduled_at", from.toISOString().slice(0, 10))
        .lte("scheduled_at", to.toISOString().slice(0, 10) + "T23:59:59")
        .order("scheduled_at");

      if (error) throw error;
      return (data as Appointment[]).map(adaptAppointment);
    },
    staleTime: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useCreateAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      serviceId: string;
      scheduledAt: string;
      durationMinutes: number;
      priceCents: number;
      depositCents?: number;
      notes?: string | null;
    }) => {
      const id = await uid();
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          professional_id: id,
          client_id:        payload.clientId,
          service_id:       payload.serviceId,
          scheduled_at:     payload.scheduledAt,
          duration_minutes: payload.durationMinutes,
          price_cents:      payload.priceCents,
          deposit_cents:    payload.depositCents ?? 0,
          deposit_paid:     false,
          status:           "pending",
          notes:            payload.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return adaptAppointment(data as Appointment);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UIStatus }) => {
      const dbStatus = STATUS_TO_DB[status];
      const { error } = status === "cancelado"
        ? await supabase.from("appointments").update({ status: dbStatus, cancelled_at: new Date().toISOString() }).eq("id", id)
        : await supabase.from("appointments").update({ status: dbStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancelAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── Real-time ─────────────────────────────────────────────────

export function useAgendamentosRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("agenda-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        qc.invalidateQueries({ queryKey: KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}
