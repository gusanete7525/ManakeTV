import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "../types";
import "./ScheduleAssistant.css";

type ScheduleAssistantProps = {
  media: MediaItem[];
  initialMediaId?: string;
  overlapWarn: boolean;
  onPlace: (opts: {
    mediaId: string;
    start: string;
    durationMin: number;
  }) => void;
};

type Step = 1 | 2 | 3;

export function ScheduleAssistant({
  media,
  initialMediaId = "",
  overlapWarn,
  onPlace,
}: ScheduleAssistantProps) {
  const [step, setStep] = useState<Step>(initialMediaId ? 2 : 1);
  const [mediaId, setMediaId] = useState(initialMediaId);
  const [start, setStart] = useState("20:00");
  const [durationMin, setDurationMin] = useState(45);

  useEffect(() => {
    if (!initialMediaId) return;
    setMediaId(initialMediaId);
    setStep(2);
  }, [initialMediaId]);

  const sorted = useMemo(
    () => [...media].sort((a, b) => a.title.localeCompare(b.title)),
    [media],
  );

  const selected = mediaId ? media.find((m) => m.id === mediaId) : undefined;

  function next() {
    if (step === 1 && !mediaId) return;
    if (step < 3) setStep((s) => (s + 1) as Step);
  }

  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  function confirm() {
    if (!mediaId) return;
    onPlace({ mediaId, start, durationMin });
    setStep(1);
  }

  return (
    <section className="assistant" aria-label="Asistente de parrilla">
      <header className="assistant__header">
        <h2 className="assistant__title">Crear en parrilla</h2>
        <p className="assistant__hint">
          Asistente guiado: elige programa → hora → duración.
        </p>
        <ol className="assistant__steps" aria-label="Pasos">
          <li className={step === 1 ? "is-active" : step > 1 ? "is-done" : ""}>
            1. Media
          </li>
          <li className={step === 2 ? "is-active" : step > 2 ? "is-done" : ""}>
            2. Hora
          </li>
          <li className={step === 3 ? "is-active" : ""}>3. Confirmar</li>
        </ol>
      </header>

      {step === 1 ? (
        <div className="assistant__panel">
          <label className="assistant__field">
            <span>Programa / media</span>
            <select
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {sorted.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          {sorted.length === 0 ? (
            <p className="assistant__empty">
              Añade URLs, Barrido o Podcast TV a la biblioteca primero.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="assistant__panel">
          <p className="assistant__picked">
            <strong>{selected?.title ?? "—"}</strong>
          </p>
          <div className="assistant__row">
            <label className="assistant__field">
              <span>Inicio</span>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="assistant__field">
              <span>Minutos</span>
              <input
                type="number"
                min={5}
                max={360}
                value={durationMin}
                onChange={(e) =>
                  setDurationMin(Number(e.target.value) || 30)
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="assistant__panel">
          <ul className="assistant__summary">
            <li>
              <span>Media</span>
              <strong>{selected?.title}</strong>
            </li>
            <li>
              <span>Inicio</span>
              <strong>{start}</strong>
            </li>
            <li>
              <span>Duración</span>
              <strong>{durationMin} min</strong>
            </li>
          </ul>
          {overlapWarn ? (
            <p className="assistant__warn" role="status">
              Puede solaparse con otro slot — se añadirá con aviso.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="assistant__nav">
        <button
          type="button"
          className="assistant__btn assistant__btn--ghost"
          disabled={step === 1}
          onClick={back}
        >
          Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="assistant__btn"
            disabled={step === 1 && !mediaId}
            onClick={next}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            className="assistant__btn"
            disabled={!mediaId}
            onClick={confirm}
          >
            Añadir a parrilla
          </button>
        )}
      </div>
    </section>
  );
}
