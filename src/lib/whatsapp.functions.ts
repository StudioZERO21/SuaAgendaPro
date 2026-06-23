import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type WhatsAppMessage = Tables<"whatsapp_messages">;

export type WhatsAppSettings = {
  enabled: boolean;
  greeting: string;
  // Agendamentos
  msgNewBooking: string;
  msgConfirmation: string;
  msgReminder: string;
  msgReminder2h: string;
  msgReschedule: string;
  msgCancellation: string;
  msgNoShow: string;
  // Pós-atendimento
  msgThanks: string;
  msgReview: string;
  // Relacionamento
  msgBirthday: string;
  msgComeback: string;
  msgPromotions: string;
  // Pagamentos
  msgPaymentReceived: string;
  msgPaymentPending: string;
};

export const DEFAULT_WA_SETTINGS: WhatsAppSettings = {
  enabled: false,
  greeting:
    "Oi! 💖 Aqui é do Studio. Como posso te ajudar hoje?",
  // Agendamentos
  msgNewBooking:
    "Nova cliente! 🎉 {{cliente_nome}} agendou {{servico}} para {{data}} às {{hora}}.",
  msgConfirmation:
    "Olá {{cliente_nome}}! ✅ Seu agendamento foi confirmado:\n📅 {{data}} às {{hora}}\n💅 {{servico}}\n\nQualquer dúvida, é só falar!",
  msgReminder:
    "Olá {{cliente_nome}}! 😊 Lembrando do seu agendamento amanhã:\n🕐 {{hora}} · {{servico}}\n\nTe esperamos!",
  msgReminder2h:
    "Oi {{cliente_nome}}! ⏰ Seu horário é hoje às {{hora}} — {{servico}}. A gente te espera!",
  msgReschedule:
    "Olá {{cliente_nome}}! Seu agendamento foi remarcado para {{data}} às {{hora}} — {{servico}}. 📅 Qualquer dúvida, chame a gente!",
  msgCancellation:
    "Olá {{cliente_nome}}, seu agendamento de {{servico}} em {{data}} foi cancelado. Entre em contato para reagendar. 💕",
  msgNoShow:
    "Oi {{cliente_nome}}, notamos que você não pôde comparecer hoje. Quando quiser reagendar, é só chamar! 💕",
  // Pós-atendimento
  msgThanks:
    "Obrigada pela visita, {{cliente_nome}}! 💖 Foi um prazer te atender. Até a próxima!",
  msgReview:
    "Olá {{cliente_nome}}! Gostaríamos muito da sua opinião sobre o atendimento de hoje. Deixe sua avaliação: {{link_avaliacao}} ⭐",
  // Relacionamento
  msgBirthday:
    "Feliz aniversário, {{cliente_nome}}! 🎂🎉 Que seu dia seja incrível! Com carinho, {{profissional}}.",
  msgComeback:
    "Oi {{cliente_nome}}! Sentimos sua falta por aqui 💕 Que tal marcar um horário para se cuidar?",
  msgPromotions:
    "Oi {{cliente_nome}}! Temos uma novidade especial para você 🌟 {{mensagem}}",
  // Pagamentos
  msgPaymentReceived:
    "Pagamento confirmado! ✅ {{cliente_nome}}, recebemos o pagamento de R$ {{valor}} pelo serviço {{servico}}. Obrigada! 💖",
  msgPaymentPending:
    "Olá {{cliente_nome}}, o pagamento de R$ {{valor}} pelo serviço {{servico}} está pendente. Qualquer dúvida, chame a gente! 💕",
};

export type MessageType = "confirmation" | "reminder" | "cancellation" | "manual";

const msgSchema = z.string().trim().max(500);

const settingsSchema = z.object({
  enabled: z.boolean(),
  greeting: msgSchema,
  msgNewBooking: msgSchema,
  msgConfirmation: msgSchema,
  msgReminder: msgSchema,
  msgReminder2h: msgSchema,
  msgReschedule: msgSchema,
  msgCancellation: msgSchema,
  msgNoShow: msgSchema,
  msgThanks: msgSchema,
  msgReview: msgSchema,
  msgBirthday: msgSchema,
  msgComeback: msgSchema,
  msgPromotions: msgSchema,
  msgPaymentReceived: msgSchema,
  msgPaymentPending: msgSchema,
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

/**
 * Monta a mensagem completa que o sistema envia à cliente:
 * header de identificação + corpo do template + footer com link para o WA do profissional.
 */
export function buildFullSystemMessage(
  bodyTemplate: string,
  professional: { name: string; phone?: string | null },
  vars: Record<string, string>,
): string {
  const body = interpolate(bodyTemplate, vars);
  const header = `📱 *Mensagem automática*\n_${professional.name} · via SuaAgenda.Pro_\n\n`;

  let footer = "";
  if (professional.phone) {
    const digits = professional.phone.replace(/\D/g, "");
    const number = digits.startsWith("55") ? digits : `55${digits}`;
    const replyText = interpolate(
      "Olá {{profissional}}! Sou {{cliente_nome}} e recebi uma mensagem sobre {{servico}} em {{data}} às {{hora}}.",
      { ...vars, profissional: professional.name },
    );
    const waLink = `https://wa.me/${number}?text=${encodeURIComponent(replyText)}`;
    footer = `\n\n──────────────\n💬 *Falar com ${professional.name}:*\n${waLink}`;
  }

  return header + body + footer;
}

function mergeTemplates(saved: Record<string, string> | null): WhatsAppSettings {
  if (!saved) return DEFAULT_WA_SETTINGS;
  return {
    ...DEFAULT_WA_SETTINGS,
    ...Object.fromEntries(
      Object.entries(saved).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
    ),
  } as WhatsAppSettings;
}

// ── Server Functions ──────────────────────────────────────────

export const getWhatsAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WhatsAppSettings> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("whatsapp_enabled,whatsapp_greeting,whatsapp_msg_confirmation,whatsapp_msg_reminder,whatsapp_msg_cancellation,whatsapp_templates")
      .eq("id", context.userId)
      .maybeSingle();

    if (!data) return DEFAULT_WA_SETTINGS;

    // whatsapp_templates is the primary source; individual columns as fallback
    const templates = (data.whatsapp_templates as Record<string, string> | null) ?? {};
    const merged = mergeTemplates(templates);

    return {
      ...merged,
      enabled: data.whatsapp_enabled ?? false,
      greeting: data.whatsapp_greeting ?? merged.greeting,
      // Fallback to individual columns for the 3 legacy fields
      msgConfirmation: templates.msgConfirmation ?? data.whatsapp_msg_confirmation ?? merged.msgConfirmation,
      msgReminder: templates.msgReminder ?? data.whatsapp_msg_reminder ?? merged.msgReminder,
      msgCancellation: templates.msgCancellation ?? data.whatsapp_msg_cancellation ?? merged.msgCancellation,
    };
  });

export const saveWhatsAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }): Promise<WhatsAppSettings> => {
    const { enabled, greeting, ...templates } = data;
    const { error } = await context.supabase
      .from("profiles")
      .update({
        whatsapp_enabled: enabled,
        whatsapp_greeting: greeting || null,
        // Keep legacy columns in sync for the booking flow
        whatsapp_msg_confirmation: templates.msgConfirmation || null,
        whatsapp_msg_reminder: templates.msgReminder || null,
        whatsapp_msg_cancellation: templates.msgCancellation || null,
        // Store all templates as JSON
        whatsapp_templates: templates,
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
