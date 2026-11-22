import type { CSSProperties } from "react";
import type { FeedConfig, MediaItem } from "../types";
import { vignetteHue, vignetteInitials } from "../lib/browseCatalog";
import "./FavoritesPanel.css";

type FavoritesPanelProps = {
  media: MediaItem[];
  feeds: FeedConfig[];
  onUnfavoriteMedia: (mediaId: string) => void;
  onUnfavoriteFeed: (feedId: string) => void;
  onScheduleMedia: (mediaId: string) => void;
  onScheduleFeed: (feedId: string) => void;
};

export function FavoritesPanel({
  media,
  feeds,
  onUnfavoriteMedia,
  onUnfavoriteFeed,
  onScheduleMedia,
  onScheduleFeed,
}: FavoritesPanelProps) {
  return (
    <section className="favs" aria-label="Favoritos">
      <header className="favs__header">
        <h2 className="favs__title">Favoritos</h2>
        <p className="favs__hint">
          Programas y medias que marcaste con ★ — mismo estilo de viñetas.
        </p>
      </header>

      <h3 className="favs__section">Medias</h3>
      <div className="favs__grid">
        {media.length === 0 ? (
          <p className="favs__empty">Aún no hay medias favoritas.</p>
        ) : (
          media.map((m) => (
            <article
              key={m.id}
              className="fav-card"
              style={
                {
                  "--vignette-hue": String(vignetteHue(m.id)),
                } as CSSProperties
              }
            >
              <div className="fav-card__cover" aria-hidden="true">
                {vignetteInitials(m.title)}
              </div>
              <div className="fav-card__body">
                <strong>{m.title}</strong>
                <span>{m.sourceKind}</span>
                <div className="fav-card__actions">
                  <button type="button" onClick={() => onScheduleMedia(m.id)}>
                    A parrilla
                  </button>
                  <button
                    type="button"
                    className="fav-card__ghost"
                    onClick={() => onUnfavoriteMedia(m.id)}
                  >
                    Quitar ★
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <h3 className="favs__section">Feeds / programas</h3>
      <div className="favs__grid">
        {feeds.length === 0 ? (
          <p className="favs__empty">Marca programas en Podcast TV / Agregados.</p>
        ) : (
          feeds.map((f) => (
            <article
              key={f.id}
              className="fav-card"
              style={
                {
                  "--vignette-hue": String(vignetteHue(f.id)),
                } as CSSProperties
              }
            >
              <div className="fav-card__cover" aria-hidden="true">
                {vignetteInitials(f.label)}
              </div>
              <div className="fav-card__body">
                <strong>{f.label}</strong>
                <span>{f.availability}</span>
                <div className="fav-card__actions">
                  <button type="button" onClick={() => onScheduleFeed(f.id)}>
                    A parrilla
                  </button>
                  <button
                    type="button"
                    className="fav-card__ghost"
                    onClick={() => onUnfavoriteFeed(f.id)}
                  >
                    Quitar ★
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
