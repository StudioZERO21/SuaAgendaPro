import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type WhatsAppMessage = Tables<"whatsapp_messages">;

export type WhatsAppSettings = {
  enabled: boolean;
  greeting: string;
  msgConfirmation: string;
  msgReminder: string;
  msgCancellation: string;
};

export const DEFAULT_WA_SETTINGS: WhatsAppSettings = {
  enabled: false,
  greeting:
    "Oi! 💖 Aqui é do Studio. Como posso te ajudar hoje?",
  msgConfirmation:
    "Olá {{cliente_nome}}! ✅ Seu agendamento foi confirmado:\n📅 {{data}} às {{hora}}\n💅 {{servico}}\n\nQualquer dúvida, é só falar!",
  msgReminder:
    "Olá {{cliente_nome}}! 😊 Lembrando do seu agendamento amanhã:\n🕐 {{hora}} · {{servico}}\n\nTe esperamos!",
  msgCancellation:
    "Olá {{cliente_nome}}, seu agendamento de {{servico}} em {{data}} foi cancelado. Entre em contato para reagendar. 💕",
};

export type MessageType = "confirmation" | "reminder" | "cancellation" | "manual";

const settingsSchema = z.object({
  enabled: z.boolean(),
  greeting: z.string().trim().max(500),
  msgConfirmation: z.string().trim().max(500),
  msgReminder: z.string().trim().max(500),
  msgCancellation: z.string().trim().max(500),
});

// ── Helpers ───────────────────────────────────────────────────

export function buildWaLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ── Server Functions ──────────────────────────────────────────

export const getWhatsAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WhatsAppSettings> => {
    const { data } = await context.supabase
      .from("profiles")
      .select(
        "whatsapp_enabled,whatsapp_greeting,whatsapp_msg_confirmation,whatsapp_msg_reminder,whatsapp_msg_cancellation",
      )
      .eq("id", context.userId)
      .maybeSingle();

    if (!data) return DEFAULT_WA_SETTINGS;
    return {
      enabled: data.whatsapp_enabled ?? false,
      greeting: data.whatsapp_greeting ?? DEFAULT_WA_SETTINGS.greeting,
      msgConfirmation: data.whatsapp_msg_confirmation ?? DEFAULT_WA_SETTINGS.msgConfirmation,
      msgReminder: data.whatsapp_msg_reminder ?? DEFAULT_WA_SETTINGS.msgReminder,
      msgCancellation: data.whatsapp_msg_cancellation ?? DEFAULT_WA_SETTINGS.msgCancellation,
    };
  });

export const saveWhatsAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }): Promise<WhatsAppSettings> => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        whatsapp_enabled: data.enabled,
        whatsapp_greeting: data.greeting || null,
        whatsapp_msg_confirmation: data.msgConfirmation || null,
        whatsapp_msg_reminder: data.msgReminder || null,
        whatsapp_msg_cancellation: data.msgCancellation || null,
      })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return data;
  });

export const listWhatsAppMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WhatsAppMessage[]> => {
    const { data, error } = await context.supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("professional_id", context.userId)
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markMessageSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { id: string };
    if (typeof i?.id !== "string") throw new Error("ID inválido");
    return i;
  })
  .handler(async ({ data, context }): Promise<void> => {
    await context.supabase
      .from("whatsapp_messages")
      .update({ status: "sent" })
      .eq("id", data.id)
      .eq("professional_id", context.userId);
  });
