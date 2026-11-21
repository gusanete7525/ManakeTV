import { useEffect, useState, type FormEvent } from "react";
import { AddDialog, type Draft } from "./AddDialog";
import { apiGet, type HomePayload, type Page, type ProgramCard, type SearchPayload, type VideoCard } from "./api";
import { formatDuration, formatPublished } from "./format";
import { useAsync } from "./useAsync";
import type { PlaylistItem } from "./station";

type CatalogView =
  | { type: "channel"; channelId: string; page: number }
  | { type: "program"; programId: string; title: string; page: number; parent: CatalogView }
  | { type: "shelf"; shelf: "cine" | "filmoteca"; page: number }
  | { type: "search"; query: string; page: number };

type CatalogData =
  | { type: "programs"; page: Page<ProgramCard> }
  | { type: "videos"; page: Page<VideoCard> }
  | { type: "search"; payload: SearchPayload };

type CatalogProps = {
  items: PlaylistItem[];
  now: Date;
  onAdd: (item: PlaylistItem) => void;
};

export function Catalog({ items, now, onAdd }: CatalogProps) {
  const home = useAsync("home", () => apiGet<HomePayload>("/api/home"));
  const [view, setView] = useState<CatalogView | null>(null);
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  const [onlyFeatures, setOnlyFeatures] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [manual, setManual] = useState({ title: "", url: "", minutes: 90 });
  const [manualError, setManualError] = useState<string | null>(null);

  const firstChannel = home.status === "ready" ? home.data.channels[0]?.id ?? "" : "";
  useEffect(() => {
    if (view || !firstChannel) return;
    setView({ type: "channel", channelId: firstChannel, page: 1 });
  }, [view, firstChannel]);

  const requestKey = view ? JSON.stringify({ view, retry }) : "idle";
  const result = useAsync<CatalogData | null>(requestKey, () => loadView(view));

  function openVideo(video: VideoCard, kind: Draft["kind"]) {
    setDraft({
      title: video.title,
      subtitle: video.subtitle,
      thumbnail: video.thumbnail,
      pageUrl: video.pageUrl,
      kind,
      source: "rtve",
      videoId: video.id,
      mediaUrl: null,
      durationSec: video.durationSec || 30 * 60,
    });
  }

  function submitManual(event: FormEvent) {
    event.preventDefault();
    let url: URL;
    try {
      url = new URL(manual.url.trim());
    } catch {
      setManualError("La dirección no es válida.");
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      setManualError("La dirección tiene que empezar por https.");
      return;
    }
    if (!manual.title.trim()) {
      setManualError("Ponle un título.");
      return;
    }
    setManualError(null);
    setDraft({
      title: manual.title.trim(),
      subtitle: "Enlace directo",
      thumbnail: "",
      pageUrl: "",
      kind: "enlace",
      source: "url",
      videoId: null,
      mediaUrl: url.toString(),
      durationSec: Math.max(1, manual.minutes) * 60,
    });
  }

  const homeReady = home.status === "ready" ? home.data : null;

  return (
    <section className="catalog">
      <header>
        <p className="kicker">Catálogo</p>
        <h2>Replay de la TDT y cine en castellano</h2>
        <p className="lede">
          La 1, La 2, Clan, Canal 24 Horas y Teledeporte, más las películas de RTVE Play y de la Filmoteca. El vídeo
          sigue en los servidores de RTVE. Aquí solo se guarda la hora a la que quieres verlo.
        </p>
      </header>
      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          const text = query.trim();
          if (text.length < 2) return;
          setView({ type: "search", query: text, page: 1 });
        }}
      >
        <input
          data-testid="search"
          value={query}
          placeholder="Busca una película, una serie o un informativo"
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="primary">
          Buscar
        </button>
      </form>
      {home.status === "error" ? <p className="form-error">{home.error}</p> : null}
      {homeReady ? (
        <div className="tabs" role="tablist">
          {homeReady.channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              role="tab"
              aria-selected={view?.type === "channel" && view.channelId === channel.id}
              className={view?.type === "channel" && view.channelId === channel.id ? "tab on" : "tab"}
              onClick={() => setView({ type: "channel", channelId: channel.id, page: 1 })}
            >
              {channel.name}
            </button>
          ))}
          {homeReady.shelves.map((shelf) => (
            <button
              key={shelf.id}
              type="button"
              role="tab"
              aria-selected={view?.type === "shelf" && view.shelf === shelf.id}
              className={view?.type === "shelf" && view.shelf === shelf.id ? "tab on" : "tab"}
              onClick={() => setView({ type: "shelf", shelf: shelf.id, page: 1 })}
            >
              {shelf.name}
            </button>
          ))}
        </div>
      ) : null}
      {homeReady && view ? <p className="quiet">{blurbFor(homeReady, view)}</p> : null}
      {view?.type === "program" ? (
        <button type="button" className="texty" onClick={() => setView(view.parent)}>
          ← Volver
        </button>
      ) : null}
      {view?.type === "shelf" ? (
        <label className="check">
          <input type="checkbox" checked={onlyFeatures} onChange={(event) => setOnlyFeatures(event.target.checked)} />
          Solo piezas de más de 45 minutos
        </label>
      ) : null}
      {result.status === "loading" ? <p>Cargando la carta de RTVE…</p> : null}
      {result.status === "error" ? (
        <div>
          <p className="form-error">{result.error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Reintentar
          </button>
        </div>
      ) : null}
      {result.status === "ready" && result.data ? (
        <CatalogBody
          data={result.data}
          onlyFeatures={onlyFeatures && view?.type === "shelf"}
          onOpenProgram={(program, parent) =>
            setView({ type: "program", programId: program.id, title: program.title, page: 1, parent })
          }
          onPage={(page) => setView((current) => (current ? { ...current, page } : current))}
          onOpenVideo={(video) => openVideo(video, view?.type === "shelf" ? "pelicula" : "replay")}
          parent={view}
        />
      ) : null}
      <details className="manual">
        <summary>Añadir un enlace directo</summary>
        <p>
          Pega la dirección de un archivo .mp4 o de una playlist .m3u8. La página de una película no sirve: hace falta
          el vídeo en sí.
        </p>
        <form onSubmit={submitManual}>
          <label>
            Título
            <input value={manual.title} onChange={(event) => setManual({ ...manual, title: event.target.value })} />
          </label>
          <label>
            Dirección
            <input
              value={manual.url}
              placeholder="https://…/pelicula.m3u8"
              onChange={(event) => setManual({ ...manual, url: event.target.value })}
            />
          </label>
          <label>
            Minutos
            <input
              type="number"
              min={1}
              max={480}
              value={manual.minutes}
              onChange={(event) => setManual({ ...manual, minutes: Number(event.target.value) })}
            />
          </label>
          {manualError ? <p className="form-error">{manualError}</p> : null}
          <button type="submit">Elegir la hora</button>
        </form>
      </details>
      {draft ? (
        <AddDialog
          key={draft.videoId ?? draft.mediaUrl ?? draft.title}
          draft={draft}
          items={items}
          now={now}
          onCancel={() => setDraft(null)}
          onConfirm={(item) => {
            onAdd(item);
            setDraft(null);
          }}
        />
      ) : null}
    </section>
  );
}

