/**
 * Funções LGPD — exportação, exclusão de conta e DSAR.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
  .regex(/[0-9]/, "Deve ter ao menos 1 número");

/** Exporta todos os dados do profissional autenticado (portabilidade Art. 18). */
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: profile },
      { data: clients },
      { data: appointments },
      { data: services },
      { data: reviews },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("clients").select("*").eq("professional_id", userId),
      supabaseAdmin.from("appointments").select("*").eq("professional_id", userId),
      supabaseAdmin.from("services").select("*").eq("professional_id", userId),
      supabaseAdmin.from("reviews").select("*").eq("professional_id", userId),
    ]);

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        email: authUser?.user?.email ?? null,
        createdAt: authUser?.user?.created_at ?? null,
      },
      profile,
      clients: clients ?? [],
      appointments: appointments ?? [],
      services: services ?? [],
      reviews: reviews ?? [],
    };
  });

/** Exclui conta do profissional e dados vinculados (eliminação Art. 18). */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ confirmEmail: z.string().email() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email?.toLowerCase();
    if (!email || email !== data.confirmEmail.toLowerCase()) {
      throw new Error("E-mail de confirmação não confere.");
    }

    // Anonimiza logs de auditoria que referenciam o e-mail
    await supabaseAdmin
      .from("admin_audit_log")
      .update({ target_user_email: "[excluído]" })
      .eq("target_user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Exclui cliente do CRM (direito do titular operado pelo profissional). */
export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ clientId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("id", data.clientId)
      .eq("professional_id", userId)
      .maybeSingle();

    if (!client) throw new Error("Cliente não encontrado.");

    // Anonimiza reviews vinculadas
    await supabaseAdmin
      .from("reviews")
      .update({
        client_name: "Cliente removido",
        client_email: null,
        message: "[dados removidos]",
      })
      .eq("client_id", data.clientId);

    const { error } = await supabaseAdmin
      .from("clients")
      .delete()
      .eq("id", data.clientId)
      .eq("professional_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Formulário DSAR para clientes finais (público). */
export const submitDataSubjectRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      requestType: z.enum([
        "access",
        "rectification",
        "deletion",
        "portability",
        "opposition",
      ]),
      requesterName: z.string().min(2).max(120),
      requesterEmail: z.string().email(),
      requesterPhone: z.string().optional(),
      professionalId: z.string().uuid().optional(),
      message: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { enforceRateLimit, clientIpFromRequest } = await import(
      "@/lib/rate-limit.server",
    );
    const req = getRequest();
    await enforceRateLimit(
      `dsar:${clientIpFromRequest(req)}`,
      5,
      3600,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("data_subject_requests").insert({
      request_type: data.requestType,
      requester_name: data.requesterName.trim(),
      requester_email: data.requesterEmail.trim().toLowerCase(),
      requester_phone: data.requesterPhone?.trim() || null,
      professional_id: data.professionalId ?? null,
      message: data.message?.trim() || null,
    });

    if (error) throw new Error("Não foi possível registrar sua solicitação.");
    return { ok: true };
  });

/** Registra aceite de termos no cadastro. */
export const recordTermsAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("profiles")
      .update({ terms_accepted_at: now, privacy_accepted_at: now })
      .eq("id", context.userId);
    return { ok: true };
  });

export { passwordSchema };
