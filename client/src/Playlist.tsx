import { useState } from "react";
import {
  WEEKDAYS,
  dateFromKey,
  formatDuration,
  formatLongDate,
  formatTime,
  shiftDate,
} from "./format";
import { conflictingIds, coverageOn, dateKey, type Occurrence } from "./schedule";
import { kindLabel, sanitizeStation, type PlaylistItem, type Station } from "./station";

type PlaylistProps = {
  station: Station;
  now: Date;
  onRename: (name: string) => void;
  onChangeItem: (id: string, patch: Partial<PlaylistItem>) => void;
  onRemove: (id: string) => void;
  onReplace: (station: Station) => void;
  onPreview: (id: string) => void;
  onNotify: (message: string) => void;
};

export function Playlist({
  station,
  now,
  onRename,
  onChangeItem,
  onRemove,
  onReplace,
  onPreview,
  onNotify,
}: PlaylistProps) {
  const [viewed, setViewed] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0));
  const occurrences = coverageOn(station.items, viewed);
  const conflicts = conflictingIds(station.items, viewed);
  const viewingToday = dateKey(viewed) === dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  function exportPlaylist() {
    const blob = new Blob([JSON.stringify(station, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manaketv-playlist.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importPlaylist(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = sanitizeStation(JSON.parse(String(reader.result)) as unknown);
        const accepted = window.confirm("Esto sustituye la playlist guardada en este navegador.");
        if (!accepted) return;
        onReplace(next);
        onNotify(`Playlist importada, ${next.items.length} piezas.`);
      } catch {
        onNotify("Ese archivo no es una playlist de ManakeTV.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="sheet">
      <header className="sheet-head">
        <div>
          <p className="kicker">Playlist</p>
          <label className="name-label">
            Nombre del canal
            <input value={station.name} maxLength={40} onChange={(event) => onRename(event.target.value)} />
          </label>
        </div>
        <div className="day-nav">
          <button type="button" onClick={() => setViewed((date) => shiftDate(date, -1))} aria-label="Día anterior">
            ←
          </button>
          <div>
            <strong>{formatLongDate(viewed)}</strong>
            <input
              type="date"
              value={dateKey(viewed)}
              aria-label="Elegir fecha"
              onChange={(event) => {
                const next = dateFromKey(event.target.value);
                if (next) setViewed(next);
              }}
            />
          </div>
          <button type="button" onClick={() => setViewed((date) => shiftDate(date, 1))} aria-label="Día siguiente">
            →
          </button>
          <button type="button" className="texty" onClick={() => setViewed(shiftDate(now, 0))}>
            Hoy
          </button>
        </div>
      </header>
      <p className="lede">
        Cada pieza tiene una hora. Si marcas varios días, entra esa hora todas las semanas. Una fecha suelta se emite
        solo ese día.
      </p>
      <Timeline
        occurrences={occurrences}
        conflicts={conflicts}
        showNow={viewingToday}
        nowMinutes={nowMinutes}
        viewed={viewed}
      />
      {occurrences.length === 0 ? (
        <p className="quiet">Este día está libre. Añade algo desde el catálogo.</p>
      ) : (
        <ul className="rows">
          {occurrences.map((occurrence) => {
            const item = station.items.find((entry) => entry.id === occurrence.item.id);
            if (!item) return null;
            return (
              <Row
                key={`${item.id}-${occurrence.start.toISOString()}`}
                item={item}
                start={occurrence.start}
                viewedKey={dateKey(viewed)}
                conflict={conflicts.has(item.id)}
                continued={occurrence.continued}
                onChangeItem={onChangeItem}
                onRemove={onRemove}
                onPreview={onPreview}
              />
            );
          })}
        </ul>
      )}
      <div className="io">
        <button type="button" onClick={exportPlaylist}>
          Exportar
        </button>
        <label className="file">
          Importar
          <input
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) importPlaylist(file);
            }}
          />
        </label>
      </div>
    </section>
  );
}

function Timeline({
  occurrences,
  conflicts,
  showNow,
  nowMinutes,
  viewed,
}: {
  occurrences: Array<Occurrence & { continued: boolean }>;
  conflicts: Set<string>;
  showNow: boolean;
  nowMinutes: number;
  viewed: Date;
}) {
  return (
    <div className="timeline">
      <div className="hours">
        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
          <span key={hour} style={{ left: `${(hour / 24) * 100}%` }}>
            {String(hour).padStart(2, "0")}
          </span>
        ))}
      </div>
      <div className="track">
        {occurrences.map((occurrence) => {
          const dayStart = new Date(viewed.getFullYear(), viewed.getMonth(), viewed.getDate()).getTime();
          const dayEnd = dayStart + 24 * 60 * 60 * 1000;
          const visibleStart = Math.max(occurrence.start.getTime(), dayStart);
          const visibleEnd = Math.min(occurrence.end.getTime(), dayEnd);
          const left = ((visibleStart - dayStart) / (dayEnd - dayStart)) * 100;
          const width = Math.max(1.2, ((visibleEnd - visibleStart) / (dayEnd - dayStart)) * 100);
          return (
            <div
              key={`${occurrence.item.id}-${occurrence.start.toISOString()}`}
              className={conflicts.has(occurrence.item.id) ? "block clash" : "block"}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={occurrence.continued ? `${occurrence.item.title} (sigue desde ayer)` : occurrence.item.title}
            >
              {occurrence.item.title}
            </div>
          );
        })}
        {showNow ? <div className="now-line" style={{ left: `${(nowMinutes / 1440) * 100}%` }} /> : null}
      </div>
    </div>
  );
}

