/** FluxTV domain types — see product plan docs/fluxtv-plan.md (Project store). */

export type SourceKind = "url" | "local" | "official_api" | "rss";

export interface MediaItem {
  id: string;
  title: string;
  sourceKind: SourceKind;
  /** Direct or page URL when applicable */
  url?: string;
  localFileName?: string;
  /** e.g. "rtve" when sourceKind is official_api — Phase 3+ */
  platformId?: string;
  durationHintSec?: number;
  notes?: string;
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

export interface FluxSettings {
  timezone: string;
  clockMode: "wall" | "simulated";
  simulatedNow?: string;
}

export interface FluxStore {
  version: 1;
  media: Record<string, MediaItem>;
  slots: Record<string, ScheduleSlot>;
  days: Record<string, ProgramDay>;
  settings: FluxSettings;
}

export function emptyStore(): FluxStore {
  const today = new Date().toISOString().slice(0, 10);
  const dayId = `day-${today}`;
  return {
    version: 1,
    media: {},
    slots: {},
    days: {
      [dayId]: {
        id: dayId,
        date: today,
        title: "Tonight",
        slotIds: [],
      },
    },
    settings: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      clockMode: "wall",
    },
  };
}