function blurbFor(home: HomePayload, view: CatalogView): string {
  switch (view.type) {
    case "channel":
      return home.channels.find((channel) => channel.id === view.channelId)?.blurb ?? "";
    case "shelf":
      return home.shelves.find((shelf) => shelf.id === view.shelf)?.blurb ?? "";
    case "program":
      return view.title;
    case "search":
      return `Resultados de «${view.query}»`;
    default: {
      const neverView: never = view;
      return neverView;
    }
  }
}

async function loadView(view: CatalogView | null): Promise<CatalogData | null> {
  if (!view) return null;
  switch (view.type) {
    case "channel":
      return {
        type: "programs",
        page: await apiGet<Page<ProgramCard>>(`/api/channels/${view.channelId}/programs?page=${view.page}`),
      };
    case "program":
      return {
        type: "videos",
        page: await apiGet<Page<VideoCard>>(`/api/programs/${view.programId}/videos?page=${view.page}`),
      };
    case "shelf":
      return {
        type: "videos",
        page: await apiGet<Page<VideoCard>>(`/api/shelves/${view.shelf}/videos?page=${view.page}`),
      };
    case "search":
      return {
        type: "search",
        payload: await apiGet<SearchPayload>(`/api/search?q=${encodeURIComponent(view.query)}&page=${view.page}`),
      };
    default: {
      const neverView: never = view;
      return neverView;
    }
  }
}

