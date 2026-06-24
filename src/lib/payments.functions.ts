import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type PaymentMethod = "pix_manual" | "mercado_pago";
export type ActivePaymentMethod = "pix" | "mercado_pago" | null;
export type PaymentSettings = {
  activePaymentMethod: ActivePaymentMethod;
  mercadoPago: {
    connected: boolean;
    accountEmail: string;
    publicKey: string;
  };
  pix: {
    enabled: boolean;
    keyType: PixKeyType;
    key: string;
    beneficiaryName: string;
    city: string;
  };
};
export type PaymentTransaction = Tables<"payment_transactions">;

const pixKeyTypeSchema = z.enum(["cpf", "cnpj", "email", "telefone", "aleatoria"]);
const paymentStatusSchema = z.enum(["pending", "paid", "failed", "cancelled", "refunded"]);

export const EMPTY_PAYMENT_SETTINGS: PaymentSettings = {
  activePaymentMethod: null,
  mercadoPago: { connected: false, accountEmail: "", publicKey: "" },
  pix: {
    enabled: false,
    keyType: "email",
    key: "",
    beneficiaryName: "",
    city: "",
  },
};

const settingsSchema = z.object({
  activePaymentMethod: z.enum(["pix", "mercado_pago"]).nullable(),
  mercadoPago: z.object({
    connected: z.boolean(),
    accountEmail: z.string().trim().email().max(255).or(z.literal("")),
    publicKey: z.string().trim().max(255),
  }),
  pix: z.object({
    enabled: z.boolean(),
    keyType: pixKeyTypeSchema,
    key: z.string().trim().max(255),
    beneficiaryName: z.string().trim().max(80),
    city: z.string().trim().max(40),
  }),
});

const connectMercadoPagoSchema = z.object({
  accessToken: z.string().trim().min(20).max(1024),
  accountEmail: z.string().trim().email().max(255).or(z.literal("")),
  publicKey: z.string().trim().max(255).optional().default(""),
});

const createTransactionSchema = z.object({
  appointmentId: z.string().trim().max(120).optional(),
  clientName: z.string().trim().min(1).max(120),
  serviceName: z.string().trim().max(160).optional(),
  amountCents: z.number().int().positive().max(10_000_000),
  method: z.enum(["pix_manual", "mercado_pago"]).default("pix_manual"),
  status: paymentStatusSchema.default("pending"),
  pixPayload: z.string().trim().max(1024).optional(),
});

const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  status: paymentStatusSchema,
});

function toSettings(row: Tables<"professional_payment_settings"> | null): PaymentSettings {
  if (!row) return EMPTY_PAYMENT_SETTINGS;
  return {
    activePaymentMethod: (row.active_payment_method as ActivePaymentMethod) ?? null,
    mercadoPago: {
      connected: row.mercado_pago_connected,
      accountEmail: row.mercado_pago_account_email ?? "",
      publicKey: row.mercado_pago_public_key ?? "",
    },
    pix: {
      enabled: row.pix_enabled,
      keyType: (row.pix_key_type as PixKeyType) || "email",
      key: row.pix_key ?? "",
      beneficiaryName: row.pix_beneficiary_name ?? "",
      city: row.pix_city ?? "",
    },
  };
}

function mapMercadoPagoStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "rejected":
      return "failed";
    default:
      return "pending";
  }
}

async function readMercadoPagoUser(accessToken: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as { email?: string; nickname?: string };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const getPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("professional_payment_settings")
      .select("*, active_payment_method")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return toSettings(data);
  });

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      active_payment_method: data.activePaymentMethod,
      mercado_pago_connected: data.mercadoPago.connected,
      mercado_pago_account_email: data.mercadoPago.accountEmail || null,
      mercado_pago_public_key: data.mercadoPago.publicKey || null,
      pix_enabled: data.pix.enabled,
      pix_key_type: data.pix.keyType,
      pix_key: data.pix.key || null,
      pix_beneficiary_name: data.pix.beneficiaryName || null,
      pix_city: data.pix.city || null,
    };

    const { data: row, error } = await context.supabase
      .from("professional_payment_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*, active_payment_method")
      .single();

    if (error) throw new Error(error.message);
    return toSettings(row);
  });

export const connectMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => connectMercadoPagoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const mpUser = await readMercadoPagoUser(data.accessToken);
    const email = data.accountEmail || mpUser?.email || "";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: secretError } = await supabaseAdmin
      .from("mercado_pago_account_secrets")
      .upsert(
        { user_id: context.userId, access_token: data.accessToken },
        { onConflict: "user_id" },
      );

    if (secretError) throw new Error(secretError.message);

    const { data: row, error } = await context.supabase
      .from("professional_payment_settings")
      .upsert(
        {
          user_id: context.userId,
          mercado_pago_connected: true,
          mercado_pago_account_email: email || null,
          mercado_pago_public_key: data.publicKey || null,
        },
        { onConflict: "user_id" },
      )
      .select("*, active_payment_method")
      .single();

    if (error) throw new Error(error.message);
    return toSettings(row);
  });

