import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
      .select("id, slug, display_name, bio, phone, avatar_url, banner_url, cover_url, city, state, street, street_number, neighborhood, social_links, specialty, theme_color, gradient_color_2, show_prices, accept_online, template_id, custom_colors")
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
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data, context }): Promise<void> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("slug", data.slug)
      .eq("id", context.userId)
      .maybeSingle();

    if (!profile) {
      throw new Error("Não autorizado a invalidar este cache.");
    }

    const { cacheDel } = await import("@/lib/redis.server");
    await cacheDel(`public:profile:${data.slug}`);
  });

export const getPublicSlots = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        professionalId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        durationMin: z.coerce.number().int().positive(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<string[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_available_slots", {
      p_professional_id: data.professionalId,
      p_date: data.date,
      p_duration_min: data.durationMin,
    });
    if (error) {
      console.error("[getPublicSlots]", error.message);
      return [];
    }
    return (rows ?? []).map((row: { slot_time: string }) => row.slot_time.slice(0, 5));
  });

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
  marketingConsent?: boolean;
};

async function findOrCreateClient(
  supabaseAdmin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server")>>["supabaseAdmin"],
  professionalId: string,
  clientName: string,
  phone: string,
  clientEmail: string,
  marketingConsent?: boolean,
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("professional_id", professionalId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: newClient, error: cErr } = await supabaseAdmin
    .from("clients")
    .insert({
      professional_id: professionalId,
      name: clientName.trim(),
      phone,
      email: clientEmail || null,
      notes: null,
      ...(marketingConsent
        ? { marketing_consent_at: new Date().toISOString() }
        : {}),
    })
    .select("id")
    .single();

  if (cErr || !newClient) throw new Error("Erro ao registrar cliente");
  return newClient.id;
}

async function afterBookingCreated(
  supabaseAdmin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server")>>["supabaseAdmin"],
  data: CreateBookingInput,
  appt: { id: string },
  phone: string,
) {
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
    const { sendPushToUser } = await import("@/lib/push.server");
    await sendPushToUser(data.professionalId, {
      title: "Novo agendamento! 🎉",
      body:  `${data.clientName} agendou para ${datePt} às ${timePt}.`,
      url:   "/app",
    });
  } catch {}

  try {
    const { pushAppointmentToGoogle } = await import("@/lib/google-calendar.functions");
    await pushAppointmentToGoogle(data.professionalId, appt.id, "create");
  } catch {}

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
}

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
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(`booking:${clientIpFromRequest(req)}`, 10, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { validatePublicBooking } = await import(
      "@/lib/public-booking-validation.server",
    );

    const validated = await validatePublicBooking(supabaseAdmin, data);
    const phone = data.clientPhone.replace(/\D/g, "");
    const clientId = await findOrCreateClient(
      supabaseAdmin,
      validated.professionalId,
      data.clientName,
      phone,
      data.clientEmail,
      data.marketingConsent,
    );

    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: validated.professionalId,
        client_id: clientId,
        service_id: validated.serviceId,
        scheduled_at: validated.scheduledAt,
        duration_minutes: validated.durationMinutes,
        price_cents: validated.priceCents,
        deposit_cents: 0,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (aErr || !appt) throw new Error("Erro ao criar agendamento");

    await afterBookingCreated(supabaseAdmin, { ...data, ...validated }, appt, phone);

    return { appointmentId: appt.id };
  });

// ── Lookup de cliente por telefone (página pública) ──────────

// nameHint: mascarado para display. firstName: nome real para pre-fill (o
// próprio cliente digitou o telefone dele — sem questão de LGPD).
export type ClientLookupResult = {
  found: boolean;
  nameHint: string | null;
  firstName: string | null;
  email: string | null;
};

export const lookupClientByPhone = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { professionalId: string; phone: string } => {
    const i = input as Record<string, unknown>;
    if (!i?.professionalId || !i?.phone) throw new Error("Dados inválidos");
    return input as { professionalId: string; phone: string };
  })
  .handler(async ({ data }): Promise<ClientLookupResult> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(`lookup-phone:${clientIpFromRequest(req)}`, 20, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 10) return { found: false, nameHint: null, firstName: null, email: null };

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
    if (!client) return { found: false, nameHint: null, firstName: null, email: null };

    const firstName = client.name.trim().split(/\s+/)[0] ?? "";
    const hint = firstName.length > 1
      ? `${firstName.charAt(0)}${"*".repeat(Math.min(firstName.length - 1, 4))}`
      : null;

    return {
      found: true,
      nameHint: hint,
      firstName: firstName || null,
      email: client.email ?? null,
    };
  });

// ── Trava/libera slot temporário (previne double-booking) ─────

