import type { FormEvent } from "react";
import type { MediaItem, SourceKind } from "../types";
import "./MediaLibrary.css";

type MediaLibraryProps = {
  media: MediaItem[];
  onAdd: (item: Omit<MediaItem, "id" | "createdAt">) => void;
};

export function MediaLibrary({ media, onAdd }: MediaLibraryProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const sourceKind = String(data.get("sourceKind") ?? "url") as SourceKind;
    const url = String(data.get("url") ?? "").trim() || undefined;
    const localFileName =
      String(data.get("localFileName") ?? "").trim() || undefined;

    if (!title) return;
    if (sourceKind === "url" && !url) return;
    if (sourceKind === "local" && !localFileName) return;

    onAdd({
      title,
      sourceKind,
      url: sourceKind === "url" ? url : undefined,
      localFileName: sourceKind === "local" ? localFileName : undefined,
    });
    form.reset();
  }

  return (
    <section className="library" aria-label="Media library">
      <header className="library__header">
        <h2 className="library__title">Library</h2>
        <p className="library__hint">
          Your URLs and local files only — no scraped catalogs.
        </p>
      </header>

      <form className="library__form" onSubmit={handleSubmit}>
        <label className="library__field">
          <span>Title</span>
          <input name="title" required placeholder="e.g. Evening news catch-up" />
        </label>
        <label className="library__field">
          <span>Source</span>
          <select name="sourceKind" defaultValue="url">
            <option value="url">Pasted URL</option>
            <option value="local">Local file name</option>
          </select>
        </label>
        <label className="library__field">
          <span>URL</span>
          <input
            name="url"
            type="url"
            placeholder="https://… (stream or page you may use)"
          />
        </label>
        <label className="library__field">
          <span>Local file</span>
          <input name="localFileName" placeholder="movie.mp4 (Phase 1: name only)" />
        </label>
        <button type="submit" className="library__submit">
          Add to library
        </button>
      </form>

      <ul className="library__list">
        {media.length === 0 ? (
          <li className="library__empty">Library empty.</li>
        ) : (
          media.map((item) => (
            <li key={item.id} className="library__item">
              <strong>{item.title}</strong>
              <span className="library__meta">
                {item.sourceKind}
                {item.url ? ` · ${item.url}` : ""}
                {item.localFileName ? ` · ${item.localFileName}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
