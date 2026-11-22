/** FluxTV domain types — see Project docs/fluxtv-plan.md */

export type SourceKind = "url" | "local" | "official_api" | "rss";

export type ChannelId =
  | "tve1"
  | "antena3"
  | "cuatro"
  | "telecinco"
  | "lasexta"
  | "onda_cero"
  | "cadena_ser"
  | "cope"
  | "europa_fm"
  | "melodia_fm";

export interface MediaItem {
  id: string;
  title: string;
  sourceKind: SourceKind;
  url?: string;
  /** Canonical key for dedupe (normalized URL or title) */
  canonicalKey?: string;
  localFileName?: string;
  /** Relative path within a picked folder */
  localPath?: string;
  folderId?: string;
  platformId?: string;
  channelId?: ChannelId;
  feedId?: string;
  durationHintSec?: number;
  notes?: string;
  /** Last viability probe ISO timestamp */
  lastCheckedAt?: string;
  viable?: boolean;
  createdAt: string;
}

export interface ScheduleSlot {
  id: string;
  mediaId: string;
  startAt: string;
  endAt: string;
  notes?: string;
}

export interface ProgramDay {
  id: string;
  date: string;
  title?: string;
  slotIds: string[];
}

export type FeedAvailability =
  | "public_rss"
  | "news_rss_only"
  | "stub_no_public_api";

export interface FeedConfig {
  id: string;
  label: string;
  channelId: ChannelId;
  availability: FeedAvailability;
  /** Absolute public feed URL, or same-origin proxy path */
  url?: string;
  /** Human note shown in UI */
  notes: string;
  enabled: boolean;
}

export interface SweepProposal {
  id: string;
  title: string;
  url: string;
  canonicalKey: string;
  feedId: string;
  channelId: ChannelId;
  viable: boolean;
  foundAt: string;
  summary?: string;
}

export interface SweepLogEntry {
  id: string;
  startedAt: string;
  finishedAt: string;
  trigger: "manual" | "scheduled" | "interval";
  feedsChecked: number;
  urlsProbed: number;
  proposed: number;
  skippedDead: number;
  skippedDupe: number;
  errors: string[];
}

export interface LocalFolderMeta {
  id: string;
  name: string;
  addedAt: string;
  fileCount: number;
}

export interface FluxSettings {
  timezone: string;
  clockMode: "wall" | "simulated";
  simulatedNow?: string;
  /** Thrice-daily Barrido hours (Europe/Madrid wall clock). */
  sweepHoursMadrid: [number, number, number];
  lastScheduledSweepKey?: string;
  /** How often enabled podcast RSS feeds refresh while the app is open. */
  sweepIntervalMinutes: number;
  /** ISO timestamp of the last interval Barrido. */
  lastIntervalSweepAt?: string;
  /** Preferred HTMLMediaElement audio output deviceId (Chromium/Electron). */
  preferredAudioSinkId?: string;
}

/** Starred library items + public feeds (Onda-style Favoritos). */
export interface FluxFavorites {
  mediaIds: string[];
  feedIds: string[];
}

export type AppView =
  | "home"
  | "podcast_tv"
  | "agregados"
  | "favorites"
  | "parrilla"
  | "barrido"
  | "library"
  | "sources";

export interface FluxStore {
  version: 2;
  media: Record<string, MediaItem>;
  slots: Record<string, ScheduleSlot>;
  days: Record<string, ProgramDay>;
  feeds: Record<string, FeedConfig>;
  folders: Record<string, LocalFolderMeta>;
  proposals: Record<string, SweepProposal>;
  sweepLog: SweepLogEntry[];
  settings: FluxSettings;
  favorites: FluxFavorites;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function madridDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
