export const WEEKDAYS = [
  { day: 1, label: "L", name: "lunes" },
  { day: 2, label: "M", name: "martes" },
  { day: 3, label: "X", name: "miércoles" },
  { day: 4, label: "J", name: "jueves" },
  { day: 5, label: "V", name: "viernes" },
  { day: 6, label: "S", name: "sábado" },
  { day: 0, label: "D", name: "domingo" },
] as const;

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatRange(start: Date, end: Date): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function formatPublished(value: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})/.exec(value);
  if (!match) return "";
  return `${match[1]}/${match[2]}/${match[3]}`;
}

export function countdown(now: Date, target: Date): string {
  const seconds = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${rest} s`;
}

export function shiftDate(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12, 0, 0, 0);
}

export function dateFromKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}
