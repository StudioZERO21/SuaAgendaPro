import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// ── Client-side public fetches (no server function needed) ────
export async function getPublicProfile(slug: string): Promise<PublicData | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, slug, display_name, bio, phone, avatar_url, banner_url, cover_url, city, state, street, street_number, neighborhood, social_links, specialty, theme_color, gradient_color_2, show_prices, accept_online")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) console.error("[getPublicProfile]", error.message);
  if (!profile) return null;

  const [{ data: services }, { data: wh }, { data: portfolio }, { data: reviews }, { data: statsRows }, { data: schedBlocks }] = await Promise.all([
    supabase.from("services").select("id, name, description, duration_minutes, price_cents, category, category_label, image_url").eq("professional_id", profile.id).eq("is_active", true).order("name"),
    supabase.from("working_hours").select("day_of_week, is_open, start_time, end_time").eq("professional_id", profile.id),
    supabase.from("portfolio_items").select("id, image_url, title, description, order_index").eq("professional_id", profile.id).order("order_index", { ascending: true }),
    supabase.from("reviews").select("id, client_name, client_avatar_url, rating, message, is_anonymous, created_at").eq("professional_id", profile.id).eq("is_public", true).order("created_at", { ascending: false }),
    supabase.rpc("get_review_stats", { p_professional_id: profile.id }),
    supabase.from("schedule_blocks").select("id, start_date, end_date, reason, title").eq("professional_id", profile.id),
  ]);

  const stats = (statsRows as { total_count: number; avg_rating: number }[] | null)?.[0];

  return {
    profile: profile as PublicProfileRow,
    services: (services ?? []) as PublicServiceRow[],
    workingHours: (wh ?? []) as PublicWorkingHoursRow[],
    portfolio: (portfolio ?? []) as PublicPortfolioRow[],
    reviews: (reviews ?? []) as PublicReviewRow[],
    reviewTotalCount: stats?.total_count ?? 0,
    reviewAvgRating: stats?.avg_rating ?? 0,
    scheduleBlocks: (schedBlocks ?? []) as PublicScheduleBlock[],
  };
}

export async function getPublicSlots(professionalId: string, dateStr: string, durationMin: number): Promise<string[]> {
  const { data } = await supabase.rpc("get_available_slots", {
    p_professional_id: professionalId,
    p_date: dateStr,
    p_duration_min: durationMin,
  });
  return (data ?? []).map((row: { slot_time: string }) => row.slot_time.slice(0, 5));
}

// ── Public types ──────────────────────────────────────────────

export type PublicProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  cover_url: string | null;
  gradient_color_2: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  street_number: string | null;
  neighborhood: string | null;
  social_links: unknown;
  specialty: string | null;
  theme_color: string;
  show_prices: boolean;
  accept_online: boolean;
};

export type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  category: string | null;
  category_label: string | null;
  image_url: string | null;
};

export type PublicWorkingHoursRow = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type PublicPortfolioRow = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  order_index: number;
};

export type PublicReviewRow = {
  id: string;
  client_name: string;
  client_avatar_url: string | null;
  rating: number;
  message: string;
  is_anonymous: boolean;
  created_at: string;
};

export type PublicScheduleBlock = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  title: string | null;
};

export type PublicData = {
  profile: PublicProfileRow;
  services: PublicServiceRow[];
  workingHours: PublicWorkingHoursRow[];
  portfolio: PublicPortfolioRow[];
  reviews: PublicReviewRow[];
  reviewTotalCount: number;
  reviewAvgRating: number;
  scheduleBlocks: PublicScheduleBlock[];
};

export type CreateBookingInput = {
  professionalId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  priceCents: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
};

// ── Server Functions ──────────────────────────────────────────

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CreateBookingInput => {
    const i = input as Record<string, unknown>;
    if (
      !i?.professionalId ||
      !i?.serviceId ||
      !i?.scheduledAt ||
      !i?.clientName ||
      !i?.clientPhone
    ) {
      throw new Error("Dados incompletos para agendamento");
    }
    return input as CreateBookingInput;
  })
  .handler(async ({ data }): Promise<{ appointmentId: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = data.clientPhone.replace(/\D/g, "");

    // Find or create client by professional_id + phone
    const { data: existing } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("professional_id", data.professionalId)
      .eq("phone", phone)
      .maybeSingle();

    let clientId: string;
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: newClient, error: cErr } = await supabaseAdmin
        .from("clients")
        .insert({
          professional_id: data.professionalId,
          name: data.clientName.trim(),
          phone,
          email: data.clientEmail || null,
          notes: null,
        })
        .select("id")
        .single();
      if (cErr || !newClient) throw new Error("Erro ao registrar cliente");
      clientId = newClient.id;
    }

    // Create appointment
    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: data.professionalId,
        client_id: clientId,
        service_id: data.serviceId,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        price_cents: data.priceCents,
        deposit_cents: 0,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (aErr || !appt) throw new Error("Erro ao criar agendamento");

    // Create in-app notification for the professional (best-effort)
    try {
      const dt = new Date(data.scheduledAt);
      const datePt = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
      const timePt = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      await supabaseAdmin.from("notifications").insert({
        user_id:        data.professionalId,
        type:           "new_appointment",
        title:          "Novo agendamento! 🎉",
        body:           `${data.clientName} agendou para ${datePt} às ${timePt}.`,
        appointment_id: appt.id,
      });
    } catch {}

    // Log WhatsApp confirmation message (best-effort — never fail booking)
    try {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("whatsapp_enabled, whatsapp_msg_confirmation, display_name")
        .eq("id", data.professionalId)
        .maybeSingle();

      if (prof?.whatsapp_enabled) {
        const { interpolate } = await import("@/lib/whatsapp.functions");
        const template =
          prof.whatsapp_msg_confirmation ||
          "Olá {{cliente_nome}}! ✅ Agendamento confirmado em {{data}} às {{hora}}. Serviço: {{servico}}.";

        const dt = new Date(data.scheduledAt);
        const datePt = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        const timePt = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const { data: svc } = await supabaseAdmin
          .from("services")
          .select("name")
          .eq("id", data.serviceId)
          .maybeSingle();

        const text = interpolate(template, {
          cliente_nome: data.clientName,
          data: datePt,
          hora: timePt,
          servico: svc?.name ?? "Serviço",
          profissional: prof.display_name || "Profissional",
        });

        await supabaseAdmin.from("whatsapp_messages").insert({
          professional_id: data.professionalId,
          appointment_id: appt.id,
          client_phone: phone,
          client_name: data.clientName,
          message_type: "confirmation",
          message_text: text,
          status: "pending",
        });
      }
    } catch {}

    return { appointmentId: appt.id };
  });
