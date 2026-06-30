// ETAPA 6 — Notificações de assinatura (sem PII em logs de produção)

export type NotificationTarget = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  daysRemaining: number;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "[redacted]";
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function sendTrialWarningEmail(target: NotificationTarget): Promise<void> {
  console.info("[notif] email trial warning", { userId: target.userId, email: maskEmail(target.email) });
}

export async function sendTrialWarningWhatsApp(target: NotificationTarget): Promise<void> {
  console.info("[notif] whatsapp trial warning", { userId: target.userId });
}

export async function sendTrialExpiredWhatsApp(target: Omit<NotificationTarget, "daysRemaining">): Promise<void> {
  console.info("[notif] whatsapp trial expired", { userId: target.userId });
}

export async function sendBillingWarningEmail(target: NotificationTarget): Promise<void> {
  console.info("[notif] email billing warning", { userId: target.userId, email: maskEmail(target.email) });
}

export async function sendBillingWarningWhatsApp(target: NotificationTarget): Promise<void> {
  console.info("[notif] whatsapp billing warning", { userId: target.userId });
}

export async function sendSuspendedWhatsApp(target: Omit<NotificationTarget, "daysRemaining">): Promise<void> {
  console.info("[notif] whatsapp suspended", { userId: target.userId });
}
