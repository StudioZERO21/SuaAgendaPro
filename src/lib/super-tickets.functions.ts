import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

const _st = z.string().optional();

const RESPONSE_SLA_H  = 8;
const RESOLUTION_SLA_H = 24;

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketNote = {
  id:            string;
  at:            string;  // ISO timestamp
  type:          "note" | "status" | "priority";
  content:       string;
  statusFrom?:   string;
  statusTo?:     string;
  priorityFrom?: string;
  priorityTo?:   string;
};

export type SupportTicket = {
  id:               string;
  userId:           string;
  userEmail:        string;
  userName:         string;
  subject:          string;
  description:      string;
  category:         string;
  occurredAt:       string;
  status:           string;
  priority:         string;
  attachments:      string[];
  notes:            TicketNote[];
  assignedTo:       string | null;
  firstResponseAt:  string | null;
  resolvedAt:       string | null;
  closedAt:         string | null;
  createdAt:        string;
  updatedAt:        string;
  responseElapsedH: number;
  slaStatus:        "ok" | "warning" | "breached";
};

export type TicketStats = {
  total:            number;
  open:             number;
  inProgress:       number;
  waitingUser:      number;
  resolved:         number;
  closed:           number;
  slaBreached:      number;
  avgResponseH:     number;
  avgResolutionH:   number;
  byDay:            { date: string; abertos: number; resolvidos: number }[];
  byCategory:       { category: string; count: number }[];
  byStatus:         { status: string; count: number }[];
  thisMonth: {
    total:        number;
    resolved:     number;
    avgResponseH: number;
    slaBreached:  number;
    openRate:     number;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slaStatus(createdAt: string, firstResponseAt: string | null, status: string): "ok" | "warning" | "breached" {
  if (firstResponseAt || status === "resolved" || status === "closed") return "ok";
  const elapsedH = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (elapsedH > RESPONSE_SLA_H) return "breached";
  if (elapsedH > RESPONSE_SLA_H * 0.7) return "warning";
  return "ok";
}

function makeNote(type: TicketNote["type"], content: string, extra?: Partial<TicketNote>): TicketNote {
  return {
    id:      crypto.randomUUID(),
    at:      new Date().toISOString(),
    type,
    content,
    ...extra,
  };
}

const STATUS_LABEL: Record<string, string> = {
  open:         "Aberto",
  in_progress:  "Em atendimento",
  waiting_user: "Aguardando usuário",
  resolved:     "Resolvido",
  closed:       "Encerrado",
};

const PRIORITY_LABEL: Record<string, string> = {
  low:      "Baixa",
  medium:   "Média",
  high:     "Alta",
  critical: "Crítico",
};

// ─── List tickets ─────────────────────────────────────────────────────────────

export const getSuperTickets = createServerFn({ method: "GET" })
  .validator((i: unknown) =>
    z.object({ _st, status: z.string().optional(), limit: z.number().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data }): Promise<SupportTicket[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    let q = db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 300);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = [...new Set<string>((rows ?? []).map((r: any) => r.user_id))];
    const emailMap: Record<string, string> = {};
    const nameMap:  Record<string, string> = {};

    await Promise.all(
      userIds.map(async (uid) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (user) emailMap[uid] = user.email ?? "";
      }),
    );

    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", userIds);
    for (const p of profiles ?? []) nameMap[p.id] = p.display_name ?? "";

    return (rows ?? []).map((r: any) => ({
      id:               r.id,
      userId:           r.user_id,
      userEmail:        emailMap[r.user_id] ?? "",
      userName:         nameMap[r.user_id]  ?? "",
      subject:          r.subject,
      description:      r.description,
      category:         r.category,
      occurredAt:       r.occurred_at,
      status:           r.status,
      priority:         r.priority,
      attachments:      r.attachments ?? [],
      notes:            Array.isArray(r.notes) ? r.notes : [],
      assignedTo:       r.assigned_to  ?? null,
      firstResponseAt:  r.first_response_at ?? null,
      resolvedAt:       r.resolved_at  ?? null,
      closedAt:         r.closed_at    ?? null,
      createdAt:        r.created_at,
      updatedAt:        r.updated_at,
      responseElapsedH: r.first_response_at
        ? (new Date(r.first_response_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000
        : (Date.now() - new Date(r.created_at).getTime()) / 3_600_000,
      slaStatus:        slaStatus(r.created_at, r.first_response_at, r.status),
    }));
  });

// ─── Update ticket (append to notes, never replace) ──────────────────────────

export const updateSuperTicket = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({
      _st,
      id:          z.string().uuid(),
      status:      z.string().optional(),
      priority:    z.string().optional(),
      noteContent: z.string().optional(),  // free-text note to append
    }).parse(i),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    // Fetch current state to know prev values and existing notes
    const { data: existing, error: fetchErr } = await db
      .from("support_tickets")
      .select("status, priority, first_response_at, notes")
      .eq("id", data.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const existingNotes: TicketNote[] = Array.isArray(existing.notes) ? existing.notes : [];
    const newNotes: TicketNote[] = [];

    const upd: Record<string, unknown> = {};

    // Status change
    if (data.status && data.status !== existing.status) {
      upd.status = data.status;
      newNotes.push(makeNote("status",
        `Status alterado de "${STATUS_LABEL[existing.status] ?? existing.status}" para "${STATUS_LABEL[data.status] ?? data.status}"`,
        { statusFrom: existing.status, statusTo: data.status },
      ));
      if (!existing.first_response_at && (data.status === "in_progress" || data.status === "waiting_user")) {
        upd.first_response_at = new Date().toISOString();
      }
      if (data.status === "resolved") upd.resolved_at = new Date().toISOString();
      if (data.status === "closed")   upd.closed_at   = new Date().toISOString();
    }

    // Priority change
    if (data.priority && data.priority !== existing.priority) {
      upd.priority = data.priority;
      newNotes.push(makeNote("priority",
        `Prioridade alterada de "${PRIORITY_LABEL[existing.priority] ?? existing.priority}" para "${PRIORITY_LABEL[data.priority] ?? data.priority}"`,
        { priorityFrom: existing.priority, priorityTo: data.priority },
      ));
    }

    // Manual note
    if (data.noteContent?.trim()) {
      newNotes.push(makeNote("note", data.noteContent.trim()));
    }

    if (newNotes.length > 0) {
      upd.notes = [...existingNotes, ...newNotes];
    }

    if (Object.keys(upd).length === 0) return;

    const { error } = await db.from("support_tickets").update(upd).eq("id", data.id);
    if (error) throw new Error(error.message);

    return { notes: upd.notes ?? existingNotes };
  });

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getTicketStats = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ _st }).parse(i ?? {}))
  .handler(async ({ data }): Promise<TicketStats> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { data: rows } = await db
      .from("support_tickets")
      .select("status, category, priority, created_at, first_response_at, resolved_at, closed_at");
    const all: any[] = rows ?? [];

    const now        = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRows = all.filter((r) => new Date(r.created_at) >= startMonth);

    const counts    = all.reduce((a: any, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {} as Record<string, number>);
    const catCounts = all.reduce((a: any, r) => { a[r.category] = (a[r.category] ?? 0) + 1; return a; }, {} as Record<string, number>);

    const respTimes = all.filter((r) => r.first_response_at)
      .map((r) => (new Date(r.first_response_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000);
    const resoTimes = all.filter((r) => r.resolved_at ?? r.closed_at)
      .map((r) => (new Date(r.resolved_at ?? r.closed_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000);

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const isClosed = (r: any) => r.status === "resolved" || r.status === "closed";
    const slaBreachedAll = all.filter((r) =>
      !r.first_response_at && !isClosed(r) &&
      (Date.now() - new Date(r.created_at).getTime()) / 3_600_000 > RESPONSE_SLA_H,
    ).length;

    const byDay: Record<string, { abertos: number; resolvidos: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      byDay[d.toISOString().slice(0, 10)] = { abertos: 0, resolvidos: 0 };
    }
    for (const r of all) {
      const day = r.created_at.slice(0, 10);
      // Só conta como "aberto" se ainda não foi resolvido/encerrado
      const finalDate = r.resolved_at ?? r.closed_at;
      if (!finalDate && byDay[day]) byDay[day].abertos++;
      if (finalDate) {
        const rd = finalDate.slice(0, 10);
        if (byDay[rd]) byDay[rd].resolvidos++;
        // Se criado em dia diferente do fechamento, nenhuma barra "aberto" naquele dia de criação
      }
    }

    const monthRespTimes = thisMonthRows.filter((r) => r.first_response_at)
      .map((r) => (new Date(r.first_response_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000);
    const monthBreached = thisMonthRows.filter((r) =>
      !r.first_response_at && !isClosed(r) &&
      (Date.now() - new Date(r.created_at).getTime()) / 3_600_000 > RESPONSE_SLA_H,
    ).length;
    const monthResolved = thisMonthRows.filter((r) => r.status === "resolved" || r.status === "closed").length;

    return {
      total:          all.length,
      open:           counts["open"]         ?? 0,
      inProgress:     counts["in_progress"]  ?? 0,
      waitingUser:    counts["waiting_user"] ?? 0,
      resolved:       counts["resolved"]     ?? 0,
      closed:         counts["closed"]       ?? 0,
      slaBreached:    slaBreachedAll,
      avgResponseH:   avg(respTimes),
      avgResolutionH: avg(resoTimes),
      byDay:          Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      byCategory:     Object.entries(catCounts).map(([category, count]) => ({ category, count: count as number })),
      byStatus:       Object.entries(counts).map(([status, count]) => ({ status, count: count as number })),
      thisMonth: {
        total:        thisMonthRows.length,
        resolved:     monthResolved,
        avgResponseH: avg(monthRespTimes),
        slaBreached:  monthBreached,
        openRate:     thisMonthRows.length > 0 ? Math.round((monthResolved / thisMonthRows.length) * 100) : 0,
      },
    };
  });
