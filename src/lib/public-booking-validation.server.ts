/**
 * Validação server-side de agendamentos públicos.
 * Recalcula preço/duração a partir do banco — nunca confia no client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ValidatedBooking = {
  professionalId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  acceptOnline: boolean;
  serviceName: string;
};

export async function validatePublicBooking(
  supabaseAdmin: SupabaseClient,
  input: {
    professionalId: string;
    serviceId: string;
    scheduledAt: string;
    durationMinutes?: number;
    priceCents?: number;
    depositCents?: number;
  },
): Promise<ValidatedBooking> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, is_active, accept_online")
    .eq("id", input.professionalId)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    throw new Error("Profissional não encontrado ou inativo.");
  }
  if (!profile.accept_online) {
    throw new Error("Este profissional não aceita agendamentos online.");
  }

  const { data: service } = await supabaseAdmin
    .from("services")
    .select("id, name, duration_minutes, price_cents, is_active, professional_id")
    .eq("id", input.serviceId)
    .eq("professional_id", input.professionalId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    throw new Error("Serviço inválido ou indisponível.");
  }

  const scheduled = new Date(input.scheduledAt);
  if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now() - 60_000) {
    throw new Error("Horário inválido ou no passado.");
  }

  const dateStr = input.scheduledAt.slice(0, 10);
  const { data: slots, error: slotErr } = await supabaseAdmin.rpc(
    "get_available_slots",
    {
      p_professional_id: input.professionalId,
      p_date: dateStr,
      p_duration_min: service.duration_minutes,
    },
  );

  if (slotErr) {
    throw new Error("Não foi possível verificar disponibilidade.");
  }

  const timePart = input.scheduledAt.includes("T")
    ? input.scheduledAt.split("T")[1]?.slice(0, 5)
    : null;

  if (!timePart) {
    throw new Error("Formato de horário inválido.");
  }

  const slotAvailable = (slots ?? []).some(
    (row: { slot_time: string }) => row.slot_time.slice(0, 5) === timePart,
  );

  if (!slotAvailable) {
    throw new Error("Horário não disponível. Escolha outro slot.");
  }

  const priceCents = service.price_cents;
  const depositCents = Math.round(priceCents * 0.3);

  return {
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    scheduledAt: input.scheduledAt,
    durationMinutes: service.duration_minutes,
    priceCents,
    depositCents,
    acceptOnline: profile.accept_online,
    serviceName: service.name,
  };
}
