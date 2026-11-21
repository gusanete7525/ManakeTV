import { plainText } from "./text";
import { decryptZtnr, pickMedia, type PlayableMedia } from "./ztnr";

const USER_AGENT = "ManakeTV/1.0 (playlist personal; catálogo RTVE Play)";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type VideoCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  pageUrl: string;
  durationSec: number;
  publishedAt: string;
  language: string;
  rating: string;
};

export type ProgramCard = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  pageUrl: string;
  channel: string;
};

export type Page<T> = {
  page: number;
  totalPages: number;
  total: number;
  items: T[];
};

export const CHANNELS = [
  { id: "748", name: "La 1", blurb: "Informativos, series y el prime time." },
  { id: "310", name: "La 2", blurb: "Cultura, documentales y cine." },
  { id: "417", name: "Clan", blurb: "Replay infantil." },
  { id: "350", name: "Canal 24 Horas", blurb: "Informativos a cualquier hora." },
  { id: "450", name: "Teledeporte", blurb: "Deporte a la carta." },
] as const;

export const SHELVES = [
  {
    id: "cine",
    agrupador: "42173",
    name: "Cine",
    blurb: "Películas en castellano del catálogo de RTVE Play.",
  },
  {
    id: "filmoteca",
    agrupador: "60570",
    name: "Filmoteca",
    blurb: "Cine español y archivo histórico.",
  },
] as const;

export type ShelfId = (typeof SHELVES)[number]["id"];

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as UnknownRecord;
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function rtveJson(url: string, options?: { quiet?: boolean }): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(502, "RTVE no responde ahora mismo.");
  }
  if (!response.ok) {
    if (!options?.quiet) console.error(`RTVE ${response.status} ${url}`);
    throw new HttpError(502, "RTVE no responde ahora mismo.");
  }
  try {
    return await response.json();
  } catch {
    throw new HttpError(502, "RTVE ha devuelto una respuesta ilegible.");
  }
}

function pageItems(payload: unknown): { items: UnknownRecord[]; page: number; totalPages: number; total: number } {
  const root = asRecord(payload);
  const page = asRecord(root?.page);
  const items = Array.isArray(page?.items) ? page.items.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  }) : [];
  const number = typeof page?.number === "number" ? page.number : 1;
  const totalPages = typeof page?.totalPages === "number" ? page.totalPages : 1;
  const total = typeof page?.total === "number" ? page.total : items.length;
  return { items, page: number, totalPages, total };
}

function durationSeconds(value: unknown): number {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.max(0, Math.round(raw / 1000));
}

function channelName(value: unknown): string {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  if (!record) return "";
  return plainText(record.title) || plainText(record.name);
}

function absoluteImage(value: unknown): string {
  const text = asString(value);
  if (text.startsWith("https://") || text.startsWith("http://")) return text;
  return "";
}

function toProgram(item: UnknownRecord): ProgramCard | null {
  const id = String(item.id ?? "");
  if (!/^\d{1,12}$/.test(id)) return null;
  const pageUrl = asString(item.htmlUrl);
  if (pageUrl.includes("/audios/")) return null;
  if (item.contentType === "video" || item.contentType === "audio") return null;
  const title = plainText(item.name) || plainText(item.longTitle) || plainText(item.title);
  if (!title) return null;
  return {
    id,
    title,
    description: plainText(item.description).slice(0, 400),
    thumbnail: absoluteImage(item.thumbnail) || absoluteImage(item.imgPoster) || absoluteImage(item.imageSEO),
    pageUrl,
    channel: channelName(item.channel),
  };
}

function toVideo(item: UnknownRecord): VideoCard | null {
  const id = String(item.id ?? "");
  if (!/^\d{1,12}$/.test(id)) return null;
  if (item.disabledAlacarta === true) return null;
  if (item.assetType === "audio") return null;
  const pageUrl = asString(item.htmlUrl);
  if (pageUrl.includes("/audios/")) return null;
  const title = plainText(item.title) || plainText(item.longTitle);
  if (!title) return null;
  const program = asRecord(item.programInfo);
  const programTitle = plainText(program?.title);
  return {
    id,
    title,
    subtitle: programTitle && programTitle !== title ? programTitle : "",
    description: plainText(item.description).slice(0, 400),
    thumbnail: absoluteImage(item.thumbnail) || absoluteImage(item.imgPoster),
    pageUrl,
    durationSec: durationSeconds(item.duration),
    publishedAt: asString(item.publicationDate),
    language: asString(item.language),
    rating: plainText(program?.ageRange),
  };
}

