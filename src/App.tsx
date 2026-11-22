import { useEffect, useMemo, useRef, useState } from "react";
import { ChannelSources } from "./components/ChannelSources";
import { MediaLibrary } from "./components/MediaLibrary";
import { OnAirPlayer } from "./components/OnAirPlayer";
import { SweepPanel } from "./components/SweepPanel";
import { Timeline } from "./components/Timeline";
import { mediaCanonicalKey } from "./lib/canonicalize";
import {
  dueSweepHour,
  madridClockLabel,
  nextSweepLabel,
  sweepKeyForHour,
} from "./lib/madrid";
import { findOverlaps, wouldOverlap } from "./lib/overlap";
import { loadStore, saveStore } from "./lib/storage";
import { proposalToMedia, runSweep } from "./lib/sweeps";
import {
  madridDateKey,
  newId,
  type FluxStore,
  type MediaItem,
  type ScheduleSlot,
} from "./types";
import "./App.css";

export default function App() {
  const [store, setStore] = useState<FluxStore>(() => loadStore());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [placeMediaId, setPlaceMediaId] = useState("");
  const [placeStart, setPlaceStart] = useState("20:00");
  const [placeDurationMin, setPlaceDurationMin] = useState(45);
  const [query, setQuery] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [overlapWarn, setOverlapWarn] = useState(false);
  const storeRef = useRef(store);
  const sweepingRef = useRef(false);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const dayId = `day-${madridDateKey(now)}`;
  const day =
    store.days[dayId] ??
    ({
      id: dayId,
      date: madridDateKey(now),
      title: "Hoy",
      slotIds: [] as string[],
    } as const);

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

  const overlaps = useMemo(() => findOverlaps(slots), [slots]);

  const mediaList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(store.media)
      .filter((m) => {
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          (m.url?.toLowerCase().includes(q) ?? false) ||
          (m.localPath?.toLowerCase().includes(q) ?? false) ||
          (m.notes?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [store.media, query]);

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(store.proposals)
      .filter((p) => p.viable)
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.url.toLowerCase().includes(q) ||
          (p.summary?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime(),
      );
  }, [store.proposals, query]);

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

  const nextSlot = useMemo(() => {
    const t = now.getTime();
    return slots.find((s) => new Date(s.startAt).getTime() > t) ?? null;
  }, [slots, now]);

  const onAirMedia = onAir ? store.media[onAir.mediaId] ?? null : null;
  const nextTitle = nextSlot
    ? store.media[nextSlot.mediaId]?.title
    : undefined;

  async function doSweep(trigger: "manual" | "scheduled", key?: string) {
    if (sweepingRef.current) return;
    sweepingRef.current = true;
    setSweeping(true);
    try {
      const result = await runSweep(storeRef.current, trigger, key);
      setStore((prev) => ({
        ...prev,
        proposals: result.storePatch.proposals ?? prev.proposals,
        media: result.storePatch.media ?? prev.media,
        sweepLog: result.storePatch.sweepLog ?? prev.sweepLog,
        settings: result.storePatch.settings ?? prev.settings,
      }));
    } finally {
      sweepingRef.current = false;
      setSweeping(false);
    }
  }

  // Scheduled sweeps 10 / 16 / 22 Europe/Madrid
  useEffect(() => {
    const hours = storeRef.current.settings.sweepHoursMadrid;
    const due = dueSweepHour(
      now,
      hours,
      storeRef.current.settings.lastScheduledSweepKey,
    );
    if (due == null) return;
    const key = sweepKeyForHour(now, due);
    void doSweep("scheduled", key);
  }, [now]);

  function addUrlMedia(item: Omit<MediaItem, "id" | "createdAt">) {
    const id = newId("media");
    setStore((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        [id]: {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          canonicalKey:
            item.canonicalKey ??
            mediaCanonicalKey({ url: item.url, title: item.title }),
        },
      },
    }));
    setPlaceMediaId(id);
  }

  function addManyMedia(items: MediaItem[]) {
    setStore((prev) => {
      const media = { ...prev.media };
      for (const item of items) media[item.id] = item;
      return { ...prev, media };
    });
    if (items[0]) setPlaceMediaId(items[0].id);
  }

  function addFolder(
    folder: { id: string; name: string; addedAt: string; fileCount: number },
    items: MediaItem[],
  ) {
    setStore((prev) => {
      const media = { ...prev.media };
      for (const item of items) media[item.id] = item;
      return {
        ...prev,
        media,
        folders: { ...prev.folders, [folder.id]: folder },
      };
    });
    if (items[0]) setPlaceMediaId(items[0].id);
  }

  function placeSlot() {
    if (!placeMediaId) return;
    const [hh, mm] = placeStart.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const start = new Date();
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + placeDurationMin * 60_000);
    const candidate = {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
    const overlapsExisting = wouldOverlap(slots, candidate);
    setOverlapWarn(overlapsExisting);

    const id = newId("slot");
    const slot: ScheduleSlot = {
      id,
      mediaId: placeMediaId,
      ...candidate,
    };
    const targetDayId = day.id;
    setStore((prev) => {
      const d = prev.days[targetDayId] ?? {
        id: targetDayId,
        date: day.date,
        title: day.title,
        slotIds: [],
      };
      return {
        ...prev,
        slots: { ...prev.slots, [id]: slot },
        days: {
          ...prev.days,
          [targetDayId]: { ...d, slotIds: [...d.slotIds, id] },
        },
      };
    });
    setSelectedSlotId(id);
  }

  function removeSlot(slotId: string) {
    const targetDayId = day.id;
    setStore((prev) => {
      const existing = prev.days[targetDayId];
      if (!existing) return prev;
      const { [slotId]: _, ...restSlots } = prev.slots;
      return {
        ...prev,
        slots: restSlots,
        days: {
          ...prev.days,
          [targetDayId]: {
            ...existing,
            slotIds: existing.slotIds.filter((id) => id !== slotId),
          },
        },
      };
    });
    if (selectedSlotId === slotId) setSelectedSlotId(null);
  }

  function toggleFeed(feedId: string, enabled: boolean) {
    setStore((prev) => ({
      ...prev,
      feeds: {
        ...prev.feeds,
        [feedId]: { ...prev.feeds[feedId], enabled },
      },
    }));
  }

  function addProposal(id: string) {
    const proposal = store.proposals[id];
    if (!proposal) return;
    const feed = store.feeds[proposal.feedId];
    const media = proposalToMedia(proposal, feed);
    setStore((prev) => {
      const { [id]: _, ...rest } = prev.proposals;
      return {
        ...prev,
        media: { ...prev.media, [media.id]: media },
        proposals: rest,
      };
    });
    setPlaceMediaId(media.id);
  }

  function dismissProposal(id: string) {
    setStore((prev) => {
      const { [id]: _, ...rest } = prev.proposals;
      return { ...prev, proposals: rest };
    });
  }

  const feeds = Object.values(store.feeds);
  const lastLog = store.sweepLog[0] ?? null;

  return (
    <div className="app">
      <div className="app__atmosphere" aria-hidden="true" />
      <header className="app__masthead">
        <div className="app__brand-block">
          <p className="app__brand">FluxTV</p>
          <p className="app__tagline">
            Your timed program — legal sources only
          </p>
        </div>
        <div className="app__air">
          <span className="app__air-label">On air</span>
          <strong className="app__air-title">
            {onAirMedia?.title ?? "Off air"}
          </strong>
          <time className="app__clock" dateTime={now.toISOString()}>
            {now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </header>

      <main className="app__main">
        <div className="app__primary">
          <OnAirPlayer
            slot={onAir}
            media={onAirMedia}
            nextTitle={nextTitle}
          />
          <Timeline
            slots={slots}
            media={store.media}
            now={now}
            overlaps={overlaps}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
            onRemoveSlot={removeSlot}
          />
        </div>

        <aside className="app__side">
          <MediaLibrary
            media={mediaList}
            query={query}
            onQueryChange={setQuery}
            onAddUrl={addUrlMedia}
            onAddMany={addManyMedia}
            onAddFolder={addFolder}
          />

          <section className="placer" aria-label="Place slot">
            <h2 className="placer__title">Place on schedule</h2>
            <p className="placer__hint">
              Start time + duration on today’s wall clock.
            </p>
            <label className="placer__field">
              <span>Media</span>
              <select
                value={placeMediaId}
                onChange={(e) => setPlaceMediaId(e.target.value)}
              >
                <option value="">Select…</option>
                {Object.values(store.media)
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((m) => (
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
            {overlapWarn ? (
              <p className="placer__warn" role="status">
                That slot overlaps another — added with a warning.
              </p>
            ) : null}
            <button
              type="button"
              className="placer__submit"
              disabled={!placeMediaId}
              onClick={placeSlot}
            >
              Add slot
            </button>
          </section>

          <SweepPanel
            nextLabel={nextSweepLabel(now, store.settings.sweepHoursMadrid)}
            madridClock={madridClockLabel(now)}
            sweeping={sweeping}
            lastLog={lastLog}
            proposals={filteredProposals}
            onBarrido={() => void doSweep("manual")}
            onAddProposal={addProposal}
            onDismissProposal={dismissProposal}
          />

          <ChannelSources feeds={feeds} onToggle={toggleFeed} />
        </aside>
      </main>

      <footer className="app__footer">
        Legal path only: user URLs, local folders/files, documented public RSS
        (RTVE). No pirate sites, Digi/Movistar credential scraping, or paywall
        bypass. Search never hits unauthorized catalogs.
      </footer>
    </div>
  );
}
