import { createContext } from "react";
import type { EventDto } from "../api/types";

export interface EventsContextValue {
  events: EventDto[];
  isLoading: boolean;
  error: string | null;
  getById: (id: number) => EventDto | undefined;
  refetch: () => void;
}

export const EventsContext = createContext<EventsContextValue | null>(null);
