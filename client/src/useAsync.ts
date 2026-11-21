import { useEffect, useState } from "react";

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

export function useAsync<T>(key: string, load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading", data: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", data: null, error: null });
    load().then(
      (data) => {
        if (active) setState({ status: "ready", data, error: null });
      },
      (error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "No se ha podido cargar.";
        setState({ status: "error", data: null, error: message });
      },
    );
    return () => {
      active = false;
    };
    // `key` carries every input that should refetch. `load` is the closure of that render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
