import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Client } from "@/integrations/supabase/types";

// ── UI type ───────────────────────────────────────────────────

export type UIClient = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  birthDate?: string | null;
  isVip: boolean;
  initials: string;
  color: string;
  totalAppointments: number;
  totalSpentCents: number;
  lastAppointmentAt?: string | null;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────

const PALETTE = [
  "#f472b6","#ec4899","#d946ef","#a855f7",
  "#c084fc","#e879f9","#f9a8d4","#fbcfe8",
];

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function makeColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function adaptClient(row: Client): UIClient {
  return {
    id:                 row.id,
    name:               row.name,
    phone:              row.phone ?? "",
    email:              row.email,
    notes:              row.notes,
    birthDate:          row.birth_date,
    isVip:              row.is_vip ?? false,
    initials:           makeInitials(row.name),
    color:              makeColor(row.id),
    totalAppointments:  row.total_appointments,
    totalSpentCents:    row.total_spent_cents,
    lastAppointmentAt:  row.last_appointment_at,
    createdAt:          row.created_at,
  };
}

// ── Auth helper ───────────────────────────────────────────────

async function currentUid() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

const KEY = ["clients"] as const;

// ── Queries ───────────────────────────────────────────────────

export function useClientes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const id = await currentUid();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("professional_id", id)
        .order("name");
      if (error) throw error;
      return (data as Client[]).map(adaptClient);
    },
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      phone: string;
      email?: string | null;
      notes?: string | null;
      birthDate?: string | null;
      isVip?: boolean;
    }) => {
      const id = await currentUid();
      const { data, error } = await supabase
        .from("clients")
        .insert({
          professional_id: id,
          name:       payload.name.trim(),
          phone:      payload.phone.trim(),
          email:      payload.email?.trim() || null,
          notes:      payload.notes?.trim() || null,
          birth_date: payload.birthDate || null,
          is_vip:     payload.isVip ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return adaptClient(data as Client);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      phone?: string;
      email?: string | null;
      notes?: string | null;
      birthDate?: string | null;
      isVip?: boolean;
    }) => {
      const { id, ...patch } = payload;
      const { error } = await supabase
        .from("clients")
        .update({
          ...(patch.name      !== undefined && { name:       patch.name.trim() }),
          ...(patch.phone     !== undefined && { phone:      patch.phone.trim() || undefined }),
          ...(patch.email     !== undefined && { email:      patch.email?.trim() || null }),
          ...(patch.notes     !== undefined && { notes:      patch.notes?.trim() || null }),
          ...(patch.birthDate !== undefined && { birth_date: patch.birthDate || null }),
          ...(patch.isVip     !== undefined && { is_vip:     patch.isVip }),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
