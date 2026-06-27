import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ── Página pública — busca com cache Redis (server function) ──────────────────

export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input ?? {}))
  .handler(async ({ data }): Promise<PublicData | null> => {
    const { cacheGet, cacheSet } = await import("@/lib/redis.server");
    const cacheKey = `public:profile:${data.slug}`;

    const cached = await cacheGet<PublicData>(cacheKey);
    if (cached) return cached;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, slug, display_name, bio, phone, avatar_url, banner_url, cover_url, city, state, street, street_number, neighborhood, social_links, specialty, theme_color, gradient_color_2, show_prices, accept_online")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .single();

    if (error || !profile) return null;

    const [
      { data: services },
      { data: wh },
      { data: portfolio },
      { data: reviews },
      { data: statsRows },
      { data: schedBlocks },
      { data: paySettings },
    ] = await Promise.all([
      supabaseAdmin.from("services").select("id, name, description, duration_minutes, price_cents, category, category_label, image_url").eq("professional_id", profile.id).eq("is_active", true).order("name"),
      supabaseAdmin.from("working_hours").select("day_of_week, is_open, start_time, end_time").eq("professional_id", profile.id),
      supabaseAdmin.from("portfolio_items").select("id, image_url, title, description, order_index").eq("professional_id", profile.id).order("order_index", { ascending: true }),
      supabaseAdmin.from("reviews").select("id, client_name, client_avatar_url, rating, message, is_anonymous, created_at").eq("professional_id", profile.id).eq("is_public", true).order("created_at", { ascending: false }),
      supabaseAdmin.rpc("get_review_stats", { p_professional_id: profile.id }),
      supabaseAdmin.from("schedule_blocks").select("id, start_date, end_date, reason, title").eq("professional_id", profile.id),
      supabaseAdmin.from("professional_payment_settings").select("pix_enabled, pix_key, pix_key_type, pix_beneficiary_name, pix_city, mercado_pago_connected, active_payment_method").eq("user_id", profile.id).maybeSingle(),
    ]);

    const stats = (statsRows as { total_count: number; avg_rating: number }[] | null)?.[0];
    const ps = paySettings as {
      pix_enabled: boolean; pix_key: string | null; pix_key_type: string;
      pix_beneficiary_name: string | null; pix_city: string | null;
      mercado_pago_connected: boolean; active_payment_method: string | null;
    } | null;
    const activeMethod = ps?.active_payment_method ?? null;

    const result: PublicData = {
      profile:          profile as PublicProfileRow,
      services:         (services ?? []) as PublicServiceRow[],
      workingHours:     (wh ?? []) as PublicWorkingHoursRow[],
      portfolio:        (portfolio ?? []) as PublicPortfolioRow[],
      reviews:          (reviews ?? []) as PublicReviewRow[],
      reviewTotalCount: stats?.total_count ?? 0,
      reviewAvgRating:  stats?.avg_rating ?? 0,
      scheduleBlocks:   (schedBlocks ?? []) as PublicScheduleBlock[],
      pix: {
        enabled:         activeMethod === "pix" && (ps?.pix_enabled ?? false),
        key:             activeMethod === "pix" ? (ps?.pix_key ?? null) : null,
        keyType:         ps?.pix_key_type ?? "email",
        beneficiaryName: ps?.pix_beneficiary_name ?? null,
        city:            ps?.pix_city ?? null,
      },
      mpConnected: activeMethod === "mercado_pago" && (ps?.mercado_pago_connected ?? false),
    };

    await cacheSet(cacheKey, result, 300); // 5 min
    return result;
  });

// Server function para hooks client-side invalidarem o cache após salvar
// serviços, horários, portfólio ou perfil — requer auth do usuário logado
export const invalidatePublicProfileCache = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const { cacheDel } = await import("@/lib/redis.server");
    await cacheDel(`public:profile:${data.slug}`);
  });

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

