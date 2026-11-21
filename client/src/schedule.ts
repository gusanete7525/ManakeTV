export type AirItem = {
  id: string;
  title: string;
  startTime: string;
  durationSec: number;
  days: number[];
  date: string | null;
};

export type Occurrence = {
  item: AirItem;
  start: Date;
  end: Date;
};

export type OnAir = {
  current: (Occurrence & { offsetSec: number }) | null;
  next: Occurrence | null;
  today: Occurrence[];
};

export function parseStartTime(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatMinutes(total: number): string {
  const day = 24 * 60;
  const clamped = ((Math.floor(total) % day) + day) % day;
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12, 0, 0, 0);
}

function occursOn(item: AirItem, day: Date): boolean {
  if (item.durationSec <= 0) return false;
  if (!parseStartTime(item.startTime)) return false;
  if (item.date) return item.date === dateKey(day);
  return item.days.includes(day.getDay());
}

export function occurrenceOn(item: AirItem, day: Date): Occurrence | null {
  if (!occursOn(item, day)) return null;
  const parsed = parseStartTime(item.startTime);
  if (!parsed) return null;
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), parsed.hours, parsed.minutes, 0, 0);
  const end = new Date(start.getTime() + item.durationSec * 1000);
  return { item, start, end };
}

export function occurrencesOn(items: AirItem[], day: Date): Occurrence[] {
  return items
    .map((item) => occurrenceOn(item, day))
    .filter((item): item is Occurrence => item !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.item.id.localeCompare(b.item.id));
}

export function resolveOnAir(items: AirItem[], now: Date): OnAir {
  const windowDays = [-1, 0, 1, 2].map((offset) => shiftDays(now, offset));
  const occurrences = windowDays.flatMap((day) => occurrencesOn(items, day));
  const nowMs = now.getTime();
  const currentCandidates = occurrences
    .filter((occurrence) => occurrence.start.getTime() <= nowMs && nowMs < occurrence.end.getTime())
    .sort((a, b) => b.start.getTime() - a.start.getTime());
  const current = currentCandidates[0];
  const next = occurrences
    .filter((occurrence) => occurrence.start.getTime() > nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;
  return {
    current: current
      ? { ...current, offsetSec: Math.max(0, Math.floor((nowMs - current.start.getTime()) / 1000)) }
      : null,
    next,
    today: occurrencesOn(items, now),
  };
}

export function coverageOn(items: AirItem[], day: Date): Array<Occurrence & { continued: boolean }> {
  const midnight = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const yesterday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, 12, 0, 0, 0);
  const carried = occurrencesOn(items, yesterday)
    .filter((occurrence) => occurrence.end.getTime() > midnight.getTime())
    .map((occurrence) => ({ ...occurrence, continued: true }));
  const starting = occurrencesOn(items, day).map((occurrence) => ({ ...occurrence, continued: false }));
  return [...carried, ...starting];
}

export function conflictingIds(items: AirItem[], day: Date): Set<string> {
  const occurrences = coverageOn(items, day);
  const conflicts = new Set<string>();
  for (let index = 0; index < occurrences.length; index += 1) {
    for (let other = index + 1; other < occurrences.length; other += 1) {
      const left = occurrences[index];
      const right = occurrences[other];
      if (!left || !right) continue;
      if (left.start < right.end && right.start < left.end) {
        conflicts.add(left.item.id);
        conflicts.add(right.item.id);
      }
    }
  }
  return conflicts;
}

export function suggestStartTime(items: AirItem[], day: Date, now: Date): string {
  const scheduled = occurrencesOn(items, day);
  if (scheduled.length > 0) {
    const endMs = Math.max(...scheduled.map((occurrence) => occurrence.end.getTime()));
    const end = new Date(Math.ceil(endMs / 60000) * 60000);
    if (dateKey(end) !== dateKey(day)) return "23:45";
    return formatMinutes(end.getHours() * 60 + end.getMinutes());
  }
  if (dateKey(day) === dateKey(now)) {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const rounded = Math.ceil((minutes + 1) / 15) * 15;
    if (rounded < 24 * 60) return formatMinutes(rounded);
  }
  return "21:00";
}
