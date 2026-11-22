import { useEffect, useMemo, useState } from "react";
import { MediaLibrary } from "./components/MediaLibrary";
import { Timeline } from "./components/Timeline";
import {
  emptyStore,
  type FluxStore,
  type MediaItem,
  type ScheduleSlot,
} from "./types";
import "./App.css";

const STORAGE_KEY = "fluxtv-store-v1";

function loadStore(): FluxStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as FluxStore;
    if (parsed?.version !== 1) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function App() {
  const [store, setStore] = useState<FluxStore>(() => loadStore());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [placeMediaId, setPlaceMediaId] = useState("");
  const [placeStart, setPlaceStart] = useState("20:00");
  const [placeDurationMin, setPlaceDurationMin] = useState(45);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const day = useMemo(() => {
    const days = Object.values(store.days);
    return days[0] ?? null;
  }, [store.days]);

  const slots: ScheduleSlot[] = useMemo(() => {
    if (!day) return [];
    return day.slotIds
      .map((id) => store.slots[id])
      .filter((s): s is ScheduleSlot => Boolean(s))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [day, store.slots]);

  const mediaList = useMemo(
    () => Object.values(store.media).sort((a, b) => a.title.localeCompare(b.title)),
    [store.media],
  );

  const onAir = useMemo(() => {
    const t = now.getTime();
    return (
      slots.find((s) => {
        const start = new Date(s.startAt).getTime();
        const end = new Date(s.endAt).getTime();
        return t >= start && t < end;
      }) ?? null
    );
  }, [slots, now]);

  function addMedia(item: Omit<MediaItem, "id" | "createdAt">) {
    const id = newId("media");
    setStore((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        [id]: { ...item, id, createdAt: new Date().toISOString() },
      },
    }));
    setPlaceMediaId(id);
  }

  function placeSlot() {
    if (!day || !placeMediaId) return;
    const [hh, mm] = placeStart.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const start = new Date();
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + placeDurationMin * 60_000);
    const id = newId("slot");
    const slot: ScheduleSlot = {
      id,
      mediaId: placeMediaId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      slots: { ...prev.slots, [id]: slot },
      days: {
        ...prev.days,
        [day.id]: {
          ...prev.days[day.id],
          slotIds: [...prev.days[day.id].slotIds, id],
        },
      },
    }));
    setSelectedSlotId(id);
  }

  const onAirTitle = onAir
    ? (store.media[onAir.mediaId]?.title ?? "Unknown")
    : "Off air";

  return (
    <div className="app">
      <div className="app__atmosphere" aria-hidden="true" />
      <header className="app__masthead">
        <div className="app__brand-block">
          <p className="app__brand">FluxTV</p>
          <p className="app__tagline">Build your own timed program</p>
        </div>
        <div className="app__air">
          <span className="app__air-label">On air</span>
          <strong className="app__air-title">{onAirTitle}</strong>
          <time className="app__clock" dateTime={now.toISOString()}>
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </header>

      <main className="app__main">
        <Timeline
          slots={slots}
          media={store.media}
          now={now}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />

        <aside className="app__side">
          <MediaLibrary media={mediaList} onAdd={addMedia} />

          <section className="placer" aria-label="Place slot">
            <h2 className="placer__title">Place on schedule</h2>
            <p className="placer__hint">
              Pick a library item, start time, and duration.
            </p>
            <label className="placer__field">
              <span>Media</span>
              <select
                value={placeMediaId}
                onChange={(e) => setPlaceMediaId(e.target.value)}
              >
                <option value="">Select…</option>
                {mediaList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="placer__row">
              <label className="placer__field">
                <span>Start</span>
                <input
                  type="time"
                  value={placeStart}
                  onChange={(e) => setPlaceStart(e.target.value)}
                />
              </label>
              <label className="placer__field">
                <span>Minutes</span>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={placeDurationMin}
                  onChange={(e) =>
                    setPlaceDurationMin(Number(e.target.value) || 30)
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="placer__submit"
              disabled={!placeMediaId}
              onClick={placeSlot}
            >
              Add slot
            </button>
          </section>
        </aside>
      </main>

      <footer className="app__footer">
        Sources: user URLs &amp; local files. Official platforms (e.g. RTVE
        Play) only via documented legal APIs later — see product plan.
      </footer>
    </div>
  );
}
