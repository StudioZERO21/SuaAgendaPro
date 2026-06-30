import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const validatePasswordResetToken = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ valid: boolean; reason: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, password_reset_token_expires_at")
      .eq("password_reset_token", data.token)
      .maybeSingle();

    if (!profile) return { valid: false, reason: "Token inválido ou já utilizado." };

    if (new Date(profile.password_reset_token_expires_at) < new Date()) {
      return { valid: false, reason: "Este link expirou. Faça login com sua senha atual para trocar." };
    }

    return { valid: true, reason: null };
  });

export const resetPasswordWithToken = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        token: z.string().uuid(),
        newPassword: z
          .string()
          .min(8, "Mínimo de 8 caracteres")
          .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
          .regex(/[0-9]/, "Deve ter ao menos 1 número"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, password_reset_token_expires_at")
      .eq("password_reset_token", data.token)
      .maybeSingle();

    if (!profile) throw new Error("Token inválido ou já utilizado.");
    if (new Date(profile.password_reset_token_expires_at) < new Date()) {
      throw new Error("Este link expirou. Faça login para trocar sua senha.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({
        force_password_change:           false,
        password_reset_token:            null,
        password_reset_token_expires_at: null,
      })
      .eq("id", profile.id);

    return { ok: true };
  });
