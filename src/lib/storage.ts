import { defaultFeeds } from "./feeds";
import { madridDateKey, type FluxStore } from "../types";

const STORAGE_KEY = "fluxtv-store-v2";
const LEGACY_KEY = "fluxtv-store-v1";

export function emptyStore(): FluxStore {
  const today = madridDateKey();
  const dayId = `day-${today}`;
  return {
    version: 2,
    media: {},
    slots: {},
    days: {
      [dayId]: {
        id: dayId,
        date: today,
        title: "Hoy",
        slotIds: [],
      },
    },
    feeds: defaultFeeds(),
    folders: {},
    proposals: {},
    sweepLog: [],
    settings: {
      timezone: "Europe/Madrid",
      clockMode: "wall",
      sweepHoursMadrid: [10, 16, 22],
    },
  };
}

export function loadStore(): FluxStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FluxStore;
      if (parsed?.version === 2) {
        return ensureToday(mergeFeeds(parsed));
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as {
        media?: FluxStore["media"];
        slots?: FluxStore["slots"];
        days?: FluxStore["days"];
      };
      const base = emptyStore();
      return ensureToday({
        ...base,
        media: old.media ?? {},
        slots: old.slots ?? {},
        days: old.days ?? base.days,
      });
    }
  } catch {
    /* fall through */
  }
  return emptyStore();
}

export function saveStore(store: FluxStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function mergeFeeds(store: FluxStore): FluxStore {
  const defaults = defaultFeeds();
  const feeds = { ...defaults };
  for (const [id, f] of Object.entries(store.feeds ?? {})) {
    if (feeds[id]) {
      feeds[id] = { ...feeds[id], enabled: f.enabled };
    } else {
      feeds[id] = f;
    }
  }
  return { ...store, feeds };
}

function ensureToday(store: FluxStore): FluxStore {
  const today = madridDateKey();
  const dayId = `day-${today}`;
  if (store.days[dayId]) return store;
  return {
    ...store,
    days: {
      ...store.days,
      [dayId]: {
        id: dayId,
        date: today,
        title: "Hoy",
        slotIds: [],
      },
    },
  };
}
