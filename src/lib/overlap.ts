import type { ScheduleSlot } from "../types";

export type OverlapPair = {
  a: ScheduleSlot;
  b: ScheduleSlot;
};

export function findOverlaps(slots: ScheduleSlot[]): OverlapPair[] {
  const sorted = [...slots].sort(
    (x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime(),
  );
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const aStart = new Date(a.startAt).getTime();
      const aEnd = new Date(a.endAt).getTime();
      const bStart = new Date(b.startAt).getTime();
      const bEnd = new Date(b.endAt).getTime();
      if (bStart >= aEnd) break;
      if (aStart < bEnd && bStart < aEnd) {
        pairs.push({ a, b });
      }
    }
  }
  return pairs;
}

export function wouldOverlap(
  slots: ScheduleSlot[],
  candidate: { startAt: string; endAt: string; excludeId?: string },
): boolean {
  const start = new Date(candidate.startAt).getTime();
  const end = new Date(candidate.endAt).getTime();
  return slots.some((s) => {
    if (candidate.excludeId && s.id === candidate.excludeId) return false;
    const sStart = new Date(s.startAt).getTime();
    const sEnd = new Date(s.endAt).getTime();
    return start < sEnd && sStart < end;
  });
}
