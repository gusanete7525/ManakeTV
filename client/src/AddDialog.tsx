import { useEffect, useRef, useState } from "react";
import { dateKey, suggestStartTime } from "./schedule";
import { WEEKDAYS } from "./format";
import { kindLabel, type MediaKind, type PlaylistItem } from "./station";

export type Draft = {
  title: string;
  subtitle: string;
  thumbnail: string;
  pageUrl: string;
  kind: MediaKind;
  source: "rtve" | "url";
  videoId: string | null;
  mediaUrl: string | null;
  durationSec: number;
};

type AddDialogProps = {
  draft: Draft;
  items: PlaylistItem[];
  now: Date;
  onCancel: () => void;
  onConfirm: (item: PlaylistItem) => void;
};

type RepeatMode = "weekly" | "once";

export function AddDialog({ draft, items, now, onCancel, onConfirm }: AddDialogProps) {
  const timeRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(draft.title);
  const [kind, setKind] = useState<MediaKind>(draft.kind);
  const [startTime, setStartTime] = useState(() => suggestStartTime(items, now, now));
  const [minutes, setMinutes] = useState(Math.max(1, Math.round(draft.durationSec / 60)));
  const [mode, setMode] = useState<RepeatMode>("weekly");
  const [days, setDays] = useState<number[]>([now.getDay()]);
  const [date, setDate] = useState(dateKey(now));
  const [error, setError] = useState<string | null>(null);

  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    timeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleDay(day: number) {
    setDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function confirm() {
    const durationSec = Math.round(minutes * 60);
    if (!title.trim()) {
      setError("Ponle un título.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      setError("La hora no es válida.");
      return;
    }
    if (!Number.isFinite(durationSec) || durationSec < 60) {
      setError("La duración mínima es un minuto.");
      return;
    }
    if (mode === "weekly" && days.length === 0) {
      setError("Elige al menos un día.");
      return;
    }
    if (mode === "once" && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Elige la fecha.");
      return;
    }
    onConfirm({
      id: crypto.randomUUID(),
      title: title.trim(),
      subtitle: draft.subtitle,
      thumbnail: draft.thumbnail,
      pageUrl: draft.pageUrl,
      kind,
      durationSec,
      startTime,
      days: mode === "weekly" ? days : [],
      date: mode === "once" ? date : null,
      source: draft.source,
      videoId: draft.videoId,
      mediaUrl: draft.mediaUrl,
    });
  }

  return (
    <div className="dialog-back" role="presentation" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="kicker">Playlist</p>
        <h2 id="add-title">¿A qué hora entra?</h2>
        <p className="lede">Las horas son las de tu reloj. La antena salta a esa pieza cuando llega el momento.</p>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} />
        </label>
        <div className="split">
          <label>
            Hora
            <input
              ref={timeRef}
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          <label>
            Minutos
            <input
              type="number"
              min={1}
              max={480}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
            />
          </label>
        </div>
        <label>
          Tipo
          <select value={kind} onChange={(event) => setKind(event.target.value as MediaKind)}>
            <option value="replay">{kindLabel("replay")}</option>
            <option value="pelicula">{kindLabel("pelicula")}</option>
            <option value="enlace">{kindLabel("enlace")}</option>
          </select>
        </label>
        <fieldset>
          <legend>Cuándo</legend>
          <div className="mode-row">
            <button type="button" className={mode === "weekly" ? "chip on" : "chip"} onClick={() => setMode("weekly")}>
              Cada semana
            </button>
            <button type="button" className={mode === "once" ? "chip on" : "chip"} onClick={() => setMode("once")}>
              Solo una fecha
            </button>
          </div>
          {mode === "weekly" ? (
            <>
              <div className="days">
                {WEEKDAYS.map((entry) => (
                  <button
                    key={entry.day}
                    type="button"
                    className={days.includes(entry.day) ? "day on" : "day"}
                    aria-pressed={days.includes(entry.day)}
                    onClick={() => toggleDay(entry.day)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="mode-row">
                <button type="button" className="texty" onClick={() => setDays([now.getDay()])}>
                  Solo hoy
                </button>
                <button type="button" className="texty" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>
                  Toda la semana
                </button>
              </div>
            </>
          ) : (
            <label>
              Fecha
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          )}
        </fieldset>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dialog-actions">
          <button type="button" className="texty" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="primary" data-testid="confirm-add" onClick={confirm}>
            Añadir a la playlist
          </button>
        </div>
      </div>
    </div>
  );
}