export type PublicPixSettings = {
  enabled: boolean;
  key: string | null;
  keyType: string;
  beneficiaryName: string | null;
  city: string | null;
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
  pix: PublicPixSettings;
  mpConnected: boolean;
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

// ── Lookup de cliente por telefone (página pública) ──────────

export type ClientLookupResult = { name: string; email: string | null } | null;

export const lookupClientByPhone = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { professionalId: string; phone: string } => {
    const i = input as Record<string, unknown>;
    if (!i?.professionalId || !i?.phone) throw new Error("Dados inválidos");
    return input as { professionalId: string; phone: string };
  })
  .handler(async ({ data }): Promise<ClientLookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 10) return null;

    // Gera os dois formatos possíveis: dígitos puros e o formato BR (XX) XXXXX-XXXX
    // pois o admin pode salvar de qualquer jeito e o agendamento público salva só dígitos
    const formatted = digits.length === 11
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("name, email")
      .eq("professional_id", data.professionalId)
      .in("phone", [digits, formatted])
      .limit(1);

    const client = clients?.[0] ?? null;
    if (!client) return null;
    return { name: client.name, email: (client as any).email ?? null };
  });

// ── Mercado Pago: cria agendamento + preferência de pagamento ──

export type CreateMpBookingInput = CreateBookingInput & {
  depositCents: number;
  slug: string;
  origin: string;
};

export const createMpPreferenceAndBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CreateMpBookingInput => {
    const i = input as Record<string, unknown>;
    if (!i?.professionalId || !i?.serviceId || !i?.scheduledAt || !i?.clientName || !i?.clientPhone) {
      throw new Error("Dados incompletos");
    }
    return input as CreateMpBookingInput;
  })
  .handler(async ({ data }): Promise<{ appointmentId: string; initPoint: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Garantir cliente
    const phone = data.clientPhone.replace(/\D/g, "");
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
        .insert({ professional_id: data.professionalId, name: data.clientName.trim(), phone, email: data.clientEmail || null })
        .select("id")
        .single();
      if (cErr || !newClient) throw new Error("Erro ao registrar cliente");
      clientId = newClient.id;
    }

    // 2. Criar agendamento (status pending — confirmado pelo webhook MP)
    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: data.professionalId,
        client_id: clientId,
        service_id: data.serviceId,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        price_cents: data.priceCents,
        deposit_cents: data.depositCents,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (aErr || !appt) throw new Error("Erro ao criar agendamento");

    // 3. Buscar access_token do profissional
    const { data: secret } = await supabaseAdmin
      .from("mercado_pago_account_secrets")
      .select("access_token")
      .eq("user_id", data.professionalId)
      .maybeSingle();
    if (!secret?.access_token) throw new Error("Mercado Pago não conectado");

    // 4. Criar preferência de checkout
    const isSandbox = secret.access_token.startsWith("TEST");
    const backUrl = `${data.origin}/agendar/${data.slug}?mp=done&appointment_id=${appt.id}`;
    const { data: svcRow } = await supabaseAdmin
      .from("services")
      .select("name")
      .eq("id", data.serviceId)
      .maybeSingle();

    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret.access_token}` },
      body: JSON.stringify({
        items: [{
          title: `Sinal — ${svcRow?.name ?? "Serviço"}`,
          quantity: 1,
          unit_price: Math.round(data.depositCents) / 100,
          currency_id: "BRL",
        }],
        external_reference: appt.id,
        back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
        auto_return: "approved",
      }),
    });

    if (!prefRes.ok) {
      // Limpar agendamento criado em caso de falha
      await supabaseAdmin.from("appointments").delete().eq("id", appt.id);
      throw new Error(`Falha ao criar preferência MP: ${prefRes.status}`);
    }

    const pref = (await prefRes.json()) as { id: string; init_point: string; sandbox_init_point: string };
    const initPoint = isSandbox ? pref.sandbox_init_point : pref.init_point;

    // 5. Notificação para o profissional
    try {
      const dt = new Date(data.scheduledAt);
      const datePt = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
      const timePt = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      await supabaseAdmin.from("notifications").insert({
        user_id: data.professionalId,
        type: "new_appointment",
        title: "Novo agendamento aguardando pagamento 🎉",
        body: `${data.clientName} agendou para ${datePt} às ${timePt}. Aguardando pagamento via Mercado Pago.`,
        appointment_id: appt.id,
      });
    } catch {}

    return { appointmentId: appt.id, initPoint };
  });