export const startMercadoPagoOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ origin: z.string().trim().url().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getMpOAuthCredentials, createOAuthState, buildAuthorizationUrl, generatePkce, isPkceEnabled } =
      await import("@/lib/mp-oauth.server");
    const creds = getMpOAuthCredentials();
    const redirectUri = `${data.origin}/api/public/mercado-pago/callback`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("mercado_pago_oauth_attempts")
      .insert({
        user_id: context.userId,
        status: creds ? "started" : "failed",
        reason: creds ? null : "not_configured",
        redirect_uri: redirectUri,
        completed_at: creds ? null : new Date().toISOString(),
      })
      .select("id")
      .single();

    if (attemptError) throw new Error(attemptError.message);

    if (!creds) {
      return { ok: false as const, reason: "not_configured" as const };
    }

    // PKCE (obrigatório na versão atual da API MP)
    const pkce = isPkceEnabled() ? generatePkce() : null;

    const state = createOAuthState(context.userId, redirectUri, attempt.id, pkce?.verifier);
    const url = buildAuthorizationUrl({
      clientId: creds.clientId,
      redirectUri,
      state,
      codeChallenge: pkce?.challenge,
    });
    return { ok: true as const, url };
  });

export const listMercadoPagoOAuthAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mercado_pago_oauth_attempts")
      .select("id,status,reason,created_at,completed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const disconnectMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("mercado_pago_account_secrets").delete().eq("user_id", context.userId);

    // Verifica se MP era o método ativo para não desativar o PIX por engano
    const { data: current } = await context.supabase
      .from("professional_payment_settings")
      .select("active_payment_method")
      .eq("user_id", context.userId)
      .maybeSingle();

    const clearActive = current?.active_payment_method === "mercado_pago";

    const { data: row, error } = await context.supabase
      .from("professional_payment_settings")
      .upsert(
        {
          user_id: context.userId,
          mercado_pago_connected: false,
          mercado_pago_account_email: null,
          mercado_pago_public_key: null,
          ...(clearActive ? { active_payment_method: null } : {}),
        },
        { onConflict: "user_id" },
      )
      .select("*, active_payment_method")
      .single();

    if (error) throw new Error(error.message);
    return toSettings(row);
  });

export const listPaymentTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) =>
    z.object({ limit: z.number().int().min(1).max(100).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createPaymentTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createTransactionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_transactions")
      .insert({
        user_id: context.userId,
        appointment_id: data.appointmentId || null,
        client_name: data.clientName,
        service_name: data.serviceName || null,
        amount_cents: data.amountCents,
        method: data.method,
        status: data.status,
        pix_payload: data.pixPayload || null,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const updatePaymentTransactionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateTransactionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_transactions")
      .update({
        status: data.status,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const syncMercadoPagoTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: secret, error: secretError } = await supabaseAdmin
      .from("mercado_pago_account_secrets")
      .select("access_token")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (secretError) throw new Error(secretError.message);
    if (!secret?.access_token) return { imported: 0, transactions: [] as PaymentTransaction[] };

    const response = await fetch(
      "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=30",
      { headers: { Authorization: `Bearer ${secret.access_token}` } },
    );

    if (!response.ok) {
      return { imported: 0, transactions: [] as PaymentTransaction[], unavailable: true };
    }

    const body = (await response.json()) as { results?: Array<Record<string, any>> };
    const rows = (body.results ?? [])
      .filter((payment) => payment?.id && Number(payment?.transaction_amount) > 0)
      .map((payment) => ({
        user_id: context.userId,
        client_name:
          [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(" ") ||
          payment.payer?.email ||
          "Cliente Mercado Pago",
        service_name: payment.description || "Pagamento Mercado Pago",
        amount_cents: Math.round(Number(payment.transaction_amount) * 100),
        method: "mercado_pago" as const,
        status: mapMercadoPagoStatus(payment.status),
        external_reference: payment.external_reference || null,
        mercado_pago_payment_id: String(payment.id),
        paid_at: payment.date_approved || null,
      }));

    if (rows.length === 0) return { imported: 0, transactions: [] as PaymentTransaction[] };

    const { data: saved, error } = await context.supabase
      .from("payment_transactions")
      .upsert(rows, { onConflict: "user_id,mercado_pago_payment_id" })
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { imported: rows.length, transactions: saved ?? [] };
  });