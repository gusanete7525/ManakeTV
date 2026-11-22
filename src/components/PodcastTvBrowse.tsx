import { useMemo, useState, type CSSProperties } from "react";
import type { FeedConfig, SweepProposal } from "../types";
import {
  BROWSE_COUNTRIES,
  BROWSE_STATIONS,
  feedsForStation,
  vignetteHue,
  vignetteInitials,
  type BrowseCountry,
  type StationId,
} from "../lib/browseCatalog";
import "./PodcastTvBrowse.css";

type PodcastTvBrowseProps = {
  mode: "podcast_tv" | "agregados";
  feeds: FeedConfig[];
  proposals: SweepProposal[];
  favoriteFeedIds: string[];
  onToggleFeedFavorite: (feedId: string) => void;
  onEnableFeed: (feedId: string, enabled: boolean) => void;
  onAddProposal: (proposalId: string) => void;
  onScheduleFeed: (feedId: string) => void;
  onScheduleProposal: (proposalId: string) => void;
};

export function PodcastTvBrowse({
  mode,
  feeds,
  proposals,
  favoriteFeedIds,
  onToggleFeedFavorite,
  onEnableFeed,
  onAddProposal,
  onScheduleFeed,
  onScheduleProposal,
}: PodcastTvBrowseProps) {
  const [country, setCountry] = useState<BrowseCountry>("ES");
  const [stationId, setStationId] = useState<StationId>("all");

  const stations = useMemo(
    () => BROWSE_STATIONS.filter((s) => s.country === country),
    [country],
  );

  const stationFeeds = useMemo(
    () => feedsForStation(feeds, stationId, country),
    [feeds, stationId, country],
  );

  const publicFeeds = stationFeeds.filter((f) => f.availability === "public_rss");
  const stubs = stationFeeds.filter((f) => f.availability !== "public_rss");

  const stationChannelIds = useMemo(() => {
    const s = BROWSE_STATIONS.find((x) => x.id === stationId);
    return new Set(s?.channelIds ?? []);
  }, [stationId]);

  const stationProposals = useMemo(
    () =>
      proposals
        .filter((p) => p.viable && stationChannelIds.has(p.channelId))
        .slice(0, 24),
    [proposals, stationChannelIds],
  );

  const title =
    mode === "podcast_tv" ? "Podcast TV" : "Agregados";
  const subtitle =
    mode === "podcast_tv"
      ? "Programación a la carta de radio/TV vía RSS públicos — viñetas por programa."
      : "Explora podcasts nuevos por país y emisora (solo fuentes legales documentadas).";

  return (
    <section className="ptv" aria-label={title}>
      <header className="ptv__header">
        <h2 className="ptv__title">{title}</h2>
        <p className="ptv__hint">{subtitle}</p>
      </header>

      <div className="ptv__filters">
        <label className="ptv__field">
          <span>País</span>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as BrowseCountry);
              setStationId("all");
            }}
          >
            {BROWSE_COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="ptv__stations" role="list">
          {stations.map((s) => (
            <button
              key={s.id}
              type="button"
              role="listitem"
              className={
                stationId === s.id
                  ? "ptv__chip ptv__chip--active"
                  : "ptv__chip"
              }
              onClick={() => setStationId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="ptv__station-blurb">
          {stations.find((s) => s.id === stationId)?.blurb}
        </p>
      </div>

      <h3 className="ptv__section">Programas (viñetas)</h3>
      <div className="ptv__grid">
        {publicFeeds.map((feed) => (
          <VignetteCard
            key={feed.id}
            title={feed.label}
            meta={`${feed.availability} · ${feed.enabled ? "activo" : "off"}`}
            seed={feed.id}
            favorited={favoriteFeedIds.includes(feed.id)}
            onFavorite={() => onToggleFeedFavorite(feed.id)}
            primaryLabel={feed.enabled ? "En Barrido" : "Activar"}
            onPrimary={() => onEnableFeed(feed.id, !feed.enabled)}
            secondaryLabel="A parrilla"
            onSecondary={() => onScheduleFeed(feed.id)}
          />
        ))}
        {stubs.map((feed) => (
          <VignetteCard
            key={feed.id}
            title={feed.label}
            meta="stub · sin API pública"
            seed={feed.id}
            muted
            favorited={favoriteFeedIds.includes(feed.id)}
            onFavorite={() => onToggleFeedFavorite(feed.id)}
            primaryLabel="Stub"
            onPrimary={() => undefined}
            primaryDisabled
          />
        ))}
        {publicFeeds.length === 0 && stubs.length === 0 ? (
          <p className="ptv__empty">No hay feeds para este filtro.</p>
        ) : null}
      </div>

      <h3 className="ptv__section">Novedades del Barrido</h3>
      <div className="ptv__grid">
        {stationProposals.length === 0 ? (
          <p className="ptv__empty">
            Sin propuestas aún. Activa feeds y lanza Barrido (o espera el
            intervalo).
          </p>
        ) : (
          stationProposals.map((p) => (
            <VignetteCard
              key={p.id}
              title={p.title}
              meta={p.summary?.slice(0, 80) || p.feedId}
              seed={p.canonicalKey}
              primaryLabel="A biblioteca"
              onPrimary={() => onAddProposal(p.id)}
              secondaryLabel="A parrilla"
              onSecondary={() => onScheduleProposal(p.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

type VignetteCardProps = {
  title: string;
  meta: string;
  seed: string;
  favorited?: boolean;
  muted?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onFavorite?: () => void;
};

function VignetteCard({
  title,
  meta,
  seed,
  favorited,
  muted,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  onFavorite,
}: VignetteCardProps) {
  const hue = vignetteHue(seed);
  const initials = vignetteInitials(title);
  return (
    <article
      className={muted ? "vignette vignette--muted" : "vignette"}
      style={
        {
          "--vignette-hue": String(hue),
        } as CSSProperties
      }
    >
      <div className="vignette__cover" aria-hidden="true">
        <span>{initials}</span>
      </div>
      <div className="vignette__body">
        <h4 className="vignette__title">{title}</h4>
        <p className="vignette__meta">{meta}</p>
        <div className="vignette__actions">
          {onFavorite ? (
            <button
              type="button"
              className={
                favorited
                  ? "vignette__fav vignette__fav--on"
                  : "vignette__fav"
              }
              aria-pressed={favorited}
              aria-label={favorited ? "Quitar de favoritos" : "Favorito"}
              onClick={onFavorite}
            >
              ★
            </button>
          ) : null}
          <button
            type="button"
            className="vignette__btn"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              className="vignette__btn vignette__btn--ghost"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