function mapPage<T>(payload: unknown, mapItem: (item: UnknownRecord) => T | null): Page<T> {
  const page = pageItems(payload);
  return {
    page: page.page,
    totalPages: page.totalPages,
    total: page.total,
    items: page.items.flatMap((item) => {
      const mapped = mapItem(item);
      return mapped ? [mapped] : [];
    }),
  };
}

export function channelById(id: string): (typeof CHANNELS)[number] | null {
  return CHANNELS.find((channel) => channel.id === id) ?? null;
}

export function shelfById(id: string): (typeof SHELVES)[number] | null {
  return SHELVES.find((shelf) => shelf.id === id) ?? null;
}

export async function listPrograms(channelId: string, page: number): Promise<Page<ProgramCard>> {
  const payload = await rtveJson(
    `https://api.rtve.es/api/cadenas/${channelId}/programas.json?size=24&page=${page}`,
  );
  return mapPage(payload, toProgram);
}

export async function listProgramVideos(programId: string, page: number): Promise<Page<VideoCard>> {
  const withType = await rtveJson(
    `https://www.rtve.es/api/programas/${programId}/videos.json?size=24&page=${page}&type=39816`,
  );
  const typed = mapPage(withType, toVideo);
  if (typed.items.length > 0 || typed.total === 0) return typed;
  const plain = await rtveJson(
    `https://www.rtve.es/api/programas/${programId}/videos.json?size=24&page=${page}`,
  );
  return mapPage(plain, toVideo);
}

export async function listShelf(shelf: ShelfId, page: number): Promise<Page<VideoCard>> {
  const found = shelfById(shelf);
  if (!found) throw new HttpError(404, "Esa estantería no existe.");
  const payload = await rtveJson(
    `https://api.rtve.es/api/agrupadores/${found.agrupador}/videos.json?size=24&page=${page}`,
  );
  return mapPage(payload, toVideo);
}

function queryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function searchPrograms(query: string): Promise<ProgramCard[]> {
  const url = `https://api.rtve.es/api/search/programs?${queryString({
    search: query,
    page: "1",
    size: "8",
    context: "tve",
  })}`;
  try {
    return mapPage(await rtveJson(url, { quiet: true }), toProgram).items;
  } catch {
    return [];
  }
}

async function searchVideos(query: string, page: number): Promise<Page<VideoCard>> {
  const attempts: Record<string, string>[] = [
    { search: query, page: String(page), size: "12", context: "tve", type: "completo", tipology: "video" },
    { search: query, page: String(page), size: "12", context: "tve" },
  ];
  let lastError: unknown = new HttpError(502, "RTVE no responde ahora mismo.");
  for (const [index, params] of attempts.entries()) {
    try {
      const payload = await rtveJson(`https://api.rtve.es/api/search/contents?${queryString(params)}`, {
        quiet: index === 0,
      });
      return mapPage(payload, toVideo);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function searchCatalog(query: string, page: number): Promise<{
  programs: ProgramCard[];
  videos: Page<VideoCard>;
}> {
  const [programs, videos] = await Promise.all([searchPrograms(query), searchVideos(query, page)]);
  return { programs, videos };
}

const playbackCache = new Map<string, { at: number; media: PlayableMedia }>();
const PLAYBACK_TTL_MS = 10 * 60 * 1000;

async function resolveMedia(videoId: string): Promise<PlayableMedia | null> {
  const cached = playbackCache.get(videoId);
  if (cached && Date.now() - cached.at < PLAYBACK_TTL_MS) return cached.media;
  for (const manager of ["rtveplayw", "default"]) {
    const url = `https://ztnr.rtve.es/ztnr/movil/thumbnail/${manager}/videos/${videoId}.png?q=v2`;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) continue;
      const media = pickMedia(decryptZtnr(await response.text()));
      if (!media) continue;
      playbackCache.set(videoId, { at: Date.now(), media });
      return media;
    } catch {
      continue;
    }
  }
  return null;
}

export type Playback = PlayableMedia & {
  videoId: string;
  title: string;
  pageUrl: string;
  thumbnail: string;
  durationSec: number;
};

export async function playbackFor(videoId: string): Promise<Playback> {
  const payload = await rtveJson(`https://api.rtve.es/api/videos/${videoId}.json`);
  const video = mapPage(payload, toVideo).items[0];
  if (!video) throw new HttpError(404, "RTVE no tiene esa pieza.");
  const media = await resolveMedia(videoId);
  if (!media) throw new HttpError(404, "RTVE no ha dado una dirección reproducible para esta pieza.");
  return {
    videoId,
    title: video.title,
    pageUrl: video.pageUrl,
    thumbnail: video.thumbnail,
    durationSec: video.durationSec,
    ...media,
  };
}
