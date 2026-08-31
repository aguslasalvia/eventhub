import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fetchEvents } from "../api/events";
import { ApiError } from "../api/client";
import type { EventDto } from "../api/types";
import { EventsContext } from "./events-context";

/**
 * Loads the event list once and shares it across pages, since the API has
 * no GET /events/:id yet — the detail page resolves an event from this cache.
 */
export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "We couldn't load the events.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const getById = useCallback(
    (id: number) => events.find((event) => event.id === id),
    [events],
  );

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  const value = useMemo(
    () => ({ events, isLoading, error, getById, refetch }),
    [events, isLoading, error, getById, refetch],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}