export const lockSlot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      professionalId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      durationMinutes: z.number().int().positive(),
      holdMinutes: z.number().int().positive().default(30),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ lockId: string; heldUntil: string }> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import("@/lib/rate-limit.server");
    const req = getRequest();
    await enforceRateLimit(`lock-slot:${clientIpFromRequest(req)}`, 30, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const heldUntil = new Date(Date.now() + data.holdMinutes * 60_000).toISOString();

    const { data: lock, error } = await supabaseAdmin
      .from("slot_locks")
      .insert({
        professional_id: data.professionalId,
        locked_date: data.date,
        locked_time: data.time,
        duration_minutes: data.durationMinutes,
        held_until: heldUntil,
      })
      .select("id")
      .single();

    if (error || !lock) throw new Error("Horário indisponível — tente outro.");
    return { lockId: lock.id, heldUntil };
  });

export const releaseSlot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ lockId: z.string().uuid() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("slot_locks").delete().eq("id", data.lockId);
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
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(`booking-mp:${clientIpFromRequest(req)}`, 10, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { validatePublicBooking } = await import(
      "@/lib/public-booking-validation.server",
    );

    const validated = await validatePublicBooking(supabaseAdmin, data);
    const phone = data.clientPhone.replace(/\D/g, "");
    const clientId = await findOrCreateClient(
      supabaseAdmin,
      validated.professionalId,
      data.clientName,
      phone,
      data.clientEmail,
      data.marketingConsent,
    );

    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: validated.professionalId,
        client_id: clientId,
        service_id: validated.serviceId,
        scheduled_at: validated.scheduledAt,
        duration_minutes: validated.durationMinutes,
        price_cents: validated.priceCents,
        deposit_cents: validated.depositCents,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (aErr || !appt) throw new Error("Erro ao criar agendamento");

    const { data: secret } = await supabaseAdmin
      .from("mercado_pago_account_secrets")
      .select("access_token")
      .eq("user_id", validated.professionalId)
      .maybeSingle();
    if (!secret?.access_token) throw new Error("Mercado Pago não conectado");

    const isSandbox = secret.access_token.startsWith("TEST");
    const backUrl = `${data.origin}/agendar/${data.slug}?mp=done&appointment_id=${appt.id}`;
    const notificationUrl =
      `${data.origin}/api/public/mp-webhook?source_news=webhooks`;

    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret.access_token}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Sinal — ${validated.serviceName}`,
          quantity: 1,
          unit_price: validated.depositCents / 100,
          currency_id: "BRL",
        }],
        external_reference: appt.id,
        back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
        auto_return: "approved",
        notification_url: notificationUrl,
        // Checkout só para cartão — PIX fica na tela do app (Payments API)
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
            { id: "bank_transfer" },
          ],
        },
      }),
    });

    if (!prefRes.ok) {
      await supabaseAdmin.from("appointments").delete().eq("id", appt.id);
      throw new Error(`Falha ao criar preferência MP: ${prefRes.status}`);
    }

    const pref = (await prefRes.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };
    const initPoint = isSandbox ? pref.sandbox_init_point : pref.init_point;

    try {
      const dt = new Date(validated.scheduledAt);
      const datePt = dt.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const timePt = dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: validated.professionalId,
        type: "new_appointment",
        title: "Novo agendamento aguardando pagamento 🎉",
        body: `${data.clientName} agendou para ${datePt} às ${timePt}. Aguardando pagamento via Mercado Pago.`,
        appointment_id: appt.id,
      });
    } catch {}

    return { appointmentId: appt.id, initPoint };
  });

export type MpPixPaymentResult = {
  appointmentId: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string | null;
};

/** Mercado Pago PIX — QR Code na tela (sem redirecionar ao checkout). */
export const createMpPixPaymentAndBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CreateMpBookingInput => {
    const i = input as Record<string, unknown>;
    if (!i?.professionalId || !i?.serviceId || !i?.scheduledAt || !i?.clientName || !i?.clientPhone) {
      throw new Error("Dados incompletos");
    }
    return input as CreateMpBookingInput;
  })
  .handler(async ({ data }): Promise<MpPixPaymentResult> => {
    const { randomUUID } = await import("node:crypto");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(`booking-mp-pix:${clientIpFromRequest(req)}`, 10, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { validatePublicBooking } = await import(
      "@/lib/public-booking-validation.server",
    );

    const validated = await validatePublicBooking(supabaseAdmin, data);
    const phone = data.clientPhone.replace(/\D/g, "");
    const clientId = await findOrCreateClient(
      supabaseAdmin,
      validated.professionalId,
      data.clientName,
      phone,
      data.clientEmail,
      data.marketingConsent,
    );

    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: validated.professionalId,
        client_id: clientId,
        service_id: validated.serviceId,
        scheduled_at: validated.scheduledAt,
        duration_minutes: validated.durationMinutes,
        price_cents: validated.priceCents,
        deposit_cents: validated.depositCents,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (aErr || !appt) throw new Error("Erro ao criar agendamento");

    const { data: secret } = await supabaseAdmin
      .from("mercado_pago_account_secrets")
      .select("access_token")
      .eq("user_id", validated.professionalId)
      .maybeSingle();
    if (!secret?.access_token) throw new Error("Mercado Pago não conectado");

    const nameParts = data.clientName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const payerEmail =
      data.clientEmail?.trim() ||
      `${phone.slice(-11) || "cliente"}@pagamento.suaagenda.pro`;

    const notificationUrl =
      `${data.origin}/api/public/mp-webhook?source_news=webhooks`;

    const payRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret.access_token}`,
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: validated.depositCents / 100,
        description: `Sinal — ${validated.serviceName}`.slice(0, 120),
        payment_method_id: "pix",
        external_reference: appt.id,
        notification_url: notificationUrl,
        payer: {
          email: payerEmail,
          first_name: firstName.slice(0, 80),
          last_name: lastName.slice(0, 80),
        },
      }),
    });

    if (!payRes.ok) {
      await supabaseAdmin.from("appointments").delete().eq("id", appt.id);
      const errBody = await payRes.text().catch(() => "");
      throw new Error(`Falha ao gerar PIX MP: ${payRes.status} ${errBody.slice(0, 120)}`);
    }

    const payment = (await payRes.json()) as {
      id: number | string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
        };
      };
    };

    const qrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? "";
    const qrCodeBase64 =
      payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

    if (!qrCode) {
      await supabaseAdmin.from("appointments").delete().eq("id", appt.id);
      throw new Error("Mercado Pago não retornou QR Code PIX");
    }

    const paymentId = String(payment.id);

    await supabaseAdmin.from("payment_transactions").upsert(
      {
        user_id: validated.professionalId,
        client_name: data.clientName,
        service_name: validated.serviceName,
        amount_cents: validated.depositCents,
        method: "mercado_pago",
        status: "pending",
        external_reference: appt.id,
        mercado_pago_payment_id: paymentId,
        appointment_id: appt.id,
      },
      { onConflict: "user_id,mercado_pago_payment_id" },
    );

    try {
      const dt = new Date(validated.scheduledAt);
      await supabaseAdmin.from("notifications").insert({
        user_id: validated.professionalId,
        type: "new_appointment",
        title: "Aguardando PIX Mercado Pago 📱",
        body: `${data.clientName} reservou ${dt.toLocaleDateString("pt-BR")} — aguardando PIX.`,
        appointment_id: appt.id,
      });
    } catch {}

    return {
      appointmentId: appt.id,
      paymentId,
      qrCode,
      qrCodeBase64,
    };
  });

