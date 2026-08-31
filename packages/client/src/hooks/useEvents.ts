import { useContext } from "react";
import { EventsContext, type EventsContextValue } from "../context/events-context";

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within an EventsProvider");
  return ctx;
}
