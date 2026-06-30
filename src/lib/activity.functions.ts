import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const EVENTS = ["login_success", "login_failed", "session_kicked", "logout"] as const;

// Registra um evento de atividade. Público (login_failed acontece deslogado).
// Captura IP/user-agent no servidor; nunca confia em PII vinda do client além do email.
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
      const req = getRequest();
      const ip = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? req?.headers.get("x-real-ip") ?? null;
      const ua = req?.headers.get("user-agent") ?? null;

      const { recordActivityVps } = await import("@/lib/activity-log.server");
      await recordActivityVps({
        event:          data.event,
        email:          data.email ?? null,
        professionalId: data.professionalId ?? null,
        ip,
        userAgent:      ua,
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