function Row({
  item,
  start,
  viewedKey,
  conflict,
  continued,
  onChangeItem,
  onRemove,
  onPreview,
}: {
  item: PlaylistItem;
  start: Date;
  viewedKey: string;
  conflict: boolean;
  continued: boolean;
  onChangeItem: (id: string, patch: Partial<PlaylistItem>) => void;
  onRemove: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const oneShot = item.date !== null;
  return (
    <li className={conflict ? "row clash" : "row"}>
      <div className="row-main">
        <time>{formatTime(start)}</time>
        {item.thumbnail ? <img src={item.thumbnail} alt="" /> : <div className="thumb" />}
        <div>
          <strong>{item.title}</strong>
          <span>
            {item.subtitle ? `${item.subtitle} · ` : ""}
            {kindLabel(item.kind)} · {formatDuration(item.durationSec)}
            {oneShot ? ` · solo el ${item.date}` : ""}
            {continued ? " · sigue desde ayer" : ""}
          </span>
        </div>
      </div>
      {conflict ? <p className="form-error">Se pisa con otra pieza de este día.</p> : null}
      {item.days.length === 0 && !item.date ? <p className="form-error">No está en ningún día.</p> : null}
      <div className="row-edit">
        <label>
          Hora
          <input
            type="time"
            value={item.startTime}
            onChange={(event) => onChangeItem(item.id, { startTime: event.target.value })}
          />
        </label>
        <label>
          Min
          <input
            type="number"
            min={1}
            max={480}
            value={Math.max(1, Math.round(item.durationSec / 60))}
            onChange={(event) => onChangeItem(item.id, { durationSec: Math.round(Number(event.target.value) * 60) })}
          />
        </label>
        <div className="days">
          {WEEKDAYS.map((entry) => (
            <button
              key={entry.day}
              type="button"
              className={!oneShot && item.days.includes(entry.day) ? "day on" : "day"}
              aria-pressed={!oneShot && item.days.includes(entry.day)}
              onClick={() => {
                const days = item.days.includes(entry.day)
                  ? item.days.filter((day) => day !== entry.day)
                  : [...item.days, entry.day];
                onChangeItem(item.id, { days, date: null });
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={oneShot ? "chip on" : "chip"}
          onClick={() =>
            onChangeItem(
              item.id,
              oneShot ? { date: null, days: [start.getDay()] } : { date: viewedKey, days: [] },
            )
          }
        >
          Solo esta fecha
        </button>
        <button type="button" onClick={() => onPreview(item.id)}>
          Probar
        </button>
        <button type="button" className="danger" onClick={() => onRemove(item.id)}>
          Quitar
        </button>
      </div>
    </li>
  );
}
