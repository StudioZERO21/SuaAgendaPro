import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

export type AuditLogEntry = {
  id: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>;
  performed_at: string;
};

export type BillingEventEntry = {
  id: string;
  event_type: string;
  asaas_payment_id: string | null;
  asaas_event_id: string | null;
  amount_cents: number | null;
  created_at: string;
  subscriptions?: { user_id: string } | null;
};

export type SystemLogEntry =
  | ({ _source: "admin" } & AuditLogEntry)
  | ({ _source: "billing" } & BillingEventEntry);

const _st = z.string().optional();

export const getAuditLog = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      _st,
      limit:  z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
      userId: z.string().uuid().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ entries: AuditLogEntry[]; total: number }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;

    let q = db
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("performed_at", { ascending: false })
      .limit(data.limit ?? 50)
      .range(data.offset ?? 0, (data.offset ?? 0) + (data.limit ?? 50) - 1);

    if (data.userId) q = q.eq("target_user_id", data.userId);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { entries: (rows ?? []) as AuditLogEntry[], total: count ?? 0 };
  });

export const logAdminAction = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      action:          z.string().min(1),
      targetUserId:    z.string().uuid().optional(),
      targetUserEmail: z.string().optional(),
      details:         z.record(z.unknown()).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    await db.from("admin_audit_log").insert({
      action:            data.action,
      target_user_id:    data.targetUserId    ?? null,
      target_user_email: data.targetUserEmail ?? null,
      details:           data.details         ?? {},
    });
  });

export const getSystemLogs = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<{ admin: AuditLogEntry[]; billing: BillingEventEntry[] }> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [adminRes, billingRes] = await Promise.all([
      db.from("admin_audit_log").select("*").order("performed_at", { ascending: false }).limit(100),
      supabaseAdmin.from("billing_events").select("id, event_type, asaas_payment_id, asaas_event_id, amount_cents, created_at").order("created_at", { ascending: false }).limit(200),
    ]);

    return {
      admin:   (adminRes.data   ?? []) as AuditLogEntry[],
      billing: (billingRes.data ?? []) as BillingEventEntry[],
    };
  });
