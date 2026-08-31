import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import RequireOrganizer from "../components/auth/RequireOrganizer";
import OrganizerEventRow from "../components/events/OrganizerEventRow";
import { fetchOrganizerEvents, publishEvent, unpublishEvent } from "../api/events";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import type { EventDto } from "../api/types";
import "./OrganizerDashboard.css";

export default function OrganizerDashboard() {
  return (
    <RequireOrganizer>
      <OrganizerDashboardContent />
    </RequireOrganizer>
  );
}

function OrganizerDashboardContent() {
  const { user } = useAuth();
  const { refetch: refetchPublicEvents } = useEvents();

  const [events, setEvents] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    fetchOrganizerEvents(user.id)
      .then(setEvents)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your events."))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(event: EventDto) {
    setPendingId(event.id);
    setActionError(null);
    try {
      const updated = await publishEvent(event.id);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      refetchPublicEvents();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Couldn't publish "${event.title}".`);
    } finally {
      setPendingId(null);
    }
  }

  async function handleUnpublish(event: EventDto) {
    setPendingId(event.id);
    setActionError(null);
    try {
      const updated = await unpublishEvent(event.id);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      refetchPublicEvents();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Couldn't unpublish "${event.title}".`);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="container section dashboard-page">
      <header className="dashboard-page__heading">
        <div>
          <h1>Your events</h1>
          <p>Manage drafts and published events for your account.</p>
        </div>
        <Button to="/events/new" variant="primary">
          Create event
        </Button>
      </header>

      {isLoading && <Spinner label="Loading your events…" />}
      {!isLoading && error && <Alert tone="danger">{error}</Alert>}
      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {!isLoading && !error && events.length === 0 && (
        <EmptyState
          icon={LayoutDashboard}
          title="You haven't created any events yet"
          description="Events you create will show up here so you can publish them."
        />
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="dashboard-page__list">
          {events.map((event) => (
            <OrganizerEventRow
              key={event.id}
              event={event}
              isBusy={pendingId === event.id}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          ))}
        </div>
      )}
    </section>
  );
}
