import { useMemo, useState } from "react";
import { CalendarSearch } from "lucide-react";
import type { EventState } from "@eventhub/shared";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import EventGrid from "../components/events/EventGrid";
import EventFilters from "../components/events/EventFilters";
import { useEvents } from "../hooks/useEvents";
import "./Events.css";

export default function Events() {
  const { events, isLoading, error } = useEvents();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EventState | "all">("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesStatus = status === "all" || event.status === status;
      const matchesSearch =
        term.length === 0 ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [events, search, status]);

  return (
    <section className="container section events-page">
      <header className="events-page__heading">
        <h1>All events</h1>
        <p>Everything organizers have published so far.</p>
      </header>

      <EventFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />

      {isLoading && <Spinner label="Loading events…" />}
      {!isLoading && error && <Alert tone="danger">{error}</Alert>}
      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={CalendarSearch}
          title="No events match your search"
          description="Try a different keyword or clear the status filter."
        />
      )}
      {!isLoading && !error && filtered.length > 0 && <EventGrid events={filtered} />}
    </section>
  );
}
