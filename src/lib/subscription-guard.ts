export type SubscriptionStatus =
  | "trial"
  | "active"
  | "overdue"
  | "suspended"
  | "cancelled"
  | "especial";

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  planId: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
};

export function isBlocked(info: SubscriptionInfo | null | undefined): boolean {
  if (!info) return false;
  if (info.status === "suspended" || info.status === "cancelled") return true;
  if (info.status === "overdue") return true;
  if (info.status === "trial" && info.trialEndsAt) {
    return new Date(info.trialEndsAt) < new Date();
  }
  return false;
}

export function getDaysRemaining(endsAt: string | null | undefined): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getBlockReason(info: SubscriptionInfo | null | undefined): string {
  if (!info) return "";
  if (info.status === "trial" && isBlocked(info)) return "trial_expired";
  if (info.status === "suspended" || info.status === "overdue") return "payment_overdue";
  if (info.status === "cancelled") return "cancelled";
  return "";
}

// Paths que não exigem assinatura ativa
const SUBSCRIPTION_FREE_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/contato",
  "/recursos",
  "/precos",
  "/reset-password",
  "/plano",
];

export function requiresSubscription(pathname: string): boolean {
  if (SUBSCRIPTION_FREE_PATHS.includes(pathname)) return false;
  if (pathname.startsWith("/agendar/")) return false;
  if (pathname.startsWith("/perfil-publico")) return false;
  if (pathname.startsWith("/super/")) return false;
  if (pathname.startsWith("/api/")) return false;
  return true;
}
