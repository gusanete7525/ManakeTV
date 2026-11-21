import { describe, expect, it } from "vitest";
import { sanitizeItem, sanitizeStation } from "./station";

describe("sanitizeStation", () => {
  it("keeps a direct https video and drops a script url", () => {
    const station = sanitizeStation({
      name: "  Noche  ",
      items: [
        {
          id: "ok",
          title: "Archivo",
          subtitle: "",
          thumbnail: "",
          pageUrl: "",
          kind: "enlace",
          durationSec: 600,
          startTime: "21:05",
          days: [1, 1, 8],
          date: null,
          source: "url",
          videoId: null,
          mediaUrl: "https://example.com/peli.mp4",
        },
        {
          id: "bad",
          title: "Mala",
          subtitle: "",
          thumbnail: "",
          pageUrl: "",
          kind: "enlace",
          durationSec: 600,
          startTime: "22:00",
          days: [1],
          date: null,
          source: "url",
          videoId: null,
          mediaUrl: "javascript:alert(1)",
        },
      ],
    });
    expect(station.name).toBe("Noche");
    expect(station.items).toHaveLength(1);
    expect(station.items[0]?.mediaUrl).toBe("https://example.com/peli.mp4");
    expect(station.items[0]?.days).toEqual([1]);
    expect(station.items[0]?.startTime).toBe("21:05");
  });

  it("requires an RTVE id for catalog pieces", () => {
    expect(
      sanitizeItem({
        id: "x",
        title: "Telediario",
        durationSec: 1800,
        startTime: "15:00",
        days: [1],
        date: null,
        source: "rtve",
        videoId: "no",
      }),
    ).toBeNull();
  });
});
