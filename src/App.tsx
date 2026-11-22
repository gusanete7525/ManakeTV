import { useEffect, useMemo, useRef, useState } from "react";
import { ChannelSources } from "./components/ChannelSources";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { MediaLibrary } from "./components/MediaLibrary";
import { OnAirPlayer } from "./components/OnAirPlayer";
import { PodcastTvBrowse } from "./components/PodcastTvBrowse";
import { ScheduleAssistant } from "./components/ScheduleAssistant";
import { SideNav } from "./components/SideNav";
import { SweepPanel } from "./components/SweepPanel";
import { Timeline } from "./components/Timeline";
import { mediaCanonicalKey } from "./lib/canonicalize";
import {
  dueIntervalSweep,
  dueSweepHour,
  madridClockLabel,
  nextIntervalSweepLabel,
  nextSweepLabel,
  sweepKeyForHour,
} from "./lib/madrid";
import { findOverlaps, wouldOverlap } from "./lib/overlap";
import { loadStore, saveStore } from "./lib/storage";
import {
  proposalToMedia,
  runSweep,
  type SweepTrigger,
} from "./lib/sweeps";
import {
  madridDateKey,
  newId,
  type AppView,
  type FluxStore,
  type MediaItem,
  type ScheduleSlot,
} from "./types";
import "./App.css";

