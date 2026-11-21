import { describe, expect, it } from "vitest";
import { conflictingIds, coverageOn, resolveOnAir, suggestStartTime, type AirItem } from "./schedule";

function at(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

const saturdayFilm: AirItem = {
  id: "film",
  title: "Bienvenido Mister Marshall",
  startTime: "23:30",
  durationSec: 7200,
  days: [],
  date: "2026-11-21",
};

describe("resolveOnAir", () => {
  it("keeps a piece that started yesterday and spills past midnight", () => {
    const air = resolveOnAir([saturdayFilm], at(2026, 11, 22, 0, 30));
    expect(air.current?.item.id).toBe("film");
    expect(air.current?.offsetSec).toBe(3600);
    expect(air.today).toHaveLength(0);
  });

  it("plays the weekly slot and points at the next day", () => {
    const weekly: AirItem = {
      id: "news",
      title: "Telediario",
      startTime: "21:00",
      durationSec: 3600,
      days: [6],
      date: null,
    };
    const later: AirItem = {
      id: "sunday",
      title: "Domingo",
      startTime: "22:00",
      durationSec: 1800,
      days: [0],
      date: null,
    };
    const during = resolveOnAir([weekly, later], at(2026, 11, 21, 21, 10));
    expect(during.current?.item.id).toBe("news");
    expect(during.current?.offsetSec).toBe(600);
    expect(during.next?.item.id).toBe("sunday");

    const after = resolveOnAir([weekly, later], at(2026, 11, 21, 23, 0));
    expect(after.current).toBeNull();
    expect(after.next?.item.id).toBe("sunday");
  });

  it("shows a late film on the next morning as a continuation", () => {
    const sunday = coverageOn([saturdayFilm], at(2026, 11, 22, 12, 0));
    expect(sunday).toHaveLength(1);
    expect(sunday[0]?.continued).toBe(true);
    expect(sunday[0]?.item.id).toBe("film");
  });

  it("does not repeat a one-shot the following week", () => {
    const air = resolveOnAir([saturdayFilm], at(2026, 11, 28, 23, 40));
    expect(air.current).toBeNull();
  });

  it("marks overlapping pieces and suggests the latest end", () => {
    const first: AirItem = { id: "a", title: "A", startTime: "21:00", durationSec: 7200, days: [6], date: null };
    const second: AirItem = { id: "b", title: "B", startTime: "21:30", durationSec: 1800, days: [6], date: null };
    const day = at(2026, 11, 21, 12, 0);
    expect(conflictingIds([first, second], day)).toEqual(new Set(["a", "b"]));
    expect(suggestStartTime([first, second], day, day)).toBe("23:00");
  });

  it("suggests the next quarter hour when the day is empty and it is today", () => {
    const now = at(2026, 11, 21, 18, 7);
    expect(suggestStartTime([], now, now)).toBe("18:15");
  });
});
