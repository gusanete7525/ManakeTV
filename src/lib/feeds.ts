import type { ChannelId, FeedConfig } from "../types";
import { newId } from "../types";

/**
 * Documented public / stub channel sources.
 * RTVE/RNE: official public program RSS (audios / topic feeds).
 * Onda Cero / Europa FM / Melodía FM: official public Atresmedia Radio podcast RSS.
 * Cadena SER: Prisa PlaySER public podcast.xml feeds.
 * COPE: documented public /api/es/programas/{slug}/audios/rss.xml.
 * Commercial TDT: no free catch-up podcast API — stub only (news RSS optional).
 * Never Digi / Movistar login or scrapers.
 */
export function defaultFeeds(): Record<string, FeedConfig> {
  const feeds: FeedConfig[] = [
    {
      id: "rtve-telediario-4",
      label: "RTVE — Telediario en 4′ (temática RSS)",
      channelId: "tve1",
      availability: "public_rss",
      // Proxied in Vite dev to avoid CORS; production may need same proxy.
      // Canonical public feed (old /rss/telediario-en-4/10650.rss redirects here).
      url: "/proxy/rtve/api/tematicas/10650/noticias.rss",
      notes:
        "Public RTVE temática RSS (noticias). Not full Telediario video catch-up — topic/news items with links when present.",
      enabled: true,
    },
    {
      id: "rtve-rne-mananas",
      label: "RNE — Las mañanas de RNE (audios.rss)",
      channelId: "tve1",
      availability: "public_rss",
      url: "/proxy/rtve/api/programas/119312/audios.rss",
      notes:
        "Official public RTVE/RNE program audio RSS (Apple feedUrl). Canonical: https://www.rtve.es/api/programas/119312/audios.rss",
      enabled: true,
    },
    {
      id: "rtve-rne-24h",
      label: "RNE — 24 horas (audios.rss)",
      channelId: "tve1",
      availability: "public_rss",
      url: "/proxy/rtve/api/programas/1871/audios.rss",
      notes:
        "Official public RNE podcast RSS. Canonical: https://www.rtve.es/api/programas/1871/audios.rss",
      enabled: true,
    },
    {
      id: "rtve-rne-documentos",
      label: "RTVE — Documentos RNE (audios.rss)",
      channelId: "tve1",
      availability: "public_rss",
      url: "/proxy/rtve/api/programas/1938/audios.rss",
      notes:
        "Official public RTVE program audio RSS: https://www.rtve.es/api/programas/{id}/audios.rss",
      enabled: true,
    },
    {
      id: "rtve-rne-neun",
      label: "RTVE — No es un día cualquiera (audios.rss)",
      channelId: "tve1",
      availability: "public_rss",
      url: "/proxy/rtve/api/programas/2054/audios.rss",
      notes: "Official public RNE podcast RSS.",
      enabled: false,
    },
    {
      id: "rtve-rne-radiogaceta",
      label: "RNE — Radiogaceta de los deportes (audios.rss)",
      channelId: "tve1",
      availability: "public_rss",
      url: "/proxy/rtve/api/programas/2071/audios.rss",
      notes:
        "Official public RNE sports audio RSS. Canonical: https://www.rtve.es/api/programas/2071/audios.rss",
      enabled: false,
    },
    {
      id: "ondacero-mas-de-uno",
      label: "Onda Cero — Más de uno",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_MAS_DE_UNO_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS (Apple feedUrl). Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_MAS_DE_UNO_AOD_P/origin/fastly",
      enabled: true,
    },
    {
      id: "ondacero-la-brujula",
      label: "Onda Cero — La Brújula",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_LA_BRUJULA_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS. Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_LA_BRUJULA_AOD_P/origin/fastly",
      enabled: true,
    },
    {
      id: "ondacero-julia",
      label: "Onda Cero — Julia en la onda",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_JULIA_EN_LA_ONDA_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS. Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_JULIA_EN_LA_ONDA_AOD_P/origin/fastly",
      enabled: true,
    },
    {
      id: "ondacero-noticias",
      label: "Onda Cero — Las noticias en Onda Cero",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_LAS_NOTICIAS_EN_ONDA_CERO_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS (boletines). Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_LAS_NOTICIAS_EN_ONDA_CERO_AOD_P/origin/fastly",
      enabled: true,
    },
    {
      id: "ondacero-por-fin",
      label: "Onda Cero — Por fin",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_POR_FIN_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS. Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_POR_FIN_AOD_P/origin/fastly",
      enabled: false,
    },
    {
      id: "ondacero-noticias-mediodia",
      label: "Onda Cero — Noticias mediodía",
      channelId: "onda_cero",
      availability: "public_rss",
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_NOTICIAS_MEDIODIA_AOD_P/origin/fastly",
      notes:
        "Official public podcast RSS. Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_NOTICIAS_MEDIODIA_AOD_P/origin/fastly",
      enabled: false,
    },
    {
      id: "ser-hoy-por-hoy",
      label: "Cadena SER — Hoy por Hoy",
      channelId: "cadena_ser",
      availability: "public_rss",
      url: "/proxy/ser/podcast/playser/hoy_por_hoy/itunestfp/podcast.xml",
      notes:
        "Official Prisa PlaySER public podcast RSS. Canonical: https://fapi-top.prisasd.com/podcast/playser/hoy_por_hoy/itunestfp/podcast.xml",
      enabled: true,
    },
    {
      id: "ser-hora-14",
      label: "Cadena SER — Hora 14",
      channelId: "cadena_ser",
      availability: "public_rss",
      url: "/proxy/ser/podcast/playser/hora_14/itunestfp/podcast.xml",
      notes:
        "Official PlaySER public podcast RSS (also Apple feedUrl family). Canonical: https://fapi-top.prisasd.com/podcast/playser/hora_14/itunestfp/podcast.xml",
      enabled: true,
    },
    {
      id: "ser-hora-25",
      label: "Cadena SER — Hora 25",
      channelId: "cadena_ser",
      availability: "public_rss",
      url: "/proxy/ser/podcast/playser/hora_25/itunestfp/podcast.xml",
      notes:
        "Official PlaySER public podcast RSS. Canonical: https://fapi-top.prisasd.com/podcast/playser/hora_25/itunestfp/podcast.xml",
      enabled: true,
    },
    {
      id: "ser-boletines",
      label: "Cadena SER — Las noticias de la SER",
      channelId: "cadena_ser",
      availability: "public_rss",
      url: "/proxy/ser/podcast/playser/boletines/itunestfp/podcast.xml",
      notes:
        "Official PlaySER boletines podcast RSS. Canonical: https://fapi-top.prisasd.com/podcast/playser/boletines/itunestfp/podcast.xml",
      enabled: false,
    },
    {
      id: "cope-herrera",
      label: "COPE — Herrera en COPE",
      channelId: "cope",
      availability: "public_rss",
      url: "/proxy/cope/api/es/programas/herrera-en-cope/audios/rss.xml",
      notes:
        "Official COPE documented audio RSS (see cope.es/rss-cope.html). Canonical: https://www.cope.es/api/es/programas/herrera-en-cope/audios/rss.xml",
      enabled: true,
    },
    {
      id: "cope-mediodia",
      label: "COPE — Mediodía COPE",
      channelId: "cope",
      availability: "public_rss",
      url: "/proxy/cope/api/es/programas/mediodia-cope/audios/rss.xml",
      notes:
        "Official COPE program audio RSS. Canonical: https://www.cope.es/api/es/programas/mediodia-cope/audios/rss.xml",
      enabled: true,
    },
    {
      id: "cope-la-linterna",
      label: "COPE — La Linterna",
      channelId: "cope",
      availability: "public_rss",
      url: "/proxy/cope/api/es/programas/la-linterna/audios/rss.xml",
      notes:
        "Official COPE program audio RSS. Canonical: https://www.cope.es/api/es/programas/la-linterna/audios/rss.xml",
      enabled: true,
    },
    {
      id: "cope-poniendo-las-calles",
      label: "COPE — Poniendo las Calles",
      channelId: "cope",
      availability: "public_rss",
      url: "/proxy/cope/api/es/programas/poniendo-las-calles/audios/rss.xml",
      notes:
        "Official COPE program audio RSS. Canonical: https://www.cope.es/api/es/programas/poniendo-las-calles/audios/rss.xml",
      enabled: false,
    },
    {
      id: "europafm-cuerpos",
      label: "Europa FM — Cuerpos especiales",
      channelId: "europa_fm",
      availability: "public_rss",
      url: "/proxy/europafm/rss/podcast/triton/mount/ATRESMEDIA_CUERPOS_ESPECIALES_AOD_P/origin/fastly",
      notes:
        "Official Atresmedia Radio Triton podcast RSS (Apple feedUrl). Canonical: https://www.europafm.com/rss/podcast/triton/mount/ATRESMEDIA_CUERPOS_ESPECIALES_AOD_P/origin/fastly",
      enabled: true,
    },
    {
      id: "europafm-me-pones",
      label: "Europa FM — Me pones",
      channelId: "europa_fm",
      availability: "public_rss",
      // Hosted on ondacero.es Triton CDN; same Atresmedia Radio public RSS family.
      url: "/proxy/ondacero/rss/podcast/triton/mount/ATRESMEDIA_ME_PONES_AOD_P/origin/fastly",
      notes:
        "Official Triton podcast RSS (Apple feedUrl; served via ondacero.es host). Canonical: https://www.ondacero.es/rss/podcast/triton/mount/ATRESMEDIA_ME_PONES_AOD_P/origin/fastly",
      enabled: false,
    },
    {
      id: "melodiafm-parece-mentira",
      label: "Melodía FM — Parece Mentira",
      channelId: "melodia_fm",
      availability: "public_rss",
      url: "/proxy/melodiafm/rss/podcast/5087510/podcast.xml",
      notes:
        "Official Melodía FM public podcast RSS (Apple feedUrl). Canonical: https://www.melodia-fm.com/rss/podcast/5087510/podcast.xml",
      enabled: true,
    },
    {
      id: "antena3-stub",
      label: "Antena 3 — catch-up",
      channelId: "antena3",
      availability: "stub_no_public_api",
      notes:
        "Atresplayer catch-up has no documented free public podcast/catch-up API. News RSS exists on antena3.com but is not program replay. Paste URLs you can open, or enable nothing here.",
      enabled: false,
    },
    {
      id: "cuatro-stub",
      label: "Cuatro — catch-up",
      channelId: "cuatro",
      availability: "stub_no_public_api",
      notes:
        "No documented free public catch-up podcast API. Stub only — use user URLs / local files.",
      enabled: false,
    },
    {
      id: "telecinco-stub",
      label: "Telecinco — catch-up",
      channelId: "telecinco",
      availability: "stub_no_public_api",
      notes:
        "No documented free public catch-up podcast API (Mitele is not scraped). Stub only.",
      enabled: false,
    },
    {
      id: "lasexta-stub",
      label: "La Sexta — catch-up",
      channelId: "lasexta",
      availability: "stub_no_public_api",
      notes:
        "News/topic RSS only; catch-up sits behind Atresplayer. Stub — no private API scrape.",
      enabled: false,
    },
  ];

  return Object.fromEntries(feeds.map((f) => [f.id, f]));
}

