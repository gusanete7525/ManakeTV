import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHANNELS,
  HttpError,
  SHELVES,
  channelById,
  listProgramVideos,
  listPrograms,
  listShelf,
  playbackFor,
  searchCatalog,
  shelfById,
  type ShelfId,
} from "./rtve";

const app = express();
app.disable("x-powered-by");

function pageFrom(value: unknown): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, 500);
}

function numericId(value: string): string | null {
  return /^\d{1,12}$/.test(value) ? value : null;
}

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function wrap(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/home", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({
    channels: CHANNELS.map(({ id, name, blurb }) => ({ id, name, blurb })),
    shelves: SHELVES.map(({ id, name, blurb }) => ({ id, name, blurb })),
  });
});

app.get(
  "/api/channels/:channelId/programs",
  wrap(async (req, res) => {
    const channel = channelById(param(req.params.channelId));
    if (!channel) throw new HttpError(404, "Ese canal no está en la parrilla.");
    res.set("Cache-Control", "public, max-age=60");
    res.json(await listPrograms(channel.id, pageFrom(req.query.page)));
  }),
);

app.get(
  "/api/programs/:programId/videos",
  wrap(async (req, res) => {
    const programId = numericId(param(req.params.programId));
    if (!programId) throw new HttpError(404, "Ese programa no existe.");
    res.set("Cache-Control", "public, max-age=60");
    res.json(await listProgramVideos(programId, pageFrom(req.query.page)));
  }),
);

app.get(
  "/api/shelves/:shelfId/videos",
  wrap(async (req, res) => {
    const shelf = shelfById(param(req.params.shelfId));
    if (!shelf) throw new HttpError(404, "Esa estantería no existe.");
    res.set("Cache-Control", "public, max-age=60");
    res.json(await listShelf(shelf.id as ShelfId, pageFrom(req.query.page)));
  }),
);

app.get(
  "/api/search",
  wrap(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    if (query.length < 2) throw new HttpError(400, "Escribe al menos dos letras.");
    res.set("Cache-Control", "public, max-age=30");
    const result = await searchCatalog(query, pageFrom(req.query.page));
    res.json({ query, programs: result.programs, videos: result.videos });
  }),
);

app.get(
  "/api/playback/:videoId",
  wrap(async (req, res) => {
    const videoId = numericId(param(req.params.videoId));
    if (!videoId) throw new HttpError(404, "Esa pieza no existe.");
    res.set("Cache-Control", "private, max-age=120");
    res.json(await playbackFor(videoId));
  }),
);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "No existe ese recurso." });
});

if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist/client");
  app.use(express.static(clientDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDir, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Error inesperado.";
  if (status >= 500) console.error(error);
  if (!res.headersSent) res.status(status).json({ error: message });
});

const port = Number(process.env.PORT) || 8787;
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`ManakeTV API http://${host}:${port}`);
});
