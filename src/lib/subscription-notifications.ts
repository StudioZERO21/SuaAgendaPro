// ETAPA 6 — Notificações de assinatura
// Funções chamadas pelo cron diário da Edge Function

export type NotificationTarget = {
  userId: string;
  name: string;
  email: string;
  phone: string;        // ex: "5511999999999"
  daysRemaining: number;
};

export async function sendTrialWarningEmail(target: NotificationTarget): Promise<void> {
  // TODO (Etapa 6): usar Resend para enviar email
  // Assunto: "Seu Acesso Livre termina em {daysRemaining} dias"
  console.log("[notif] email trial warning →", target.email);
}

export async function sendTrialWarningWhatsApp(target: NotificationTarget): Promise<void> {
  // TODO (Etapa 6): usar template WhatsApp existente
  // Mensagem: "Último dia! Garanta seu acesso ao suaAgendaPro"
  console.log("[notif] whatsapp trial warning →", target.phone);
}

export async function sendTrialExpiredWhatsApp(target: Omit<NotificationTarget, "daysRemaining">): Promise<void> {
  // TODO (Etapa 6): mensagem de bloqueio com link /plano
  console.log("[notif] whatsapp trial expired →", target.phone);
}

export async function sendBillingWarningEmail(target: NotificationTarget): Promise<void> {
  // TODO (Etapa 6): "Sua fatura vence em {daysRemaining} dias"
  console.log("[notif] email billing warning →", target.email);
}

export async function sendBillingWarningWhatsApp(target: NotificationTarget): Promise<void> {
  // TODO (Etapa 6): "Fatura vence amanhã — pague via PIX"
  console.log("[notif] whatsapp billing warning →", target.phone);
}

export async function sendSuspendedWhatsApp(target: Omit<NotificationTarget, "daysRemaining">): Promise<void> {
  // TODO (Etapa 6): "Acesso suspenso — regularize para continuar"
  console.log("[notif] whatsapp suspended →", target.phone);
}
