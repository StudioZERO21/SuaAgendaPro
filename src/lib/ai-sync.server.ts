// Sincronização Supabase → PostgreSQL VPS (banco isolado para IA)
// Agrega e anonimiza dados — nunca copia PII (nomes, telefones, e-mails)

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

// ─── Tipos intermediários ─────────────────────────────────────────────────────

type SyncStats = {
  appointmentPatterns: number;
  serviceStats:        number;
  professionals:       number;
  reviews:             number;
  durationMs:          number;
  syncedAt:            string;
  errors:              string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: string): string {
  return d.slice(0, 10); // "2025-06-27"
}

function monthYear(d: string): { month: number; year: number } {
  const dt = new Date(d);
  return { month: dt.getMonth() + 1, year: dt.getFullYear() };
}

// ─── Core sync ────────────────────────────────────────────────────────────────

export async function runAiSync(): Promise<SyncStats> {
  const t0     = Date.now();
  const errors: string[] = [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { getVpsDb }      = await import("@/lib/db-vps.server");
  const { cacheGet, cacheSet } = await import("@/lib/redis.server");
  const sql = getVpsDb();

  const stats: SyncStats = {
    appointmentPatterns: 0,
    serviceStats:        0,
    professionals:       0,
    reviews:             0,
    durationMs:          0,
    syncedAt:            new Date().toISOString(),
    errors,
  };

  // ── 1. Agendamentos → ai_appointment_patterns ────────────────────────────
  try {
    // Busca todos os agendamentos finalizados (paginado em blocos de 1000)
    type Appt = { professional_id: string; service_id: string; scheduled_at: string; price_cents: number; status: string };
    const allAppts: Appt[] = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from("appointments")
        .select("professional_id, service_id, scheduled_at, price_cents, status")
        .in("status", ["confirmed", "completed", "done"])
        .range(page * 1000, page * 1000 + 999);
      if (error) { errors.push("appointments: " + error.message); break; }
      if (!data?.length) break;
      allAppts.push(...(data as Appt[]));
      if (data.length < 1000) break;
      page++;
    }

    // Agrega por (professional_id, service_id, day_of_week, hour_of_day, month, year)
    const patternMap = new Map<string, { count: number; totalPrice: number }>();
    for (const a of allAppts) {
      const dt  = new Date(a.scheduled_at);
      const key = [
        a.professional_id, a.service_id,
        dt.getDay(), dt.getHours(),
        dt.getMonth() + 1, dt.getFullYear(),
      ].join("|");
      const cur = patternMap.get(key) ?? { count: 0, totalPrice: 0 };
      cur.count++;
      cur.totalPrice += a.price_cents ?? 0;
      patternMap.set(key, cur);
    }

    // UPSERT em lotes de 100
    const patterns = [...patternMap.entries()].map(([k, v]) => {
      const [professional_id, service_id, dow, hod, mon, yr] = k.split("|");
      return {
        professional_id, service_id,
        day_of_week:    Number(dow),
        hour_of_day:    Number(hod),
        month:          Number(mon),
        year:           Number(yr),
        count:          v.count,
        avg_price_cents: Math.round(v.totalPrice / v.count),
        updated_at:     new Date().toISOString(),
      };
    });

    for (let i = 0; i < patterns.length; i += 100) {
      const batch = patterns.slice(i, i + 100);
      await sql`
        INSERT INTO ai_appointment_patterns
          ${sql(batch, "professional_id","service_id","day_of_week","hour_of_day","month","year","count","avg_price_cents","updated_at")}
        ON CONFLICT (professional_id, service_id, day_of_week, hour_of_day, month, year)
        DO UPDATE SET
          count           = EXCLUDED.count,
          avg_price_cents = EXCLUDED.avg_price_cents,
          updated_at      = EXCLUDED.updated_at
      `;
    }
    stats.appointmentPatterns = patterns.length;
  } catch (e: any) {
    errors.push("appointment_patterns: " + e.message);
  }

  // ── 2. Serviços → ai_service_stats ──────────────────────────────────────
  try {
    const { data: services } = await supabaseAdmin
      .from("services")
      .select("id, professional_id, name, category, duration_minutes, price_cents");

    const { data: apptCounts } = await supabaseAdmin
      .from("appointments")
      .select("service_id, scheduled_at, price_cents")
      .in("status", ["confirmed", "completed", "done"]);

    const { data: reviewRows } = await supabaseAdmin
      .from("reviews")
      .select("professional_id, rating")
      .eq("is_public", true);

    // Avg rating por professional_id
    const ratingMap = new Map<string, { sum: number; count: number }>();
    for (const r of reviewRows ?? []) {
      const cur = ratingMap.get(r.professional_id) ?? { sum: 0, count: 0 };
      cur.sum += r.rating;
      cur.count++;
      ratingMap.set(r.professional_id, cur);
    }

    // Count agendamentos por (service_id, month, year)
    type CountKey = string;
    const countMap = new Map<CountKey, number>();
    for (const a of apptCounts ?? []) {
      if (!a.service_id) continue;
      const { month, year } = monthYear(a.scheduled_at);
      const key = `${a.service_id}|${month}|${year}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    const now = new Date();
    const serviceRows: any[] = [];
    for (const svc of services ?? []) {
      // Inclui os últimos 12 meses com pelo menos 1 booking
      const keysForSvc = [...countMap.keys()].filter(k => k.startsWith(svc.id + "|"));
      if (!keysForSvc.length) {
        // Mês atual com 0 bookings (para manter o serviço visível para a IA)
        serviceRows.push({
          professional_id: svc.professional_id,
          service_id:      svc.id,
          service_name:    svc.name,
          category:        svc.category ?? null,
          duration_min:    svc.duration_minutes,
          total_bookings:  0,
          avg_rating:      null,
          price_cents:     svc.price_cents,
          period_month:    now.getMonth() + 1,
          period_year:     now.getFullYear(),
          updated_at:      now.toISOString(),
        });
        continue;
      }
      const profRating = ratingMap.get(svc.professional_id);
      const avgRating  = profRating ? (profRating.sum / profRating.count).toFixed(2) : null;
      for (const key of keysForSvc) {
        const [, mon, yr] = key.split("|");
        serviceRows.push({
          professional_id: svc.professional_id,
          service_id:      svc.id,
          service_name:    svc.name,
          category:        svc.category ?? null,
          duration_min:    svc.duration_minutes,
          total_bookings:  countMap.get(key) ?? 0,
          avg_rating:      avgRating,
          price_cents:     svc.price_cents,
          period_month:    Number(mon),
          period_year:     Number(yr),
          updated_at:      now.toISOString(),
        });
      }
    }

    for (let i = 0; i < serviceRows.length; i += 100) {
      const batch = serviceRows.slice(i, i + 100);
      await sql`
        INSERT INTO ai_service_stats
          ${sql(batch, "professional_id","service_id","service_name","category","duration_min","total_bookings","avg_rating","price_cents","period_month","period_year","updated_at")}
        ON CONFLICT (service_id, period_month, period_year)
        DO UPDATE SET
          total_bookings = EXCLUDED.total_bookings,
          avg_rating     = EXCLUDED.avg_rating,
          price_cents    = EXCLUDED.price_cents,
          updated_at     = EXCLUDED.updated_at
      `;
    }
    stats.serviceStats = serviceRows.length;
  } catch (e: any) {
    errors.push("service_stats: " + e.message);
  }

  // ── 3. Profissionais → ai_professional_summary ───────────────────────────
  try {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_id, status, profiles!inner(id, specialty, city, state)");

    const { data: clientCounts } = await supabaseAdmin
      .from("clients")
      .select("professional_id");

    const { data: apptAll } = await supabaseAdmin
      .from("appointments")
      .select("professional_id")
      .in("status", ["confirmed", "completed", "done"]);

    const { data: reviewAll } = await supabaseAdmin
      .from("reviews")
      .select("professional_id, rating")
      .eq("is_public", true);

    const { data: svcActive } = await supabaseAdmin
      .from("services")
      .select("professional_id")
      .eq("is_active", true);

    // Contadores por professional_id
    const clientMap  = new Map<string, number>();
    const apptMap    = new Map<string, number>();
    const ratingMap2 = new Map<string, { sum: number; count: number }>();
    const svcMap     = new Map<string, number>();

    for (const c of clientCounts ?? []) clientMap.set(c.professional_id, (clientMap.get(c.professional_id) ?? 0) + 1);
    for (const a of apptAll    ?? []) apptMap.set(a.professional_id,  (apptMap.get(a.professional_id)  ?? 0) + 1);
    for (const s of svcActive  ?? []) svcMap.set(s.professional_id,   (svcMap.get(s.professional_id)   ?? 0) + 1);
    for (const r of reviewAll  ?? []) {
      const cur = ratingMap2.get(r.professional_id) ?? { sum: 0, count: 0 };
      cur.sum += r.rating; cur.count++;
      ratingMap2.set(r.professional_id, cur);
    }

    const profRows = (subs ?? []).map((s: any) => {
      const p   = s.profiles as any;
      const rat = ratingMap2.get(p?.id);
      return {
        professional_id: p?.id,
        specialty:       p?.specialty    ?? null,
        city:            p?.city         ?? null,
        state:           p?.state        ?? null,
        total_clients:   clientMap.get(p?.id)  ?? 0,
        total_bookings:  apptMap.get(p?.id)    ?? 0,
        avg_rating:      rat ? (rat.sum / rat.count).toFixed(2) : null,
        active_services: svcMap.get(p?.id)     ?? 0,
        plan_id:         s.plan_id,
        updated_at:      new Date().toISOString(),
      };
    }).filter(r => r.professional_id);

    for (let i = 0; i < profRows.length; i += 100) {
      const batch = profRows.slice(i, i + 100);
      await sql`
        INSERT INTO ai_professional_summary
          ${sql(batch, "professional_id","specialty","city","state","total_clients","total_bookings","avg_rating","active_services","plan_id","updated_at")}
        ON CONFLICT (professional_id)
        DO UPDATE SET
          specialty       = EXCLUDED.specialty,
          city            = EXCLUDED.city,
          state           = EXCLUDED.state,
          total_clients   = EXCLUDED.total_clients,
          total_bookings  = EXCLUDED.total_bookings,
          avg_rating      = EXCLUDED.avg_rating,
          active_services = EXCLUDED.active_services,
          plan_id         = EXCLUDED.plan_id,
          updated_at      = EXCLUDED.updated_at
      `;
    }
    stats.professionals = profRows.length;
  } catch (e: any) {
    errors.push("professional_summary: " + e.message);
  }

  // ── 4. Avaliações → ai_reviews_anonymized (apenas novas) ────────────────
  try {
    const lastReviewSync = await cacheGet<string>("ai:sync:last_review_date");
    const since = lastReviewSync ?? "2020-01-01";

    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("professional_id, service_id, rating, message, created_at")
      .eq("is_public", true)
      .gt("created_at", since)
      .order("created_at", { ascending: true });

    if (reviews?.length) {
      const rows = reviews.map(r => ({
        professional_id: r.professional_id,
        service_id:      (r as any).service_id ?? null,
        rating:          r.rating,
        has_text:        Boolean((r as any).message?.trim()),
        created_at:      isoDate(r.created_at), // só a data, sem hora
      }));

      for (let i = 0; i < rows.length; i += 100) {
        await sql`
          INSERT INTO ai_reviews_anonymized
            ${sql(rows.slice(i, i + 100), "professional_id","service_id","rating","has_text","created_at")}
          ON CONFLICT DO NOTHING
        `;
      }

      // Avança o cursor da última sincronização
      const lastDate = reviews[reviews.length - 1].created_at;
      await cacheSet("ai:sync:last_review_date", lastDate, 365 * 24 * 3600);
      stats.reviews = rows.length;
    }
  } catch (e: any) {
    errors.push("reviews_anonymized: " + e.message);
  }

  // ── Salva metadados do sync no Redis ────────────────────────────────────
  stats.durationMs = Date.now() - t0;
  await cacheSet("ai:sync:last_run", stats, 365 * 24 * 3600);

  return stats;
}

// ─── Server Function (super admin manual) ────────────────────────────────────

export const triggerAiSync = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<SyncStats> => {
    await requireSuperAuth(data._st);
    return runAiSync();
  });

export const getLastAiSyncStats = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st: z.string() }).parse(input))
  .handler(async ({ data }): Promise<SyncStats | null> => {
    await requireSuperAuth(data._st);
    const { cacheGet } = await import("@/lib/redis.server");
    return cacheGet<SyncStats>("ai:sync:last_run");
  });
