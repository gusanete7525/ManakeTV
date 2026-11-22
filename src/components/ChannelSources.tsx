import type { FeedConfig } from "../types";
import { CHANNEL_LABELS } from "../lib/feeds";
import "./ChannelSources.css";

type ChannelSourcesProps = {
  feeds: FeedConfig[];
  onToggle: (feedId: string, enabled: boolean) => void;
};

export function ChannelSources({ feeds, onToggle }: ChannelSourcesProps) {
  return (
    <section className="channels" aria-label="Channel sources">
      <header>
        <h2 className="channels__title">TDT sources</h2>
        <p className="channels__hint">
          Public RSS where documented. Commercial catch-up without a free public
          API stays stubbed — paste your own URLs instead of scraping.
        </p>
      </header>
      <ul className="channels__list">
        {feeds.map((f) => (
          <li key={f.id} className="channels__item">
            <label className="channels__row">
              <input
                type="checkbox"
                checked={f.enabled}
                disabled={f.availability === "stub_no_public_api"}
                onChange={(e) => onToggle(f.id, e.target.checked)}
              />
              <span>
                <strong>{f.label}</strong>
                <span className="channels__badge">
                  {CHANNEL_LABELS[f.channelId]} · {f.availability}
                </span>
                <span className="channels__notes">{f.notes}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