/** PIX manual: cria agendamento pendente — confirmação só via profissional após comprovante. */
export const createPublicPixBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CreateBookingInput => {
    const i = input as Record<string, unknown>;
    if (
      !i?.professionalId ||
      !i?.serviceId ||
      !i?.scheduledAt ||
      !i?.clientName ||
      !i?.clientPhone
    ) {
      throw new Error("Dados incompletos");
    }
    return input as CreateBookingInput;
  })
  .handler(async ({ data }): Promise<{ appointmentId: string }> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(`booking-pix:${clientIpFromRequest(req)}`, 10, 3600);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { validatePublicBooking } = await import(
      "@/lib/public-booking-validation.server",
    );

    const validated = await validatePublicBooking(supabaseAdmin, data);
    const phone = data.clientPhone.replace(/\D/g, "");
    const clientId = await findOrCreateClient(
      supabaseAdmin,
      validated.professionalId,
      data.clientName,
      phone,
      data.clientEmail,
      data.marketingConsent,
    );

    const { data: appt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        professional_id: validated.professionalId,
        client_id: clientId,
        service_id: validated.serviceId,
        scheduled_at: validated.scheduledAt,
        duration_minutes: validated.durationMinutes,
        price_cents: validated.priceCents,
        deposit_cents: validated.depositCents,
        deposit_paid: false,
        status: "pending",
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (aErr || !appt) throw new Error("Erro ao reservar horário");

    try {
      const dt = new Date(validated.scheduledAt);
      const datePt = dt.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const timePt = dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: validated.professionalId,
        type: "new_appointment",
        title: "Agendamento aguardando PIX 📱",
        body: `${data.clientName} reservou ${datePt} às ${timePt}. Aguardando comprovante PIX.`,
        appointment_id: appt.id,
      });
    } catch {}

    return { appointmentId: appt.id };
  });

/** Cancela agendamento pendente quando cliente desiste do pagamento PIX. */
export const cancelPendingPublicBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ appointmentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: "Pagamento PIX não concluído",
      })
      .eq("id", data.appointmentId)
      .eq("status", "pending")
      .eq("deposit_paid", false);
    return { ok: true };
  });
