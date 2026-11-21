import { parseStartTime, formatMinutes } from "./schedule";

export type MediaKind = "replay" | "pelicula" | "enlace";
export type MediaSource = "rtve" | "url";

export type PlaylistItem = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  pageUrl: string;
  kind: MediaKind;
  durationSec: number;
  startTime: string;
  days: number[];
  date: string | null;
  source: MediaSource;
  videoId: string | null;
  mediaUrl: string | null;
};

export type Station = {
  version: 1;
  name: string;
  items: PlaylistItem[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isKind(value: unknown): value is MediaKind {
  return value === "replay" || value === "pelicula" || value === "enlace";
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function emptyStation(): Station {
  return { version: 1, name: "Manake", items: [] };
}

export function sanitizeItem(value: unknown): PlaylistItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const title = clip(record.title, 180);
  const parsedTime = typeof record.startTime === "string" ? parseStartTime(record.startTime) : null;
  const durationSec = Number(record.durationSec);
  if (!title || !parsedTime) return null;
  if (!Number.isInteger(durationSec) || durationSec < 60 || durationSec > 8 * 3600) return null;

  const videoId = typeof record.videoId === "string" && /^\d{1,12}$/.test(record.videoId) ? record.videoId : null;
  const mediaUrl = httpUrl(record.mediaUrl);
  const source: MediaSource = record.source === "url" || (!videoId && mediaUrl) ? "url" : "rtve";
  if (source === "rtve" && !videoId) return null;
  if (source === "url" && !mediaUrl) return null;

  const days = Array.isArray(record.days)
    ? [...new Set(record.days.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
        (a, b) => a - b,
      )
    : [];
  const date = typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date) ? record.date : null;
  const id = typeof record.id === "string" && record.id.trim() ? record.id.trim().slice(0, 80) : crypto.randomUUID();
  const kind: MediaKind = isKind(record.kind) ? record.kind : source === "url" ? "enlace" : "replay";

  return {
    id,
    title,
    subtitle: clip(record.subtitle, 180),
    thumbnail: httpUrl(record.thumbnail) ?? "",
    pageUrl: httpUrl(record.pageUrl) ?? "",
    kind,
    durationSec,
    startTime: formatMinutes(parsedTime.hours * 60 + parsedTime.minutes),
    days: date ? [] : days,
    date,
    source,
    videoId: source === "rtve" ? videoId : null,
    mediaUrl: source === "url" ? mediaUrl : null,
  };
}

export function sanitizeStation(value: unknown): Station {
  const record = asRecord(value);
  const name = clip(record?.name, 40) || "Manake";
  const items = Array.isArray(record?.items)
    ? record.items.flatMap((item) => {
        const sanitized = sanitizeItem(item);
        return sanitized ? [sanitized] : [];
      })
    : [];
  return { version: 1, name, items: items.slice(0, 400) };
}

export function kindLabel(kind: MediaKind): string {
  switch (kind) {
    case "replay":
      return "Replay";
    case "pelicula":
      return "Película";
    case "enlace":
      return "Enlace";
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}
