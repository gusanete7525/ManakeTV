import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem, ScheduleSlot } from "../types";
import { getLocalFile } from "../lib/localFiles";
import { looksLikeDirectMedia } from "../lib/viability";
import {
  applySinkId,
  canSelectAudioOutput,
  canSetSinkId,
  listAudioSinks,
  pickAudioOutputWithBrowserUi,
  type AudioSink,
} from "../lib/audioOutput";
import {
  canCastMediaUrl,
  castToDevice,
  isElectronShell,
  listCastDevices,
  miracastHint,
  promptRemotePlayback,
  type CastDevice,
} from "../lib/cast";
import "./OnAirPlayer.css";

type OnAirPlayerProps = {
  slot: ScheduleSlot | null;
  media: MediaItem | null;
  nextTitle?: string;
  preferredSinkId?: string;
  onPreferredSinkIdChange?: (sinkId: string) => void;
};

export function OnAirPlayer({
  slot,
  media,
  nextTitle,
  preferredSinkId = "",
  onPreferredSinkIdChange,
}: OnAirPlayerProps) {
  const localFile =
    media?.sourceKind === "local" ? getLocalFile(media.id) : undefined;

  const [blobUrl, setBlobUrl] = useState<string | undefined>();
  const [sinks, setSinks] = useState<AudioSink[]>([]);
  const [sinkError, setSinkError] = useState<string | null>(null);
  const [castDevices, setCastDevices] = useState<CastDevice[]>([]);
  const [castDeviceId, setCastDeviceId] = useState("");
  const [castStatus, setCastStatus] = useState<string | null>(null);
  const [castBusy, setCastBusy] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!localFile) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return undefined;
      });
      return;
    }
    const url = URL.createObjectURL(localFile);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localFile]);

  const mode = useMemo(() => {
    if (!media) return "off";
    if (media.sourceKind === "local") {
      return blobUrl ? "local-av" : "local-missing";
    }
    if (media.url && looksLikeDirectMedia(media.url)) return "remote-av";
    if (media.url) return "page-link";
    return "empty";
  }, [media, blobUrl]);

  const src = mode === "local-av" ? blobUrl : media?.url;
  const castUrl =
    mode === "remote-av" || mode === "page-link" ? media?.url : undefined;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await listAudioSinks();
      if (!cancelled) setSinks(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !preferredSinkId) return;
    void applySinkId(el, preferredSinkId).then((r) => {
      setSinkError(r.ok ? null : (r.error ?? "Could not set audio output"));
    });
  }, [preferredSinkId, src, mode]);

  async function refreshCastDevices() {
    setCastBusy(true);
    setCastStatus(null);
    try {
      const list = await listCastDevices();
      setCastDevices(list);
      if (list[0] && !castDeviceId) setCastDeviceId(list[0].id);
      if (!list.length && isElectronShell()) {
        setCastStatus(
          "No Chromecast found on LAN yet. Ensure TV and PC share Wi‑Fi.",
        );
      } else if (!isElectronShell()) {
        setCastStatus(
          "LAN Chromecast list is available in the desktop app. In browser, try Cast / remote playback below.",
        );
      }
    } finally {
      setCastBusy(false);
    }
  }

  async function handleSinkChange(id: string) {
    onPreferredSinkIdChange?.(id);
    const el = mediaRef.current;
    if (!el) return;
    const r = await applySinkId(el, id);
    setSinkError(r.ok ? null : (r.error ?? "Could not set audio output"));
  }

  async function handleBrowserAudioPicker() {
    const id = await pickAudioOutputWithBrowserUi();
    if (id) await handleSinkChange(id);
  }

  async function handleCast() {
    setCastBusy(true);
    setCastStatus(null);
    try {
      if (!castUrl || !canCastMediaUrl(castUrl)) {
        setCastStatus(
          "Cast needs a direct http(s) media URL. Local files: use Miracast / Win+K to mirror.",
        );
        return;
      }
      if (isElectronShell() && castDeviceId) {
        const r = await castToDevice(castDeviceId, castUrl, media?.title);
        setCastStatus(
          r.ok
            ? `Casting to device…`
            : `${r.error ?? "Cast failed"}${r.hint ? ` — ${r.hint}` : ""}`,
        );
        return;
      }
      const r = await promptRemotePlayback(mediaRef.current);
      setCastStatus(
        r.ok
          ? "Remote playback prompted."
          : `${r.error ?? "Cast unavailable"}${r.hint ? ` — ${r.hint}` : ""}`,
      );
    } finally {
      setCastBusy(false);
    }
  }

  return (
    <section className="onair" aria-label="On air player">
      <header className="onair__header">
        <span className="onair__badge">On air</span>
        <h2 className="onair__title">
          {media?.title ?? (slot ? "Missing media" : "Off air")}
        </h2>
        {nextTitle ? (
          <p className="onair__next">Up next: {nextTitle}</p>
        ) : null}
      </header>

      <div className="onair__stage">
        {mode === "off" || mode === "empty" ? (
          <p className="onair__idle">
            Nothing scheduled for this moment. Place a slot on the timeline.
          </p>
        ) : null}

        {mode === "local-missing" ? (
          <p className="onair__idle">
            Local file “{media?.localFileName}” needs to be re-picked after
            reload (browser security). Use folder/file picker again.
          </p>
        ) : null}

        {(mode === "local-av" || mode === "remote-av") && src ? (
          <video
            className="onair__video"
            key={src}
            ref={(node) => {
              mediaRef.current = node;
            }}
            src={src}
            controls
            autoPlay
            playsInline
          />
        ) : null}

        {mode === "page-link" && media?.url ? (
          <div className="onair__page">
            <p>
              This item is a page/stream URL (not a direct media file). Open it
              in a tab you are authorized to use:
            </p>
            <a href={media.url} target="_blank" rel="noreferrer">
              {media.url}
            </a>
            <audio
              className="onair__audio"
              ref={(node) => {
                mediaRef.current = node;
              }}
              src={media.url}
              controls
            />
            <p className="onair__hint">
              Audio element tries the URL; if it fails, use the link above.
            </p>
          </div>
        ) : null}
      </div>

      <div className="onair__controls" aria-label="Playback output">
        <div className="onair__control-block">
          <label className="onair__field">
            <span>Audio output</span>
            <select
              value={preferredSinkId}
              disabled={!canSetSinkId() && sinks.length === 0}
              onChange={(e) => void handleSinkChange(e.target.value)}
            >
              <option value="">System default</option>
              {sinks.map((s) => (
                <option key={s.deviceId} value={s.deviceId}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {canSelectAudioOutput() ? (
            <button
              type="button"
              className="onair__btn onair__btn--ghost"
              onClick={() => void handleBrowserAudioPicker()}
            >
              Pick device…
            </button>
          ) : null}
          {sinkError ? (
            <p className="onair__status" role="status">
              {sinkError}
            </p>
          ) : null}
          {!canSetSinkId() ? (
            <p className="onair__hint">
              Audio sink selection needs Chromium/`setSinkId` (Edge/Chrome or
              FluxTV desktop).
            </p>
          ) : null}
        </div>

        <div className="onair__control-block">
          <label className="onair__field">
            <span>Cast to TV (LAN)</span>
            <select
              value={castDeviceId}
              onChange={(e) => setCastDeviceId(e.target.value)}
              disabled={!castDevices.length}
            >
              <option value="">
                {castDevices.length ? "Select Chromecast…" : "No devices yet"}
              </option>
              {castDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <div className="onair__cast-actions">
            <button
              type="button"
              className="onair__btn onair__btn--ghost"
              disabled={castBusy}
              onClick={() => void refreshCastDevices()}
            >
              Find devices
            </button>
            <button
              type="button"
              className="onair__btn"
              disabled={castBusy || (!castUrl && mode !== "local-av")}
              onClick={() => void handleCast()}
            >
              Cast on-air
            </button>
          </div>
          {castStatus ? (
            <p className="onair__status" role="status">
              {castStatus}
            </p>
          ) : null}
          <p className="onair__hint">{miracastHint()}</p>
        </div>
      </div>
    </section>
  );
}
