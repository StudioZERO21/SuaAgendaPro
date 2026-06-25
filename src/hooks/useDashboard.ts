import { useMemo } from "react";
import { useAgendamentos } from "./useAgendamentos";
import { useClientes } from "./useClientes";
import { useServices } from "./useServicos";
import type { UIClient } from "./useClientes";
import type { Service } from "@/integrations/supabase/types";

// ── Types ─────────────────────────────────────────────────────

export type ChartPoint  = { day: string; value: number };
export type TopService  = { name: string; count: number; revenueCents: number };
export type PeakCell    = { day: string; slot: string; count: number };
export type UpcomingItem = { id: string; time: string; client: string; service: string };

export type DashboardData = {
  // KPIs (current month)
  revenueCents:       number;
  lastRevenueCents:   number;
  apptCount:          number;
  lastApptCount:      number;
  newClients:         number;
  occupancyPct:       number;   // slots booked / total working slots in month

  // Chart (value = receita em centavos por dia)
  chart7:  ChartPoint[];
  chart14: ChartPoint[];
  chart30: ChartPoint[];

  ticketMedioCents: number;

  // Upcoming today
  upcoming: UpcomingItem[];

  // Rankings
  topServices:   TopService[];
  topClients:    UIClient[];

  // Heatmap
  peakMatrix:    number[][];   // 6 rows (slots) × 6 cols (Mon–Sat), 0–10
  peakTop:       PeakCell[];
};

// ── Constants ─────────────────────────────────────────────────

const PEAK_DAYS  = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PEAK_SLOTS = ["09h", "11h", "13h", "15h", "17h", "19h"];
const SLOT_HOURS = [9, 11, 13, 15, 17, 19];
// day_of_week (0=Sun) → column index in heatmap (Mon–Sat only)
const DOW_TO_COL: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pctDelta(current: number, prev: number): { delta: string; up: boolean } {
  if (prev === 0) return current > 0 ? { delta: "+∞", up: true } : { delta: "—", up: true };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { delta: `${pct >= 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
}

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard() {
  const { data: appts   = [], isLoading: loadingA } = useAgendamentos();
  const { data: clients = [], isLoading: loadingC } = useClientes();
  const { data: services = [] }                      = useServices();

  const isLoading = loadingA || loadingC;

  const data = useMemo<DashboardData>(() => {
    const now       = new Date();
    const thisYear  = now.getFullYear();
    const thisMonth = now.getMonth();         // 0-indexed
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;
    const todayStr  = dateStr(now);

    const serviceMap = new Map<string, Service>(services.map((s) => [s.id, s]));
    const clientMap  = new Map<string, UIClient>(clients.map((c) => [c.id, c]));

    // ── Split by month ────────────────────────────────────────
    const thisMonthAppts = appts.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });
    const lastMonthAppts = appts.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    // ── KPIs ─────────────────────────────────────────────────
    const nonCancelled = (arr: typeof appts) => arr.filter((a) => a.status !== "cancelado");
    const completed    = (arr: typeof appts) => arr.filter((a) => a.status === "concluido");

    // Faturamento = apenas serviços concluídos (efetivamente pagos)
    const revenueCents     = completed(thisMonthAppts).reduce((s, a) => s + a.priceCents, 0);
    const lastRevenueCents = completed(lastMonthAppts).reduce((s, a) => s + a.priceCents, 0);
    const apptCount        = nonCancelled(thisMonthAppts).length;
    const lastApptCount    = nonCancelled(lastMonthAppts).length;

    const newClients = clients.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    }).length;

    // Occupancy: rough estimate — booked slots / (working days × avg 8 slots/day)
    const workDaysThisMonth = thisMonthAppts.length > 0
      ? new Set(thisMonthAppts.map((a) => a.date)).size
      : 0;
    const occupancyPct = workDaysThisMonth > 0
      ? Math.min(100, Math.round((apptCount / (workDaysThisMonth * 8)) * 100))
      : 0;

    // ── Upcoming today ────────────────────────────────────────
    const upcoming: UpcomingItem[] = appts
      .filter((a) => a.date === todayStr && (a.status === "pendente" || a.status === "confirmado"))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5)
      .map((a) => ({
        id:      a.id,
        time:    a.start,
        client:  clientMap.get(a.clientId)?.name  ?? "—",
        service: serviceMap.get(a.serviceId)?.name ?? "—",
      }));

    // ── Chart data ────────────────────────────────────────────
    function getChartData(days: number): ChartPoint[] {
      return Array.from({ length: days }, (_, i) => {
        const d  = new Date(now);
        d.setDate(now.getDate() - (days - 1 - i));
        const ds = dateStr(d);
        const label = i === days - 1
          ? "Hoje"
          : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);
        const revenue = appts
          .filter((a) => a.date === ds && a.status === "concluido")
          .reduce((s, a) => s + a.priceCents, 0);
        return { day: label, value: revenue };
      });
    }

    // ── Top services (this month) ─────────────────────────────
    const svcAgg: Record<string, { count: number; revenueCents: number }> = {};
    nonCancelled(thisMonthAppts).forEach((a) => {
      if (!svcAgg[a.serviceId]) svcAgg[a.serviceId] = { count: 0, revenueCents: 0 };
      svcAgg[a.serviceId].count++;
      if (a.status === "concluido") svcAgg[a.serviceId].revenueCents += a.priceCents;
    });
    const topServices: TopService[] = Object.entries(svcAgg)
      .map(([id, v]) => ({ name: serviceMap.get(id)?.name ?? "—", ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // ── Top clients (all time) ────────────────────────────────
    const topClients: UIClient[] = [...clients]
      .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
      .slice(0, 4);

    // ── Heatmap (all time) ────────────────────────────────────
    const raw: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
    appts.forEach((a) => {
      if (a.status === "cancelado") return;
      const dow    = new Date(a.date + "T00:00:00").getDay();
      const colIdx = DOW_TO_COL[dow];
      if (colIdx === undefined) return;
      const h      = parseInt(a.start.split(":")[0], 10);
      const rowIdx = SLOT_HOURS.reduce<number>(
        (best, sh, ri) => Math.abs(h - sh) < Math.abs(h - SLOT_HOURS[best]) ? ri : best,
        0,
      );
      raw[rowIdx][colIdx]++;
    });
    const maxCell = Math.max(1, ...raw.flat());
    const peakMatrix = raw.map((row) => row.map((v) => Math.round((v / maxCell) * 10)));

    const peakCells: PeakCell[] = [];
    raw.forEach((row, ri) => row.forEach((v, ci) => {
      peakCells.push({ day: PEAK_DAYS[ci], slot: PEAK_SLOTS[ri], count: v });
    }));
    const peakTop = [...peakCells].sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      revenueCents, lastRevenueCents, apptCount, lastApptCount,
      newClients, occupancyPct,
      chart7:  getChartData(7),
      chart14: getChartData(14),
      chart30: getChartData(30),
      ticketMedioCents: completed(thisMonthAppts).length > 0 ? Math.round(revenueCents / completed(thisMonthAppts).length) : 0,
      upcoming, topServices, topClients,
      peakMatrix, peakTop,
    };
  }, [appts, clients, services]);

  return { data, isLoading };
}

// ── Re-export delta helper for use in page ────────────────────
export { pctDelta };
export { PEAK_DAYS, PEAK_SLOTS };
