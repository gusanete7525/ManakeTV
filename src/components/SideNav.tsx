import type { AppView } from "../types";
import "./SideNav.css";

type SideNavProps = {
  active: AppView;
  onNavigate: (view: AppView) => void;
  favoriteCount: number;
};

const ITEMS: { id: AppView; label: string; hint?: string }[] = [
  { id: "home", label: "En antena", hint: "Player + ahora" },
  { id: "podcast_tv", label: "Podcast TV", hint: "Programación TV/radio" },
  { id: "agregados", label: "Agregados", hint: "País + emisora" },
  { id: "favorites", label: "Favoritos" },
  { id: "parrilla", label: "Parrilla", hint: "Asistente + timeline" },
  { id: "barrido", label: "Barrido" },
  { id: "library", label: "Biblioteca" },
  { id: "sources", label: "Fuentes" },
];

export function SideNav({ active, onNavigate, favoriteCount }: SideNavProps) {
  return (
    <nav className="sidenav" aria-label="Menú FluxTV">
      <p className="sidenav__brand">Menú</p>
      <ul className="sidenav__list">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          const badge =
            item.id === "favorites" && favoriteCount > 0
              ? String(favoriteCount)
              : null;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={
                  isActive ? "sidenav__item sidenav__item--active" : "sidenav__item"
                }
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <span className="sidenav__label">{item.label}</span>
                {badge ? <span className="sidenav__badge">{badge}</span> : null}
                {item.hint ? (
                  <span className="sidenav__hint">{item.hint}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sidenav__legal">
        Solo RSS públicos y URLs tuyas. Sin Digi / Movistar / atomohd.
      </p>
    </nav>
  );
}
