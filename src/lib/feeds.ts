import type { ChannelId, FeedConfig } from "../types";
import { newId } from "../types";

/**
 * Documented public / stub channel sources.
 * RTVE: official public program RSS (audios / topic feeds).
 * Commercial TDT: no free catch-up podcast API — stub only (news RSS optional).
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
  tve1: "TVE1 / RTVE",
  antena3: "Antena 3",
  cuatro: "Cuatro",
  telecinco: "Telecinco",
  lasexta: "La Sexta",
};

export function makeProposalId(): string {
  return newId("prop");
}
