export type DecodedStream = {
  quality: string;
  url: string;
};

export type PlayableMedia = {
  url: string;
  kind: "hls" | "file";
};

function alphabetFrom(alphabetData: string): string[] {
  const alphabet: string[] = [];
  let step = 0;
  let skip = 0;
  for (const char of alphabetData) {
    if (skip === 0) {
      alphabet.push(char);
      step = (step + 1) % 4;
      skip = step;
    } else {
      skip -= 1;
    }
  }
  return alphabet;
}

function urlFrom(alphabet: string[], urlData: string): string {
  let url = "";
  let takingTens = 0;
  let skip = 3;
  let consumed = 1;
  let value = 0;
  for (const char of urlData) {
    if (takingTens === 0) {
      const digit = Number(char);
      if (!Number.isInteger(digit)) break;
      value = digit * 10;
      takingTens = 1;
    } else if (skip === 0) {
      const digit = Number(char);
      if (!Number.isInteger(digit)) break;
      const glyph = alphabet[value + digit];
      if (glyph === undefined) break;
      url += glyph;
      skip = (consumed + 3) % 4;
      takingTens = 0;
      consumed += 1;
    } else {
      skip -= 1;
    }
  }
  return url;
}

export function decryptZtnr(pngBase64: string): DecodedStream[] {
  try {
    const compact = pngBase64.replace(/\s+/g, "");
    const raw = Buffer.from(compact, "base64");
    const streams: DecodedStream[] = [];
    let offset = 8;
    while (offset + 8 <= raw.length) {
      const length = raw.readUInt32BE(offset);
      const type = raw.subarray(offset + 4, offset + 8).toString("latin1");
      const start = offset + 8;
      const end = start + length;
      if (end + 4 > raw.length) break;
      const data = raw.subarray(start, end);
      offset = end + 4;
      if (type === "IEND") break;
      if (type !== "tEXt") continue;
      const filtered = Buffer.from(Array.from(data).filter((byte) => byte !== 0));
      const hash = filtered.indexOf(0x23);
      if (hash < 0) continue;
      const alphabetData = filtered.subarray(0, hash).toString("latin1");
      const afterHash = filtered.subarray(hash + 1).toString("latin1");
      const marker = afterHash.lastIndexOf("%%");
      const quality = marker >= 0 ? afterHash.slice(0, marker) : "";
      const encodedUrl = marker >= 0 ? afterHash.slice(marker + 2) : afterHash;
      const url = urlFrom(alphabetFrom(alphabetData), encodedUrl);
      if (url.startsWith("http://") || url.startsWith("https://")) {
        streams.push({ quality, url });
      }
    }
    return streams;
  } catch {
    return [];
  }
}

export function pickMedia(streams: DecodedStream[]): PlayableMedia | null {
  const hls = streams.find((stream) => stream.url.includes(".m3u8") && stream.url.startsWith("https://"));
  if (hls) return { url: hls.url, kind: "hls" };
  const anyHls = streams.find((stream) => stream.url.includes(".m3u8"));
  if (anyHls) return { url: anyHls.url, kind: "hls" };
  const file = streams.find((stream) => /\.mp4(\?|$)/i.test(stream.url));
  if (file) return { url: file.url, kind: "file" };
  return null;
}
