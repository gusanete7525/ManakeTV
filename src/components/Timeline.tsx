import type { MediaItem, ScheduleSlot } from "../types";
import "./Timeline.css";

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 06:00–24:00

type TimelineProps = {
  slots: ScheduleSlot[];
  media: Record<string, MediaItem>;
  now: Date;
  onSelectSlot: (slotId: string | null) => void;
  selectedSlotId: string | null;
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
  onSelectSlot,
  selectedSlotId,
}: TimelineProps) {
  const nowOffset = Math.min(
    Math.max(minutesFromDayStart(now, DAY_START), 0),
    DAY_MINUTES,
  );
  const nowPct = (nowOffset / DAY_MINUTES) * 100;

  return (
    <section className="timeline" aria-label="Day schedule">
      <header className="timeline__header">
        <h2 className="timeline__title">Schedule</h2>
        <p className="timeline__hint">
          Drop slots on the day grid — start time + media. Drag/edit comes in
          Phase 1.
        </p>
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
            <button
              type="button"
              className="timeline__empty"
              onClick={() => onSelectSlot(null)}
            >
              No slots yet — add media, then place a slot (coming next).
            </button>
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
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="listitem"
                  className={
                    selected
                      ? "timeline__slot timeline__slot--selected"
                      : "timeline__slot"
                  }
                  style={{ top: `${top}%`, height: `${height}%` }}
                  onClick={() => onSelectSlot(slot.id)}
                >
                  <span className="timeline__slot-time">
                    {start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="timeline__slot-title">
                    {item?.title ?? "Missing media"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