function CatalogBody({
  data,
  onlyFeatures,
  parent,
  onOpenProgram,
  onOpenVideo,
  onPage,
}: {
  data: CatalogData;
  onlyFeatures: boolean;
  parent: CatalogView | null;
  onOpenProgram: (program: ProgramCard, parent: CatalogView) => void;
  onOpenVideo: (video: VideoCard) => void;
  onPage: (page: number) => void;
}) {
  switch (data.type) {
    case "programs":
      return (
        <>
          <div className="cards">
            {data.page.items.map((program) => (
              <button
                key={program.id}
                type="button"
                className="card card-button"
                onClick={() => {
                  if (parent) onOpenProgram(program, parent);
                }}
              >
                <Poster src={program.thumbnail} />
                <strong>{program.title}</strong>
                <span>{program.channel || "Programa"}</span>
              </button>
            ))}
          </div>
          {data.page.items.length === 0 ? <p>No hay programas en esta página.</p> : null}
          <Pager page={data.page.page} total={data.page.totalPages} onPage={onPage} />
        </>
      );
    case "videos":
      return <VideoGrid videos={data.page.items} page={data.page} onlyFeatures={onlyFeatures} onOpenVideo={onOpenVideo} onPage={onPage} />;
    case "search":
      return (
        <>
          {data.payload.programs.length > 0 ? (
            <>
              <h3>Programas</h3>
              <div className="cards">
                {data.payload.programs.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    className="card card-button"
                    onClick={() => {
                      if (parent) onOpenProgram(program, parent);
                    }}
                  >
                    <Poster src={program.thumbnail} />
                    <strong>{program.title}</strong>
                    <span>{program.channel || "Programa"}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <h3>Vídeos y películas</h3>
          <VideoGrid
            videos={data.payload.videos.items}
            page={data.payload.videos}
            onlyFeatures={false}
            onOpenVideo={onOpenVideo}
            onPage={onPage}
          />
        </>
      );
    default: {
      const neverData: never = data;
      return neverData;
    }
  }
}

function VideoGrid({
  videos,
  page,
  onlyFeatures,
  onOpenVideo,
  onPage,
}: {
  videos: VideoCard[];
  page: Page<VideoCard>;
  onlyFeatures: boolean;
  onOpenVideo: (video: VideoCard) => void;
  onPage: (page: number) => void;
}) {
  const visible = onlyFeatures ? videos.filter((video) => video.durationSec === 0 || video.durationSec >= 45 * 60) : videos;
  return (
    <>
      <div className="cards">
        {visible.map((video) => (
          <article key={video.id} className="card">
            <Poster src={video.thumbnail} />
            <strong>{video.title}</strong>
            <span>
              {[video.subtitle, formatDuration(video.durationSec), formatPublished(video.publishedAt), video.language && video.language !== "es" ? video.language : "", video.rating]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {video.description ? <p>{video.description}</p> : null}
            <button type="button" data-testid="add-to-playlist" onClick={() => onOpenVideo(video)}>
              Poner en la playlist
            </button>
          </article>
        ))}
      </div>
      {visible.length === 0 ? <p>No hay piezas que enseñar en esta página.</p> : null}
      <Pager page={page.page} total={page.totalPages} onPage={onPage} />
    </>
  );
}

function Poster({ src }: { src: string }) {
  if (!src) return <div className="poster bare" />;
  return <img className="poster" src={src} alt="" />;
}

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="pager">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </button>
      <span>
        {page} / {total}
      </span>
      <button type="button" disabled={page >= total} onClick={() => onPage(page + 1)}>
        Siguiente
      </button>
    </div>
  );
}
