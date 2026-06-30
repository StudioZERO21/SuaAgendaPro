import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const EVENTS = ["login_success", "login_failed", "session_kicked", "logout"] as const;

// Registra evento de atividade. Rate-limited; não armazena IP (LGPD).
export const recordActivity = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      event:          z.enum(EVENTS),
      email:          z.string().email().optional(),
      professionalId: z.string().uuid().optional(),
      meta:           z.record(z.any()).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const { enforceRateLimit, clientIpFromRequest } = await import(
        "@/lib/rate-limit.server",
      );
      const req = getRequest();
      await enforceRateLimit(
        `activity:${clientIpFromRequest(req)}`,
        30,
        3600,
      );

      const ua = req?.headers.get("user-agent") ?? "";

      const { recordActivityVps, parseUserAgent } = await import("@/lib/activity-log.server");
      const { browser, os, device } = parseUserAgent(ua);
      await recordActivityVps({
        event:          data.event,
        email:          data.email ?? null,
        professionalId: data.professionalId ?? null,
        browser, os, device,
        meta:           data.meta ?? null,
      });
    } catch (e) {
      console.error("[activity] falha ao registrar:", e);
    }
    return { ok: true };
  });

// Lê os logs (super admin).
export const getProfessionalActivity = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({
      _st:            z.string().optional(),
      professionalId: z.string().uuid().optional(),
      email:          z.string().optional(),
      event:          z.string().optional(),
      limit:          z.number().int().min(1).max(1000).optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { queryActivityVps } = await import("@/lib/activity-log.server");
    return queryActivityVps({
      professionalId: data.professionalId ?? null,
      email:          data.email ?? null,
      event:          (data.event && data.event !== "todos") ? data.event : null,
      limit:          data.limit ?? 200,
    });
  });
