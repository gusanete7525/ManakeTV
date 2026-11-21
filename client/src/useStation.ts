import { useEffect, useState } from "react";
import { emptyStation, sanitizeItem, sanitizeStation, type PlaylistItem, type Station } from "./station";

const STORAGE_KEY = "manaketv.station.v1";

function loadStation(): Station {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStation();
    return sanitizeStation(JSON.parse(raw) as unknown);
  } catch {
    return emptyStation();
  }
}

export function useStation() {
  const [station, setStation] = useState<Station>(loadStation);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(station));
  }, [station]);

  function addItem(item: PlaylistItem) {
    const sanitized = sanitizeItem(item);
    if (!sanitized) return false;
    setStation((current) => ({ ...current, items: [...current.items, sanitized].slice(0, 400) }));
    return true;
  }

  function updateItem(id: string, patch: Partial<PlaylistItem>) {
    setStation((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item;
        return sanitizeItem({ ...item, ...patch }) ?? item;
      }),
    }));
  }

  function removeItem(id: string) {
    setStation((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
  }

  function rename(name: string) {
    setStation((current) => sanitizeStation({ ...current, name }));
  }

  function replaceStation(next: Station) {
    setStation(sanitizeStation(next));
  }

  return { station, addItem, updateItem, removeItem, rename, replaceStation };
}
