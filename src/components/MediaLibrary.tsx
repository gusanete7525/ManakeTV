import { useState, type FormEvent } from "react";
import type { MediaItem } from "../types";
import {
  pickLocalFiles,
  pickLocalFolder,
  supportsDirectoryPicker,
} from "../lib/localFiles";
import { mediaCanonicalKey } from "../lib/canonicalize";
import "./MediaLibrary.css";

type MediaLibraryProps = {
  media: MediaItem[];
  query: string;
  onQueryChange: (q: string) => void;
  onAddUrl: (item: Omit<MediaItem, "id" | "createdAt">) => void;
  onAddMany: (items: MediaItem[]) => void;
  onAddFolder: (
    folder: { id: string; name: string; addedAt: string; fileCount: number },
    items: MediaItem[],
  ) => void;
};

export function MediaLibrary({
  media,
  query,
  onQueryChange,
  onAddUrl,
  onAddMany,
  onAddFolder,
}: MediaLibraryProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const url = String(data.get("url") ?? "").trim();
    if (!title || !url) return;
    onAddUrl({
      title,
      sourceKind: "url",
      url,
      canonicalKey: mediaCanonicalKey({ url, title }),
      viable: undefined,
    });
    form.reset();
  }

  async function handleFolder() {
    setError(null);
    setBusy(true);
    try {
      const result = await pickLocalFolder();
      if (result) onAddFolder(result.folder, result.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles() {
    setError(null);
    setBusy(true);
    try {
      const items = await pickLocalFiles();
      if (items.length) onAddMany(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="library" aria-label="Media library">
      <header className="library__header">
        <h2 className="library__title">Library</h2>
        <p className="library__hint">
          Your URLs and local media only — search covers library + public-feed
          proposals, never pirate indexes.
        </p>
      </header>

      <label className="library__search">
        <span>Search</span>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Title or URL…"
        />
      </label>

      <form className="library__form" onSubmit={handleSubmit}>
        <label className="library__field">
          <span>Title</span>
          <input name="title" required placeholder="e.g. Telediario replay" />
        </label>
        <label className="library__field">
          <span>URL you may use</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://…"
          />
        </label>
        <button type="submit" className="library__submit">
          Add URL
        </button>
      </form>

      <div className="library__local">
        {supportsDirectoryPicker() ? (
          <button type="button" disabled={busy} onClick={handleFolder}>
            Add local folder
          </button>
        ) : (
          <p className="library__limit">
            Folder picker needs Chrome/Edge on localhost or https. Use files
            instead.
          </p>
        )}
        <button type="button" disabled={busy} onClick={handleFiles}>
          Add local files
        </button>
      </div>

      {error ? <p className="library__error">{error}</p> : null}

      <ul className="library__list">
        {media.length === 0 ? (
          <li className="library__empty">No matches.</li>
        ) : (
          media.map((item) => (
            <li key={item.id} className="library__item">
              <strong>{item.title}</strong>
              <span className="library__meta">
                {item.sourceKind}
                {item.viable === false ? " · dead?" : ""}
                {item.viable === true ? " · ok" : ""}
                {item.url ? ` · ${item.url}` : ""}
                {item.localPath || item.localFileName
                  ? ` · ${item.localPath ?? item.localFileName}`
                  : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
