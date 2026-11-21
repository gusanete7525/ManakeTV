import { countdown, formatClock, formatDuration, formatLongDate, formatRange, formatTime } from "./format";
import { Player } from "./Player";
import { resolveOnAir } from "./schedule";
import { kindLabel, type PlaylistItem, type Station } from "./station";

type AntennaProps = {
  station: Station;
  now: Date;
  previewId: string | null;
  onOpenCatalog: () => void;
  onStopPreview: () => void;
};

export function Antenna({ station, now, previewId, onOpenCatalog, onStopPreview }: AntennaProps) {
  const air = resolveOnAir(station.items, now);
  const preview = previewId ? station.items.find((item) => item.id === previewId) ?? null : null;
  const currentItem = air.current ? station.items.find((item) => item.id === air.current?.item.id) ?? null : null;
  const playing = preview ?? currentItem;
  const offsetSec = preview ? 0 : air.current?.offsetSec ?? 0;
  const slotStart = preview ? null : air.current?.start ?? null;
  const slotEnd = preview ? null : air.current?.end ?? null;
  const slotKey = preview
    ? `preview:${preview.id}`
    : air.current
      ? `${air.current.item.id}@${air.current.start.toISOString()}`
      : "";

  return (
    <section className="antenna">
      <div className="antenna-main">
        {playing && slotKey ? (
          <>
            {preview ? (
              <div className="banner">
                <p>Prueba desde el principio. La carta sigue su hora.</p>
                <button type="button" onClick={onStopPreview}>
                  Volver a la emisión
                </button>
              </div>
            ) : null}
            <Player
              key={slotKey}
              source={{
                slotKey,
                title: playing.title,
                pageUrl: playing.pageUrl,
                offsetSec,
                source: playing.source,
                videoId: playing.videoId,
                mediaUrl: playing.mediaUrl,
              }}
              endsLabel={slotEnd ? formatTime(slotEnd) : "que termine"}
            />
            <div className="now-card">
              <p className="kicker">{preview ? "Prueba" : "Ahora"}</p>
              <h2 data-testid="on-air-title">{playing.title}</h2>
              <p className="meta">
                {playing.subtitle ? `${playing.subtitle} · ` : ""}
                {kindLabel(playing.kind)}
                {slotStart && slotEnd ? ` · ${formatRange(slotStart, slotEnd)}` : ""}
                {` · ${formatDuration(playing.durationSec)}`}
              </p>
              {air.current && !preview ? (
                <div className="progress" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (offsetSec / playing.durationSec) * 100)}%` }} />
                </div>
              ) : null}
              {air.current && !preview ? (
                <p className="quiet">
                  Vas por el minuto {Math.floor(offsetSec / 60)} de {Math.max(1, Math.round(playing.durationSec / 60))}.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="silence" data-testid="silence">
            <p className="kicker">En antena</p>
            <h2>{air.next ? "Ahora mismo no hay nada en emisión." : "Hoy la antena está en silencio."}</h2>
            {air.next ? (
              <p>
                La siguiente entra a las {formatTime(air.next.start)} · {air.next.item.title} · dentro de{" "}
                {countdown(now, air.next.start)}.
              </p>
            ) : (
              <p>Elige una pieza del catálogo y ponle una hora. Cuando llegue ese momento, entra sola.</p>
            )}
            <button type="button" className="primary" onClick={onOpenCatalog}>
              Abrir el catálogo
            </button>
          </div>
        )}
      </div>
      <aside className="rundown">
        <p className="kicker">Carta de hoy</p>
        <h3>{formatLongDate(now)}</h3>
        <p className="clock">{formatClock(now)}</p>
        {air.today.length === 0 ? (
          <p className="quiet">Este día no tiene piezas que empiecen hoy.</p>
        ) : (
          <ol>
            {air.today.map((occurrence) => {
              const current = air.current?.item.id === occurrence.item.id && air.current.start.getTime() === occurrence.start.getTime();
              return (
                <li key={`${occurrence.item.id}-${occurrence.start.toISOString()}`} className={current ? "on" : ""}>
                  <time>{formatTime(occurrence.start)}</time>
                  <div>
                    <strong>{occurrence.item.title}</strong>
                    <span>
                      {formatDuration(occurrence.item.durationSec)}
                      {current ? " · en curso" : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </aside>
    </section>
  );
}

export function somethingIsOnAir(items: PlaylistItem[], now: Date): boolean {
  return resolveOnAir(items, now).current !== null;
}
