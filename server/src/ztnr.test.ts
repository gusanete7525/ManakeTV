import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decryptZtnr, pickMedia } from "./ztnr";

describe("ztnr", () => {
  it("recovers the HLS address hidden in the RTVE thumbnail", () => {
    const png = readFileSync(new URL("./fixtures/sample.b64", import.meta.url), "utf8");
    const media = pickMedia(decryptZtnr(png));
    expect(media?.kind).toBe("hls");
    expect(media?.url).toContain("https://");
    expect(media?.url).toContain("rtve.es");
    expect(media?.url).toContain(".m3u8");
    expect(media?.url).toContain("idasset=5138288");
  });

  it("returns nothing for an empty payload", () => {
    expect(decryptZtnr("")).toEqual([]);
    expect(pickMedia([])).toBeNull();
  });
});
