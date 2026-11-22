import type { LocalFolderMeta, MediaItem } from "../types";
import { newId } from "../types";
import { mediaCanonicalKey } from "./canonicalize";

const MEDIA_EXT = /\.(mp4|webm|ogg|mkv|mov|mp3|m4a|wav|aac|flac)$/i;

export type DirectoryPickerSupported = boolean;

export function supportsDirectoryPicker(): DirectoryPickerSupported {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export function supportsOpenFilePicker(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

/** In-memory File handles — cannot survive reload without re-grant. */
const fileHandleStore = new Map<string, File>();

export function getLocalFile(mediaId: string): File | undefined {
  return fileHandleStore.get(mediaId);
}

export function setLocalFile(mediaId: string, file: File): void {
  fileHandleStore.set(mediaId, file);
}

export function revokeLocalObjectUrl(url: string | undefined): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

async function walkDirectory(
  dir: FileSystemDirectoryHandle,
  pathPrefix: string,
  out: { path: string; handle: FileSystemFileHandle }[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const path = pathPrefix ? `${pathPrefix}/${name}` : name;
    if (handle.kind === "file" && MEDIA_EXT.test(name)) {
      out.push({ path, handle });
    } else if (handle.kind === "directory") {
      await walkDirectory(handle, path, out);
    }
  }
}

export type FolderImportResult = {
  folder: LocalFolderMeta;
  media: MediaItem[];
};

export async function pickLocalFolder(): Promise<FolderImportResult | null> {
  if (!supportsDirectoryPicker()) {
    throw new Error(
      "Folder picker needs Chromium (Chrome/Edge) on a secure origin (https or localhost).",
    );
  }
  const dir = await window.showDirectoryPicker({ mode: "read" });
  const files: { path: string; handle: FileSystemFileHandle }[] = [];
  await walkDirectory(dir, "", files);

  const folderId = newId("folder");
  const media: MediaItem[] = [];

  for (const entry of files) {
    const file = await entry.handle.getFile();
    const id = newId("media");
    setLocalFile(id, file);
    const title = entry.path.split("/").pop() || entry.path;
    media.push({
      id,
      title,
      sourceKind: "local",
      localFileName: file.name,
      localPath: entry.path,
      folderId,
      durationHintSec: undefined,
      canonicalKey: mediaCanonicalKey({ title: entry.path }),
      createdAt: new Date().toISOString(),
      viable: true,
      lastCheckedAt: new Date().toISOString(),
    });
  }

  return {
    folder: {
      id: folderId,
      name: dir.name,
      addedAt: new Date().toISOString(),
      fileCount: media.length,
    },
    media,
  };
}

/** Fallback: multi file picker when directory API missing. */
export async function pickLocalFiles(): Promise<MediaItem[]> {
  if (supportsOpenFilePicker()) {
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: "Media",
          accept: {
            "video/*": [".mp4", ".webm", ".mkv", ".mov"],
            "audio/*": [".mp3", ".m4a", ".wav", ".ogg"],
          },
        },
      ],
    });
    const media: MediaItem[] = [];
    for (const handle of handles) {
      const file = await handle.getFile();
      const id = newId("media");
      setLocalFile(id, file);
      media.push({
        id,
        title: file.name,
        sourceKind: "local",
        localFileName: file.name,
        canonicalKey: mediaCanonicalKey({ title: file.name }),
        createdAt: new Date().toISOString(),
        viable: true,
        lastCheckedAt: new Date().toISOString(),
      });
    }
    return media;
  }

  // Legacy input fallback via Promise
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "video/*,audio/*";
    input.onchange = () => {
      const list = input.files;
      if (!list?.length) {
        resolve([]);
        return;
      }
      const media: MediaItem[] = [];
      for (const file of Array.from(list)) {
        const id = newId("media");
        setLocalFile(id, file);
        media.push({
          id,
          title: file.name,
          sourceKind: "local",
          localFileName: file.name,
          canonicalKey: mediaCanonicalKey({ title: file.name }),
          createdAt: new Date().toISOString(),
          viable: true,
          lastCheckedAt: new Date().toISOString(),
        });
      }
      resolve(media);
    };
    input.oncancel = () => resolve([]);
    input.onerror = () => reject(new Error("File picker failed"));
    input.click();
  });
}

declare global {
  interface Window {
    showDirectoryPicker: (opts?: {
      mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker: (opts?: {
      multiple?: boolean;
      types?: {
        description: string;
        accept: Record<string, string[]>;
      }[];
    }) => Promise<FileSystemFileHandle[]>;
  }
}
