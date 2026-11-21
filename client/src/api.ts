export type ChannelInfo = { id: string; name: string; blurb: string };
export type ShelfInfo = { id: "cine" | "filmoteca"; name: string; blurb: string };

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

export type HomePayload = {
  channels: ChannelInfo[];
  shelves: ShelfInfo[];
};

export type SearchPayload = {
  query: string;
  programs: ProgramCard[];
  videos: Page<VideoCard>;
};

export type Playback = {
  videoId: string;
  title: string;
  pageUrl: string;
  thumbnail: string;
  durationSec: number;
  url: string;
  kind: "hls" | "file";
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const body = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) {
    const message = body && typeof body.error === "string" ? body.error : "RTVE no responde ahora mismo.";
    throw new Error(message);
  }
  return body as T;
}
