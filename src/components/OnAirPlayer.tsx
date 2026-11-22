import { useEffect, useMemo, useState } from "react";
import type { MediaItem, ScheduleSlot } from "../types";
import { getLocalFile } from "../lib/localFiles";
import { looksLikeDirectMedia } from "../lib/viability";
import "./OnAirPlayer.css";

type OnAirPlayerProps = {
  slot: ScheduleSlot | null;
  media: MediaItem | null;
  nextTitle?: string;
};

export function OnAirPlayer({ slot, media, nextTitle }: OnAirPlayerProps) {
  const localFile =
    media?.sourceKind === "local" ? getLocalFile(media.id) : undefined;

  const [blobUrl, setBlobUrl] = useState<string | undefined>();

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
            <audio className="onair__audio" src={media.url} controls />
            <p className="onair__hint">
              Audio element tries the URL; if it fails, use the link above.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
