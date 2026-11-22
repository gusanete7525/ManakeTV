import type { ChannelId, FeedConfig } from "../types";

/** Country codes for legal public-feed browsing (no invented catalogs). */
export type BrowseCountry = "ES";

export type StationId =
  | "all"
  | "onda_cero"
  | "cadena_ser"
  | "cope"
  | "tve1"
  | "europa_fm"
  | "melodia_fm"
  | "tdt_stub";

export type StationMeta = {
  id: StationId;
  label: string;
  country: BrowseCountry;
  channelIds: ChannelId[];
  /** Short blurb — public RSS / stub only */
  blurb: string;
};

export const BROWSE_COUNTRIES: { id: BrowseCountry; label: string }[] = [
  { id: "ES", label: "España" },
];

/**
 * Agregados-style stations. Only maps onto documented feeds in feeds.ts —
 * never Digi/Movistar/atomohd indexes.
 */
export const BROWSE_STATIONS: StationMeta[] = [
  {
    id: "all",
    label: "Todos",
    country: "ES",
    channelIds: [
      "onda_cero",
      "cadena_ser",
      "cope",
      "tve1",
      "europa_fm",
      "melodia_fm",
      "antena3",
      "cuatro",
      "telecinco",
      "lasexta",
    ],
    blurb: "Todos los feeds públicos y stubs documentados.",
  },
  {
    id: "onda_cero",
    label: "Onda Cero",
    country: "ES",
    channelIds: ["onda_cero"],
    blurb: "Podcasts oficiales Atresmedia Radio (RSS público).",
  },
  {
    id: "cadena_ser",
    label: "Cadena SER",
    country: "ES",
    channelIds: ["cadena_ser"],
    blurb: "PlaySER podcast.xml públicos.",
  },
  {
    id: "cope",
    label: "COPE",
    country: "ES",
    channelIds: ["cope"],
    blurb: "RSS de audio documentados en cope.es.",
  },
  {
    id: "tve1",
    label: "RTVE / RNE",
    country: "ES",
    channelIds: ["tve1"],
    blurb: "audios.rss / temáticas públicas de RTVE.",
  },
  {
    id: "europa_fm",
    label: "Europa FM",
    country: "ES",
    channelIds: ["europa_fm"],
    blurb: "Triton podcast RSS oficiales.",
  },
  {
    id: "melodia_fm",
    label: "Melodía FM",
    country: "ES",
    channelIds: ["melodia_fm"],
    blurb: "Podcast RSS oficial Melodía FM.",
  },
  {
    id: "tdt_stub",
    label: "TDT (stub)",
    country: "ES",
    channelIds: ["antena3", "cuatro", "telecinco", "lasexta"],
    blurb: "Sin API pública de catch-up — stub; pega URLs legales.",
  },
];

export function stationForChannel(channelId: ChannelId): StationMeta | undefined {
  return BROWSE_STATIONS.find(
    (s) => s.id !== "all" && s.channelIds.includes(channelId),
  );
}

export function feedsForStation(
  feeds: FeedConfig[],
  stationId: StationId,
  country: BrowseCountry = "ES",
): FeedConfig[] {
  const station = BROWSE_STATIONS.find((s) => s.id === stationId);
  if (!station || station.country !== country) return [];
  const allowed = new Set(station.channelIds);
  return feeds.filter((f) => allowed.has(f.channelId));
}

/** Deterministic cover tint for vignette tiles (not a scraped image). */
export function vignetteHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function vignetteInitials(label: string): string {
  const parts = label
    .replace(/[—–-].*$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
