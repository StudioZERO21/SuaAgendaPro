import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Troca de senha (autenticado) ────────────────────────────────────────────

export const changeUserPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(12),
    }).parse(input),
  )
  .handler(async ({ data, request }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Obtem o user_id do Bearer token da requisição
    const authHeader = request.headers.get("authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!accessToken) throw new Error("Não autenticado.");

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !user) throw new Error("Sessão inválida.");

    // Reautentica com a senha atual para confirmar identidade
    const { error: reAuthErr } = await supabaseAdmin.auth.signInWithPassword({
      email:    user.email!,
      password: data.currentPassword,
    });
    if (reAuthErr) throw new Error("Senha atual incorreta.");

    // Atualiza para a nova senha
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: data.newPassword,
    });
    if (updateErr) throw new Error(updateErr.message);

    // Limpa flag de troca forçada se ainda estava ativa
    await supabaseAdmin
      .from("profiles")
      .update({ force_password_change: false })
      .eq("id", user.id);

    return { ok: true };
  });

// ─── Solicitar reset de senha (precisa aprovação do super admin) ──────────────

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, request }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authHeader = request.headers.get("authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!accessToken) throw new Error("Não autenticado.");

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) throw new Error("Sessão inválida.");

    // Verifica se já tem solicitação pendente
    const { data: existing } = await supabaseAdmin
      .from("password_reset_requests")
      .select("id, status, requested_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      const since = new Date(existing.requested_at).toLocaleDateString("pt-BR");
      throw new Error(`Você já tem uma solicitação pendente desde ${since}. Aguarde a aprovação.`);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    const { error: insertErr } = await supabaseAdmin
      .from("password_reset_requests")
      .insert({
        user_id:    user.id,
        user_email: user.email!,
        user_name:  profile?.name ?? null,
        reason:     data.reason ?? null,
        status:     "pending",
      });

    if (insertErr) throw new Error(insertErr.message);
    return { ok: true };
  });

// ─── Super Admin: listar e gerir solicitações ─────────────────────────────────

export type ResetRequest = {
  id:           string;
  userId:       string;
  userEmail:    string;
  userName:     string | null;
  status:       "pending" | "approved" | "rejected" | "used";
  reason:       string | null;
  requestedAt:  string;
  reviewedAt:   string | null;
  reviewedBy:   string | null;
};

export const listResetRequests = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<ResetRequest[]> => {
    const { requireSuperAuth } = await import("@/lib/super-auth.server");
    await requireSuperAuth(data._st);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("password_reset_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id:          r.id,
      userId:      r.user_id,
      userEmail:   r.user_email,
      userName:    r.user_name,
      status:      r.status as ResetRequest["status"],
      reason:      r.reason,
      requestedAt: r.requested_at,
      reviewedAt:  r.reviewed_at,
      reviewedBy:  r.reviewed_by,
    }));
  });

export const approveResetRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st: z.string(), requestId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSuperAuth, getSuperAuthEmail } = await import("@/lib/super-auth.server");
    await requireSuperAuth(data._st);
    const reviewerEmail = await getSuperAuthEmail(data._st) ?? "super_admin";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error: fetchErr } = await supabaseAdmin
      .from("password_reset_requests")
      .select("*")
      .eq("id", data.requestId)
      .eq("status", "pending")
      .single();
    if (fetchErr || !req) throw new Error("Solicitação não encontrada ou já processada.");

    // Gera link de reset via Supabase Admin
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type:  "recovery",
      email: req.user_email,
    });
    if (linkErr || !linkData.properties?.action_link) {
      throw new Error("Falha ao gerar link de reset: " + (linkErr?.message ?? "sem link"));
    }
    const resetLink = linkData.properties.action_link;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    // Atualiza status
    await supabaseAdmin
      .from("password_reset_requests")
      .update({
        status:          "approved",
        reviewed_at:     new Date().toISOString(),
        reviewed_by:     reviewerEmail,
        token_expires_at: expiresAt,
      })
      .eq("id", data.requestId);

    // Envia email com link via Resend
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from   = process.env.RESEND_FROM_EMAIL ?? "SuaAgenda.Pro <noreply@suaagenda.pro>";

    await resend.emails.send({
      from,
      to:      req.user_email,
      subject: "Seu pedido de reset de senha foi aprovado",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#7c3aed">Reset de senha aprovado</h2>
          <p>Olá${req.user_name ? `, <strong>${req.user_name}</strong>` : ""}!</p>
          <p>Sua solicitação de reset de senha foi aprovada pelo time SuaAgenda.Pro.</p>
          <p>Clique no botão abaixo para definir sua nova senha. O link expira em <strong>24 horas</strong>.</p>
          <p style="text-align:center;margin:32px 0">
            <a href="${resetLink}"
               style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;
                      padding:14px 28px;border-radius:12px;text-decoration:none;
                      font-weight:600;font-size:15px">
              Criar nova senha
            </a>
          </p>
          <p style="font-size:12px;color:#888">Se não foi você, ignore este email.</p>
        </div>`,
    });

    return { ok: true };
  });

export const rejectResetRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st: z.string(), requestId: z.string().uuid(), rejectReason: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireSuperAuth, getSuperAuthEmail } = await import("@/lib/super-auth.server");
    await requireSuperAuth(data._st);
    const reviewerEmail = await getSuperAuthEmail(data._st) ?? "super_admin";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("password_reset_requests")
      .update({
        status:      "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerEmail,
        reason:      data.rejectReason ?? null,
      })
      .eq("id", data.requestId)
      .eq("status", "pending");
    return { ok: true };
  });
