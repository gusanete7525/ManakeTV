import { useEffect, useState } from "react";
import { Antenna, somethingIsOnAir } from "./Antenna";
import { Catalog } from "./Catalog";
import { formatClock } from "./format";
import { Playlist } from "./Playlist";
import { useStation } from "./useStation";

type Screen = "antena" | "playlist" | "catalogo";

export function App() {
  const stationApi = useStation();
  const [screen, setScreen] = useState<Screen>("antena");
  const [now, setNow] = useState(() => new Date());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const onAir = somethingIsOnAir(stationApi.station.items, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (previewId && !stationApi.station.items.some((item) => item.id === previewId)) setPreviewId(null);
  }, [previewId, stationApi.station.items]);

  function renderScreen(current: Screen) {
    switch (current) {
      case "antena":
        return (
          <Antenna
            station={stationApi.station}
            now={now}
            previewId={previewId}
            onOpenCatalog={() => setScreen("catalogo")}
            onStopPreview={() => setPreviewId(null)}
          />
        );
      case "playlist":
        return (
          <Playlist
            station={stationApi.station}
            now={now}
            onRename={stationApi.rename}
            onChangeItem={stationApi.updateItem}
            onRemove={stationApi.removeItem}
            onReplace={stationApi.replaceStation}
            onPreview={(id) => {
              setPreviewId(id);
              setScreen("antena");
            }}
            onNotify={setToast}
          />
        );
      case "catalogo":
        return (
          <Catalog
            items={stationApi.station.items}
            now={now}
            onAdd={(item) => {
              const added = stationApi.addItem(item);
              setToast(added ? `${item.title} entra a las ${item.startTime}.` : "No se ha podido añadir.");
            }}
          />
        );
      default: {
        const neverScreen: never = current;
        return neverScreen;
      }
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="kicker">Canal personal</p>
          <h1>
            {stationApi.station.name}
            <span>TV</span>
          </h1>
        </div>
        <p className="clock" data-testid="clock">
          {formatClock(now)}
        </p>
        <nav>
          <button type="button" aria-current={screen === "antena" ? "page" : undefined} onClick={() => setScreen("antena")}>
            {onAir ? <i className="live-dot" aria-hidden="true" /> : null}
            Antena
          </button>
          <button type="button" aria-current={screen === "playlist" ? "page" : undefined} onClick={() => setScreen("playlist")}>
            Playlist
          </button>
          <button type="button" aria-current={screen === "catalogo" ? "page" : undefined} onClick={() => setScreen("catalogo")}>
            Catálogo
          </button>
        </nav>
      </header>
      <main>{renderScreen(screen)}</main>
      <footer>
        Contenido de RTVE Play, reproducido desde sus servidores. ManakeTV guarda la playlist solo en este navegador.
      </footer>
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