export type ParsedFeedItem = {
  title: string;
  url: string;
  summary?: string;
};

export async function fetchAndParseFeed(
  feedUrl: string,
): Promise<ParsedFeedItem[]> {
  const res = await fetch(feedUrl, { mode: "cors", redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Feed HTTP ${res.status} for ${feedUrl}`);
  }
  const text = await res.text();
  return parseRssOrAtom(text);
}

export function parseRssOrAtom(xml: string): ParsedFeedItem[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid feed XML");
  }

  const items: ParsedFeedItem[] = [];

  const rssItems = doc.querySelectorAll("item");
  if (rssItems.length) {
    rssItems.forEach((item) => {
      const title = textOf(item, "title") || "Untitled";
      const mediaEnc = pickMediaEnclosure(item);
      const link = textOf(item, "link");
      const url = mediaEnc || link;
      if (!url) return;
      // Skip bare image-only topic posts without a usable page/media link
      if (!mediaEnc && !link) return;
      items.push({
        title,
        url,
        summary: textOf(item, "description")?.slice(0, 280),
      });
    });
    return items;
  }

  const entries = doc.querySelectorAll("entry");
  entries.forEach((entry) => {
    const title = textOf(entry, "title") || "Untitled";
    const linkEl =
      entry.querySelector('link[rel="enclosure"]') ||
      entry.querySelector("link");
    const href =
      linkEl?.getAttribute("href") ||
      entry.querySelector("content")?.getAttribute("src") ||
      undefined;
    if (!href) return;
    items.push({
      title,
      url: href,
      summary: textOf(entry, "summary")?.slice(0, 280),
    });
  });

  return items;
}

function textOf(el: Element, tag: string): string | undefined {
  const node = el.querySelector(tag);
  const t = node?.textContent?.trim();
  return t || undefined;
}

function pickMediaEnclosure(item: Element): string | undefined {
  const enclosures = Array.from(item.querySelectorAll("enclosure"));
  for (const enc of enclosures) {
    const type = (enc.getAttribute("type") || "").toLowerCase();
    const url = enc.getAttribute("url") || undefined;
    if (!url) continue;
    if (type.startsWith("audio/") || type.startsWith("video/")) return url;
    if (/\.(mp3|m4a|mp4|m3u8|ogg|webm)(\?|$)/i.test(url)) return url;
  }
  return undefined;
}

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  tve1: "TVE1 / RTVE / RNE",
  antena3: "Antena 3",
  cuatro: "Cuatro",
  telecinco: "Telecinco",
  lasexta: "La Sexta",
  onda_cero: "Onda Cero",
  cadena_ser: "Cadena SER",
  cope: "COPE",
  europa_fm: "Europa FM",
  melodia_fm: "Melodía FM",
};

export function platformIdForChannel(
  channelId: ChannelId | undefined,
): string | undefined {
  switch (channelId) {
    case "tve1":
      return "rtve";
    case "onda_cero":
      return "ondacero";
    case "cadena_ser":
      return "cadenaser";
    case "cope":
      return "cope";
    case "europa_fm":
      return "europafm";
    case "melodia_fm":
      return "melodiafm";
    case "antena3":
    case "cuatro":
    case "telecinco":
    case "lasexta":
    case undefined:
      return undefined;
    default: {
      const _exhaustive: never = channelId;
      return _exhaustive;
    }
  }
}

export function makeProposalId(): string {
  return newId("prop");
}
