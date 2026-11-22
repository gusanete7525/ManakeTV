import type { SweepLogEntry, SweepProposal } from "../types";
import { CHANNEL_LABELS } from "../lib/feeds";
import "./SweepPanel.css";

type SweepPanelProps = {
  nextLabel: string;
  intervalLabel: string;
  intervalMinutes: number;
  madridClock: string;
  sweeping: boolean;
  lastLog: SweepLogEntry | null;
  proposals: SweepProposal[];
  onBarrido: () => void;
  onAddProposal: (id: string) => void;
  onDismissProposal: (id: string) => void;
};

export function SweepPanel({
  nextLabel,
  intervalLabel,
  intervalMinutes,
  madridClock,
  sweeping,
  lastLog,
  proposals,
  onBarrido,
  onAddProposal,
  onDismissProposal,
}: SweepPanelProps) {
  return (
    <section className="sweep" aria-label="Barrido">
      <header className="sweep__header">
        <h2 className="sweep__title">Barrido</h2>
        <p className="sweep__hint">
          Podcast feeds refresh about every {intervalMinutes} min while open,
          plus 10:00 · 16:00 · 22:00 Europe/Madrid. Dedupes by canonical
          URL/title; skips dead links. No Digi/Movistar login.
        </p>
      </header>

      <div className="sweep__meta">
        <span>Madrid {madridClock}</span>
        <span>Next daily {nextLabel}</span>
        <span>Next interval {intervalLabel}</span>
      </div>

      <button
        type="button"
        className="sweep__btn"
        disabled={sweeping}
        onClick={onBarrido}
      >
        {sweeping ? "Barriendo…" : "Barrido ahora"}
      </button>

      {lastLog ? (
        <p className="sweep__log">
          Last ({lastLog.trigger}): +{lastLog.proposed} proposed ·{" "}
          {lastLog.skippedDead} dead · {lastLog.skippedDupe} dupes
          {lastLog.errors.length
            ? ` · ${lastLog.errors.length} feed error(s)`
            : ""}
        </p>
      ) : null}

      {lastLog?.errors.length ? (
        <ul className="sweep__errors">
          {lastLog.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      <ul className="sweep__list">
        {proposals.length === 0 ? (
          <li className="sweep__empty">No new proposals.</li>
        ) : (
          proposals.map((p) => (
            <li key={p.id} className="sweep__item">
              <div>
                <strong>{p.title}</strong>
                <span className="sweep__meta-line">
                  {CHANNEL_LABELS[p.channelId]} · viable
                </span>
              </div>
              <div className="sweep__actions">
                <button type="button" onClick={() => onAddProposal(p.id)}>
                  Add to library
                </button>
                <button
                  type="button"
                  className="sweep__dismiss"
                  onClick={() => onDismissProposal(p.id)}
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
