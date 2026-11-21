import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { apiGet, type Playback } from "./api";

type PlayerSource = {
  slotKey: string;
  title: string;
  pageUrl: string;
  offsetSec: number;
  source: "rtve" | "url";
  videoId: string | null;
  mediaUrl: string | null;
};

type PlayerProps = {
  source: PlayerSource;
  endsLabel: string;
};

function isHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export function Player({ source, endsLabel }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const offsetRef = useRef(source.offsetSec);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    offsetRef.current = source.offsetSec;
  }, [source.offsetSec]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let hls: Hls | null = null;
    const offsetAtStart = source.offsetSec;

    const fail = (message: string) => {
      if (!cancelled) {
        setLoading(false);
        setError(message);
      }
    };

    const start = () => {
      if (cancelled) return;
      if (offsetAtStart > 1) {
        const duration = Number.isFinite(video.duration) ? video.duration : offsetAtStart;
        video.currentTime = Math.min(offsetAtStart, Math.max(duration - 0.4, 0));
      }
      video.play().catch(() => {
        if (!cancelled) setNeedsGesture(true);
      });
    };

    const arm = (kind: "hls" | "file", url: string) => {
      if (cancelled) return;
      setLoading(false);
      if (kind === "file" || video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", start, { once: true });
        return;
      }
      if (!Hls.isSupported()) {
        fail("Este navegador no puede abrir el vídeo.");
        return;
      }
      const player = new Hls({ enableWorker: true });
      hls = player;
      player.loadSource(url);
      player.attachMedia(video);
      player.on(Hls.Events.MANIFEST_PARSED, () => start());
      player.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        const code = data.response?.code;
        if (code === 403 || code === 401) {
          fail("RTVE no sirve esta pieza en esta conexión. Fuera de España, parte del replay solo se ve desde allí.");
          return;
        }
        fail("No se ha podido abrir el vídeo.");
      });
    };

    setError(null);
    setNeedsGesture(false);
    setEnded(false);
    setLoading(true);

    if (source.source === "url") {
      if (!source.mediaUrl) fail("Falta la dirección del vídeo.");
      else arm(isHls(source.mediaUrl) ? "hls" : "file", source.mediaUrl);
    } else if (source.videoId) {
      apiGet<Playback>(`/api/playback/${source.videoId}`)
        .then((playback) => {
          if (!cancelled) arm(playback.kind, playback.url);
        })
        .catch((reason: unknown) => {
          fail(reason instanceof Error ? reason.message : "No se ha podido sintonizar.");
        });
    } else {
      fail("Esta pieza no tiene vídeo.");
    }

    const onEnded = () => {
      if (!cancelled) setEnded(true);
    };
    video.addEventListener("ended", onEnded);

    return () => {
      cancelled = true;
      video.removeEventListener("ended", onEnded);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // Offset belongs to the slot that just started. Later clock ticks must not reload the video.
  }, [source.slotKey, source.mediaUrl, source.source, source.videoId]);

  function sintonizar() {
    const video = videoRef.current;
    if (!video) return;
    const offset = offsetRef.current;
    if (offset > 1 && video.currentTime < 1) video.currentTime = offset;
    video.play().then(
      () => setNeedsGesture(false),
      () => setNeedsGesture(true),
    );
  }

  return (
    <div className="bezel">
      <video ref={videoRef} data-testid="player" controls playsInline preload="metadata" />
      <div className="bug">
        <span className="live-dot" aria-hidden="true" />
        EN ANTENA
      </div>
      {loading ? <div className="veil">Sintonizando…</div> : null}
      {needsGesture && !error ? (
        <div className="veil">
          <button type="button" className="primary" onClick={sintonizar}>
            Sintonizar
          </button>
        </div>
      ) : null}
      {ended && !error ? (
        <div className="veil veil-quiet">
          <p>Esta pieza ha llegado al final.</p>
          <p>La franja sigue hasta las {endsLabel}.</p>
        </div>
      ) : null}
      {error ? (
        <div className="veil veil-error">
          <p>{error}</p>
          {source.pageUrl ? (
            <a href={source.pageUrl} target="_blank" rel="noreferrer">
              Abrir en RTVE Play
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
