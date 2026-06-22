import type { WorkingHours } from "@/integrations/supabase/types";

export type TimeSlot = string; // "HH:MM"

type BusySlot = { start: string; durationMinutes: number };

export function getAvailableSlots(
  wh: WorkingHours | undefined,
  busySlots: BusySlot[],
  serviceDuration: number,
  interval = 30,
): TimeSlot[] {
  if (!wh || !wh.is_open || !wh.start_time || !wh.end_time) return [];

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const startMin  = toMin(wh.start_time);
  const endMin    = toMin(wh.end_time);
  const breakS    = wh.break_start ? toMin(wh.break_start) : null;
  const breakE    = wh.break_end   ? toMin(wh.break_end)   : null;

  const busy = busySlots.map((b) => {
    const s = toMin(b.start);
    return { start: s, end: s + b.durationMinutes };
  });

  const slots: TimeSlot[] = [];

  for (let t = startMin; t + serviceDuration <= endMin; t += interval) {
    if (breakS && breakE && t < breakE && t + serviceDuration > breakS) continue;
    if (busy.some((b) => t < b.end && t + serviceDuration > b.start)) continue;

    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  return slots;
}

export function isoToDateStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
