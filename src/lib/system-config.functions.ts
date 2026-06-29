import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

export type SystemConfig = {
  testModeActive: boolean;
  testModeExpiresAt: string | null;
  testSessionId: string;
  maintenanceModeActive: boolean;
  maintenanceEndsAt: string | null;
  maintenanceMessage: string;
  updatedAt: string;
  updatedBy: string | null;
};

function rowToConfig(data: Record<string, unknown>): SystemConfig {
  const now = Date.now();
  const testExpires = data.test_mode_expires_at as string | null;
  const maintExpires = data.maintenance_ends_at as string | null;
  return {
    testModeActive:        (data.test_mode_active as boolean) && (!testExpires || new Date(testExpires).getTime() > now),
    testModeExpiresAt:     testExpires,
    testSessionId:         data.test_session_id as string,
    maintenanceModeActive: (data.maintenance_mode_active as boolean) && (!maintExpires || new Date(maintExpires).getTime() > now),
    maintenanceEndsAt:     maintExpires,
    maintenanceMessage:    data.maintenance_message as string,
    updatedAt:             data.updated_at as string,
    updatedBy:             data.updated_by as string | null,
  };
}

export const getSystemConfig = createServerFn({ method: "GET" })
  .handler(async (): Promise<SystemConfig | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("system_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return null;
    return rowToConfig(data);
  });

export const getSystemConfigAdmin = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<SystemConfig | null> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("system_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !row) return null;
    return rowToConfig(row);
  });

export const setTestMode = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, active: z.boolean(), expiresAt: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { getSuperAuthEmail } = await import("@/lib/super-auth.server");
    const email = await getSuperAuthEmail(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.active) {
      // Get current test_session_id to wipe test data
      const { data: cfg } = await supabaseAdmin
        .from("system_config")
        .select("test_session_id")
        .eq("id", 1)
        .single();

      if (cfg?.test_session_id) {
        const sid = cfg.test_session_id;
        await Promise.all([
          supabaseAdmin.from("appointments").delete().eq("_test_sid", sid),
          supabaseAdmin.from("clients").delete().eq("_test_sid", sid),
          supabaseAdmin.from("services").delete().eq("_test_sid", sid),
        ]);
      }

      const { error } = await supabaseAdmin
        .from("system_config")
        .update({
          test_mode_active:     false,
          test_mode_expires_at: null,
          test_session_id:      crypto.randomUUID(),
          updated_at:           new Date().toISOString(),
          updated_by:           email,
        })
        .eq("id", 1);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("system_config")
        .update({
          test_mode_active:     true,
          test_mode_expires_at: data.expiresAt ?? null,
          test_session_id:      crypto.randomUUID(),
          updated_at:           new Date().toISOString(),
          updated_by:           email,
        })
        .eq("id", 1);
      if (error) throw new Error(error.message);
    }
  });

export const setMaintenanceMode = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      active:  z.boolean(),
      endsAt:  z.string().optional(),
      message: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { getSuperAuthEmail } = await import("@/lib/super-auth.server");
    const email = await getSuperAuthEmail(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const update: Record<string, unknown> = {
      maintenance_mode_active: data.active,
      updated_at:              new Date().toISOString(),
      updated_by:              email,
    };
    if (!data.active) {
      update.maintenance_ends_at = null;
    } else {
      if (data.endsAt)  update.maintenance_ends_at  = data.endsAt;
      if (data.message) update.maintenance_message   = data.message;
    }

    const { error } = await supabaseAdmin
      .from("system_config")
      .update(update)
      .eq("id", 1);
    if (error) throw new Error(error.message);
  });
