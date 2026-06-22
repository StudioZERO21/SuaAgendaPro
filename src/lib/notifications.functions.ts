import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationType =
  | "agendamento"
  | "cancelamento"
  | "pagamento"
  | "avaliacao"
  | "lembrete"
  | "sistema";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  appointmentId?: string | null;
};

type DbRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
};

const DB_TYPE_MAP: Record<string, NotificationType> = {
  new_appointment:        "agendamento",
  appointment_confirmed:  "agendamento",
  appointment_cancelled:  "cancelamento",
  appointment_reminder:   "lembrete",
  payment_received:       "pagamento",
  payment_pending:        "pagamento",
  system:                 "sistema",
};

function toApp(row: DbRow): AppNotification {
  return {
    id:            row.id,
    type:          DB_TYPE_MAP[row.type] ?? "sistema",
    title:         row.title,
    message:       row.body,
    createdAt:     row.created_at,
    read:          row.is_read,
    appointmentId: row.appointment_id,
  };
}

// ── Server Functions ──────────────────────────────────────────

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppNotification[]> => {
    const { data } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, is_read, created_at, appointment_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(60);

    return (data ?? []).map((r) => toApp(r as unknown as DbRow));
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { id: string };
    if (typeof i?.id !== "string") throw new Error("ID inválido");
    return i;
  })
  .handler(async ({ data, context }): Promise<void> => {
    await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<void> => {
    await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { id: string };
    if (typeof i?.id !== "string") throw new Error("ID inválido");
    return i;
  })
  .handler(async ({ data, context }): Promise<void> => {
    await context.supabase
      .from("notifications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
  });

export const clearAllNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<void> => {
    await context.supabase
      .from("notifications")
      .delete()
      .eq("user_id", context.userId);
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { endpoint: string; p256dh: string; auth: string };
    if (!i?.endpoint || !i?.p256dh || !i?.auth) throw new Error("Subscription inválida");
    return i;
  })
  .handler(async ({ data, context }): Promise<void> => {
    await context.supabase.from("push_subscriptions").upsert(
      { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
      { onConflict: "user_id,endpoint" },
    );
  });
