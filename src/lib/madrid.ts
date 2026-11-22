const MADRID = "Europe/Madrid";

/** Parts of `date` in Europe/Madrid. */
export function madridParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Wall-clock HH:MM in Madrid for a Date that is "today" locally for scheduling. */
export function todayAtMadridWallClock(
  hour: number,
  minute: number,
  base = new Date(),
): Date {
  const p = madridParts(base);
  // Build an ISO-like string interpreted in Madrid via iterative offset approximation
  const guess = new Date(
    Date.UTC(p.year, p.month - 1, p.day, hour, minute, 0),
  );
  // Adjust so that Madrid wall time matches desired hour:minute
  for (let i = 0; i < 3; i++) {
    const got = madridParts(guess);
    const deltaMin =
      (hour - got.hour) * 60 +
      (minute - got.minute) +
      (p.day - got.day) * 24 * 60;
    guess.setTime(guess.getTime() + deltaMin * 60_000);
  }
  return guess;
}

/** Local calendar day + HH:MM as Date (browser local — used for schedule slots). */
export function localDayAt(hour: number, minute: number, base = new Date()): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function madridClockLabel(date = new Date()): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function sweepKeyForHour(date: Date, hour: number): string {
  const p = madridParts(date);
  const y = String(p.year);
  const m = String(p.month).padStart(2, "0");
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}T${String(hour).padStart(2, "0")}`;
}

/** Which scheduled sweep hour (if any) should fire now, and hasn't been recorded. */
export function dueSweepHour(
  now: Date,
  hours: readonly number[],
  lastKey: string | undefined,
): number | null {
  const p = madridParts(now);
  for (const h of hours) {
    if (p.hour > h || (p.hour === h && p.minute >= 0)) {
      // Within the hour window: fire once when we enter the hour (minute < 15 grace)
      if (p.hour === h && p.minute < 30) {
        const key = sweepKeyForHour(now, h);
        if (lastKey !== key) return h;
      }
    }
  }
  return null;
}

export function nextSweepLabel(
  now: Date,
  hours: readonly number[],
): string {
  const p = madridParts(now);
  const sorted = [...hours].sort((a, b) => a - b);
  for (const h of sorted) {
    if (p.hour < h) return `hoy ${String(h).padStart(2, "0")}:00`;
  }
  const first = sorted[0] ?? 10;
  return `mañana ${String(first).padStart(2, "0")}:00`;
}

/** True when an interval Barrido should run (app open / clock tick). */
export function dueIntervalSweep(
  now: Date,
  intervalMinutes: number,
  lastIntervalSweepAt: string | undefined,
): boolean {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return false;
  if (!lastIntervalSweepAt) return true;
  const last = Date.parse(lastIntervalSweepAt);
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= intervalMinutes * 60_000;
}

export function nextIntervalSweepLabel(
  now: Date,
  intervalMinutes: number,
  lastIntervalSweepAt: string | undefined,
): string {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    return "interval off";
  }
  if (!lastIntervalSweepAt) return `in ≤${intervalMinutes} min`;
  const last = Date.parse(lastIntervalSweepAt);
  if (Number.isNaN(last)) return `in ≤${intervalMinutes} min`;
  const dueAt = last + intervalMinutes * 60_000;
  const remainMs = dueAt - now.getTime();
  if (remainMs <= 0) return "due now";
  const remainMin = Math.ceil(remainMs / 60_000);
  return `in ~${remainMin} min`;
}
