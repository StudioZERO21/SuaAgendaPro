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

export type PeriodPreset = "hoje" | "semana" | "mes" | "mes_passado" | "custom";

export type DashboardPeriod = {
  preset: PeriodPreset;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
};

export type DashboardData = {
  // KPIs
  revenueCents:       number;
  lastRevenueCents:   number;
  apptCount:          number;
  lastApptCount:      number;
  newClients:         number;
  occupancyPct:       number;

  // New KPIs
  cancelados:         number;
  lastCancelados:     number;
  taxaRetencaoPct:    number;
  clientesRecorrentes: number;

  // Chart (value = receita em centavos por dia — always 30 days from today)
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
  peakMatrix:    number[][];
  peakTop:       PeakCell[];
};

// ── Constants ─────────────────────────────────────────────────

const PEAK_DAYS  = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PEAK_SLOTS = ["09h", "11h", "13h", "15h", "17h", "19h"];
const SLOT_HOURS = [9, 11, 13, 15, 17, 19];
const DOW_TO_COL: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pctDelta(current: number, prev: number): { delta: string; up: boolean } {
  if (prev === 0) return current > 0 ? { delta: "+∞", up: true } : { delta: "—", up: true };
  const pct = Math.round(((current - prev) / prev) * 100);
  return { delta: `${pct >= 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
}

// ── Period builder ─────────────────────────────────────────────

export function buildPeriod(preset: PeriodPreset, customFrom?: Date, customTo?: Date): DashboardPeriod {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "hoje": {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return { preset, from: today, to: today, prevFrom: yesterday, prevTo: yesterday, label: "Hoje" };
    }
    case "semana": {
      const dow  = today.getDay();
      const mon  = new Date(today);
      mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      const sun  = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const prevMon = new Date(mon);
      prevMon.setDate(mon.getDate() - 7);
      const prevSun = new Date(sun);
      prevSun.setDate(sun.getDate() - 7);
      return { preset, from: mon, to: sun, prevFrom: prevMon, prevTo: prevSun, label: "Esta semana" };
    }
    case "mes": {
      const from  = new Date(today.getFullYear(), today.getMonth(), 1);
      const to    = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const pFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const pTo   = new Date(today.getFullYear(), today.getMonth(), 0);
      return { preset, from, to, prevFrom: pFrom, prevTo: pTo, label: "Este mês" };
    }
    case "mes_passado": {
      const from  = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to    = new Date(today.getFullYear(), today.getMonth(), 0);
      const pFrom = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const pTo   = new Date(today.getFullYear(), today.getMonth() - 1, 0);
      return { preset, from, to, prevFrom: pFrom, prevTo: pTo, label: "Mês passado" };
    }
    case "custom": {
      const from   = customFrom ?? today;
      const to     = customTo   ?? today;
      const diffMs = to.getTime() - from.getTime();
      const pTo    = new Date(from.getTime() - 1);
      const pFrom  = new Date(pTo.getTime() - diffMs);
      return { preset, from, to, prevFrom: pFrom, prevTo: pTo, label: "Personalizado" };
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard(period?: DashboardPeriod) {
  const { data: appts   = [], isLoading: loadingA } = useAgendamentos();
  const { data: clients = [], isLoading: loadingC } = useClientes();
  const { data: services = [] }                      = useServices();

  const isLoading = loadingA || loadingC;

  // Default to current month if no period provided
  const activePeriod = period ?? buildPeriod("mes");

  const data = useMemo<DashboardData>(() => {
    const now      = new Date();
    const todayStr = dateStr(now);

    const { from, to, prevFrom, prevTo } = activePeriod;

    const serviceMap = new Map<string, Service>(services.map((s) => [s.id, s]));
    const clientMap  = new Map<string, UIClient>(clients.map((c) => [c.id, c]));

    const inRange = (ds: string, f: Date, t: Date) => {
      const d = new Date(ds + "T00:00:00");
      return d >= f && d <= t;
    };

    const periodAppts = appts.filter((a) => inRange(a.date, from, to));
    const prevAppts   = appts.filter((a) => inRange(a.date, prevFrom, prevTo));

    const revenueByDate = new Map<string, number>();
    const raw: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));

    for (const a of appts) {
      if (a.status === "concluido") {
        revenueByDate.set(a.date, (revenueByDate.get(a.date) ?? 0) + a.priceCents);
      }
      if (a.status !== "cancelado") {
        const d = new Date(a.date + "T00:00:00");
        const colIdx = DOW_TO_COL[d.getDay()];
        if (colIdx !== undefined) {
          const h = parseInt(a.start.split(":")[0], 10);
          const rowIdx = SLOT_HOURS.reduce<number>(
            (best, sh, ri) => (Math.abs(h - sh) < Math.abs(h - SLOT_HOURS[best]) ? ri : best),
            0,
          );
          raw[rowIdx][colIdx]++;
        }
      }
    }

    const nonCancelled = (arr: typeof appts) => arr.filter((a) => a.status !== "cancelado");
    const completed    = (arr: typeof appts) => arr.filter((a) => a.status === "concluido");

    const revenueCents     = completed(periodAppts).reduce((s, a) => s + a.priceCents, 0);
    const lastRevenueCents = completed(prevAppts).reduce((s, a) => s + a.priceCents, 0);
    const apptCount        = nonCancelled(periodAppts).length;
    const lastApptCount    = nonCancelled(prevAppts).length;

    // Cancelamentos (status "cancelado" in period)
    const cancelados     = periodAppts.filter((a) => a.status === "cancelado").length;
    const lastCancelados = prevAppts.filter((a) => a.status === "cancelado").length;

    // Taxa de retenção: % clientes concluídos no período que já tinham visita anterior
    const clientsInPeriod = new Set(
      completed(periodAppts).map((a) => a.clientId),
    );
    const returningClients = [...clientsInPeriod].filter((cId) =>
      appts.some(
        (a) => a.clientId === cId && a.status === "concluido" && new Date(a.date + "T00:00:00") < from,
      ),
    );
    const taxaRetencaoPct = clientsInPeriod.size > 0
      ? Math.round((returningClients.length / clientsInPeriod.size) * 100)
      : 0;
    const clientesRecorrentes = returningClients.length;

    const newClients = clients.filter((c) => {
      const cd = new Date(c.createdAt + "T00:00:00");
      return cd >= from && cd <= to;
    }).length;

    const workDays     = new Set(nonCancelled(periodAppts).map((a) => a.date)).size;
    const occupancyPct = workDays > 0
      ? Math.min(100, Math.round((apptCount / (workDays * 8)) * 100))
      : 0;

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

    function getChartData(days: number): ChartPoint[] {
      return Array.from({ length: days }, (_, i) => {
        const d  = new Date(now);
        d.setDate(now.getDate() - (days - 1 - i));
        const ds = dateStr(d);
        const label = i === days - 1
          ? "Hoje"
          : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);
        return { day: label, value: revenueByDate.get(ds) ?? 0 };
      });
    }

    const svcAgg: Record<string, { count: number; revenueCents: number }> = {};
    for (const a of nonCancelled(periodAppts)) {
      if (!svcAgg[a.serviceId]) svcAgg[a.serviceId] = { count: 0, revenueCents: 0 };
      svcAgg[a.serviceId].count++;
      if (a.status === "concluido") svcAgg[a.serviceId].revenueCents += a.priceCents;
    }
    const topServices: TopService[] = Object.entries(svcAgg)
      .map(([id, v]) => ({ name: serviceMap.get(id)?.name ?? "—", ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const topClients: UIClient[] = [...clients]
      .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
      .slice(0, 4);

    const maxCell = Math.max(1, ...raw.flat());
    const peakMatrix = raw.map((row) => row.map((v) => Math.round((v / maxCell) * 10)));

    const peakCells: PeakCell[] = [];
    raw.forEach((row, ri) => row.forEach((v, ci) => {
      peakCells.push({ day: PEAK_DAYS[ci], slot: PEAK_SLOTS[ri], count: v });
    }));
    const peakTop = [...peakCells].sort((a, b) => b.count - a.count).slice(0, 3);

    const doneCount = completed(periodAppts).length;

    return {
      revenueCents, lastRevenueCents, apptCount, lastApptCount,
      newClients, occupancyPct,
      cancelados, lastCancelados, taxaRetencaoPct, clientesRecorrentes,
      chart7:  getChartData(7),
      chart14: getChartData(14),
      chart30: getChartData(30),
      ticketMedioCents: doneCount > 0 ? Math.round(revenueCents / doneCount) : 0,
      upcoming, topServices, topClients,
      peakMatrix, peakTop,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appts, clients, services, activePeriod]);

  return { data, isLoading };
}

// ── Re-export helpers ─────────────────────────────────────────
export { pctDelta };
export { PEAK_DAYS, PEAK_SLOTS };