export default function App() {
  const [store, setStore] = useState<FluxStore>(() => loadStore());
  const [view, setView] = useState<AppView>("home");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [placeMediaId, setPlaceMediaId] = useState("");
  const [placeStart, setPlaceStart] = useState("20:00");
  const [placeDurationMin, setPlaceDurationMin] = useState(45);
  const [query, setQuery] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [overlapWarn, setOverlapWarn] = useState(false);
  const [assistantSeed, setAssistantSeed] = useState(0);
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

  const favoriteMedia = useMemo(
    () =>
      store.favorites.mediaIds
        .map((id) => store.media[id])
        .filter((m): m is MediaItem => Boolean(m)),
    [store.favorites.mediaIds, store.media],
  );

  const favoriteFeeds = useMemo(
    () =>
      store.favorites.feedIds
        .map((id) => store.feeds[id])
        .filter((f): f is NonNullable<typeof f> => Boolean(f)),
    [store.favorites.feedIds, store.feeds],
  );

  const favoriteCount =
    store.favorites.mediaIds.length + store.favorites.feedIds.length;

  async function doSweep(trigger: SweepTrigger, key?: string) {
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

  useEffect(() => {
    const settings = storeRef.current.settings;
    const hours = settings.sweepHoursMadrid;
    const dueHour = dueSweepHour(now, hours, settings.lastScheduledSweepKey);
    if (dueHour != null) {
      const key = sweepKeyForHour(now, dueHour);
      void doSweep("scheduled", key);
      return;
    }
    if (
      dueIntervalSweep(
        now,
        settings.sweepIntervalMinutes,
        settings.lastIntervalSweepAt,
      )
    ) {
      void doSweep("interval");
    }
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

  function placeSlotWith(
    mediaId: string,
    startStr: string,
    durationMin: number,
  ) {
    if (!mediaId) return;
    const [hh, mm] = startStr.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const start = new Date();
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60_000);
    const candidate = {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
    setOverlapWarn(wouldOverlap(slots, candidate));

    const id = newId("slot");
    const slot: ScheduleSlot = {
      id,
      mediaId,
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
    setPlaceMediaId(mediaId);
    setPlaceStart(startStr);
    setPlaceDurationMin(durationMin);
    setView("parrilla");
  }

  function placeSlot() {
    placeSlotWith(placeMediaId, placeStart, placeDurationMin);
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

  function toggleFeedFavorite(feedId: string) {
    setStore((prev) => {
      const has = prev.favorites.feedIds.includes(feedId);
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          feedIds: has
            ? prev.favorites.feedIds.filter((id) => id !== feedId)
            : [...prev.favorites.feedIds, feedId],
        },
      };
    });
  }

  function toggleMediaFavorite(mediaId: string) {
    setStore((prev) => {
      const has = prev.favorites.mediaIds.includes(mediaId);
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          mediaIds: has
            ? prev.favorites.mediaIds.filter((id) => id !== mediaId)
            : [...prev.favorites.mediaIds, mediaId],
        },
      };
    });
  }

  function addProposal(id: string): string | undefined {
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
    return media.id;
  }

  function dismissProposal(id: string) {
    setStore((prev) => {
      const { [id]: _, ...rest } = prev.proposals;
      return { ...prev, proposals: rest };
    });
  }

  function openAssistantForMedia(mediaId: string) {
    setPlaceMediaId(mediaId);
    setAssistantSeed((n) => n + 1);
    setView("parrilla");
  }

  function scheduleFeed(feedId: string) {
    const feed = store.feeds[feedId];
    if (!feed) return;
    // Prefer an existing library item from this feed; otherwise create a pointer media.
    const existing = Object.values(store.media).find((m) => m.feedId === feedId);
    if (existing) {
      openAssistantForMedia(existing.id);
      return;
    }
    const id = newId("media");
    const item: MediaItem = {
      id,
      title: feed.label,
      sourceKind: feed.availability === "public_rss" ? "rss" : "url",
      url: feed.url,
      feedId: feed.id,
      channelId: feed.channelId,
      notes: feed.notes,
      createdAt: new Date().toISOString(),
      canonicalKey: mediaCanonicalKey({ url: feed.url, title: feed.label }),
    };
    setStore((prev) => ({
      ...prev,
      media: { ...prev.media, [id]: item },
    }));
    openAssistantForMedia(id);
  }

  function scheduleProposal(proposalId: string) {
    const mediaId = addProposal(proposalId);
    if (mediaId) openAssistantForMedia(mediaId);
  }

  const feeds = Object.values(store.feeds);
  const lastLog = store.sweepLog[0] ?? null;

  const showOnAirChrome = view === "home" || view === "parrilla";

  return (
    <div className="app">
      <div className="app__atmosphere" aria-hidden="true" />
      <header className="app__masthead">
        <div className="app__brand-block">
          <p className="app__brand">FluxTV</p>
          <p className="app__tagline">
            Podcast TV · parrilla legal · estilo app podcast
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

      <div className="app__shell">
        <main className="app__main">
          {showOnAirChrome ? (
            <div className="app__primary">
              <OnAirPlayer
                slot={onAir}
                media={onAirMedia}
                nextTitle={nextTitle}
                preferredSinkId={store.settings.preferredAudioSinkId ?? ""}
                onPreferredSinkIdChange={(sinkId) =>
                  setStore((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      preferredAudioSinkId: sinkId || undefined,
                    },
                  }))
                }
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
          ) : null}

          <div className="app__stage">
            {view === "home" ? (
              <aside className="app__side">
                <p className="app__home-hint">
                  Usa el menú derecho: <strong>Podcast TV</strong>, Agregados,
                  Favoritos o el asistente de Parrilla.
                </p>
                <SweepPanel
                  nextLabel={nextSweepLabel(
                    now,
                    store.settings.sweepHoursMadrid,
                  )}
                  intervalLabel={nextIntervalSweepLabel(
                    now,
                    store.settings.sweepIntervalMinutes,
                    store.settings.lastIntervalSweepAt,
                  )}
                  intervalMinutes={store.settings.sweepIntervalMinutes}
                  madridClock={madridClockLabel(now)}
                  sweeping={sweeping}
                  lastLog={lastLog}
                  proposals={filteredProposals.slice(0, 5)}
                  onBarrido={() => void doSweep("manual")}
                  onAddProposal={addProposal}
                  onDismissProposal={dismissProposal}
                />
              </aside>
            ) : null}

            {view === "podcast_tv" || view === "agregados" ? (
              <PodcastTvBrowse
                mode={view}
                feeds={feeds}
                proposals={filteredProposals}
                favoriteFeedIds={store.favorites.feedIds}
                onToggleFeedFavorite={toggleFeedFavorite}
                onEnableFeed={toggleFeed}
                onAddProposal={addProposal}
                onScheduleFeed={scheduleFeed}
                onScheduleProposal={scheduleProposal}
              />
            ) : null}

            {view === "favorites" ? (
              <FavoritesPanel
                media={favoriteMedia}
                feeds={favoriteFeeds}
                onUnfavoriteMedia={toggleMediaFavorite}
                onUnfavoriteFeed={toggleFeedFavorite}
                onScheduleMedia={openAssistantForMedia}
                onScheduleFeed={scheduleFeed}
              />
            ) : null}

            {view === "parrilla" ? (
              <aside className="app__side">
                <ScheduleAssistant
                  key={assistantSeed}
                  media={Object.values(store.media)}
                  initialMediaId={placeMediaId}
                  overlapWarn={overlapWarn}
                  onPlace={({ mediaId, start, durationMin }) =>
                    placeSlotWith(mediaId, start, durationMin)
                  }
                />
                <section className="placer" aria-label="Place slot rápido">
                  <h2 className="placer__title">Atajo rápido</h2>
                  <p className="placer__hint">
                    Misma acción sin el asistente paso a paso.
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
              </aside>
            ) : null}

            {view === "barrido" ? (
              <aside className="app__side app__side--wide">
                <SweepPanel
                  nextLabel={nextSweepLabel(
                    now,
                    store.settings.sweepHoursMadrid,
                  )}
                  intervalLabel={nextIntervalSweepLabel(
                    now,
                    store.settings.sweepIntervalMinutes,
                    store.settings.lastIntervalSweepAt,
                  )}
                  intervalMinutes={store.settings.sweepIntervalMinutes}
                  madridClock={madridClockLabel(now)}
                  sweeping={sweeping}
                  lastLog={lastLog}
                  proposals={filteredProposals}
                  onBarrido={() => void doSweep("manual")}
                  onAddProposal={addProposal}
                  onDismissProposal={dismissProposal}
                />
              </aside>
            ) : null}

            {view === "library" ? (
              <aside className="app__side app__side--wide">
                <MediaLibrary
                  media={mediaList}
                  query={query}
                  onQueryChange={setQuery}
                  onAddUrl={addUrlMedia}
                  onAddMany={addManyMedia}
                  onAddFolder={addFolder}
                />
                <div className="app__fav-row">
                  {mediaList.slice(0, 12).map((m) => {
                    const on = store.favorites.mediaIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={
                          on ? "app__star app__star--on" : "app__star"
                        }
                        onClick={() => toggleMediaFavorite(m.id)}
                      >
                        {on ? "★" : "☆"} {m.title}
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}

            {view === "sources" ? (
              <aside className="app__side app__side--wide">
                <ChannelSources feeds={feeds} onToggle={toggleFeed} />
              </aside>
            ) : null}
          </div>
        </main>

        <SideNav
          active={view}
          onNavigate={setView}
          favoriteCount={favoriteCount}
        />
      </div>

      <footer className="app__footer">
        Legal path only: user URLs, local folders/files, documented public RSS.
        No pirate sites, Digi/Movistar credential scraping, or paywall bypass.
        Podcast TV / Agregados solo listan feeds ya documentados.
      </footer>
    </div>
  );
}
