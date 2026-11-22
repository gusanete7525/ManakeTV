import type { MediaItem, ScheduleSlot } from "../types";
import type { OverlapPair } from "../lib/overlap";
import "./Timeline.css";

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 06:00–24:00

type TimelineProps = {
  slots: ScheduleSlot[];
  media: Record<string, MediaItem>;
  now: Date;
  overlaps: OverlapPair[];
  onSelectSlot: (slotId: string | null) => void;
  selectedSlotId: string | null;
  onRemoveSlot: (slotId: string) => void;
};

function minutesFromDayStart(date: Date, dayStartHour: number): number {
  return (date.getHours() - dayStartHour) * 60 + date.getMinutes();
}

const DAY_START = 6;
const DAY_MINUTES = HOURS.length * 60;

export function Timeline({
  slots,
  media,
  now,
  overlaps,
  onSelectSlot,
  selectedSlotId,
  onRemoveSlot,
}: TimelineProps) {
  const nowOffset = Math.min(
    Math.max(minutesFromDayStart(now, DAY_START), 0),
    DAY_MINUTES,
  );
  const nowPct = (nowOffset / DAY_MINUTES) * 100;
  const overlapIds = new Set(
    overlaps.flatMap((p) => [p.a.id, p.b.id]),
  );

  return (
    <section className="timeline" aria-label="Day schedule">
      <header className="timeline__header">
        <h2 className="timeline__title">Schedule</h2>
        <p className="timeline__hint">
          Wall-clock day grid — place items at times like 14:00 or 22:00.
        </p>
        {overlaps.length > 0 ? (
          <p className="timeline__warn" role="status">
            Overlap warning: {overlaps.length} pair(s) share time. Soft-allowed —
            fix before going on air.
          </p>
        ) : null}
      </header>

      <div className="timeline__rail" role="list">
        <div className="timeline__hours" aria-hidden="true">
          {HOURS.map((h) => (
            <div key={h} className="timeline__hour">
              <span>{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        <div className="timeline__track">
          <div
            className="timeline__now"
            style={{ top: `${nowPct}%` }}
            aria-hidden="true"
          >
            <span className="timeline__now-label">NOW</span>
          </div>

          {slots.length === 0 ? (
            <div className="timeline__empty">
              No slots yet — add media, then place a start time + duration.
            </div>
          ) : (
            slots.map((slot) => {
              const start = new Date(slot.startAt);
              const end = new Date(slot.endAt);
              const top =
                (minutesFromDayStart(start, DAY_START) / DAY_MINUTES) * 100;
              const height = Math.max(
                ((end.getTime() - start.getTime()) / 60000 / DAY_MINUTES) *
                  100,
                2,
              );
              const item = media[slot.mediaId];
              const selected = slot.id === selectedSlotId;
              const overlapping = overlapIds.has(slot.id);
              return (
                <div
                  key={slot.id}
                  role="listitem"
                  className={[
                    "timeline__slot",
                    selected ? "timeline__slot--selected" : "",
                    overlapping ? "timeline__slot--overlap" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <button
                    type="button"
                    className="timeline__slot-main"
                    onClick={() => onSelectSlot(slot.id)}
                  >
                    <span className="timeline__slot-time">
                      {start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" – "}
                      {end.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="timeline__slot-title">
                      {item?.title ?? "Missing media"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="timeline__slot-remove"
                    aria-label="Remove slot"
                    onClick={() => onRemoveSlot(slot.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
