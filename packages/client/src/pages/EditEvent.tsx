import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { Calendar, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import EventForm from "../components/events/EventForm";
import type { EventFormValues } from "../components/events/EventForm";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import RequireOrganizer from "../components/auth/RequireOrganizer";
import { fetchOrganizerEvents, updateEvent } from "../api/events";
import { ApiError } from "../api/client";
import { toDateTimeLocalValue, toMySQLDateTime } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import type { EventDto } from "../api/types";
import "./AuthPage.css";
import "./CreateEvent.css";

export default function EditEvent() {
  return (
    <RequireOrganizer>
      <EditEventForm />
    </RequireOrganizer>
  );
}

function EditEventForm() {
  const { id } = useParams<{ id: string }>();
  const routerLocation = useLocation();
  const { user } = useAuth();
  const { refetch: refetchPublicEvents } = useEvents();

  const passedEvent = (routerLocation.state as { event?: EventDto } | null)?.event;

  const [event, setEvent] = useState<EventDto | null>(passedEvent ?? null);
  const [isLoading, setIsLoading] = useState(!passedEvent);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    if (passedEvent || !user) return;
    fetchOrganizerEvents(user.id)
      .then((events) => setEvent(events.find((e) => e.id === Number(id)) ?? null))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load this event."))
      .finally(() => setIsLoading(false));
  }, [passedEvent, user, id]);

  async function handleSubmit(values: EventFormValues) {
    if (!event) return;
    setStatus("submitting");
    try {
      const updated = await updateEvent(event.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        location: values.location.trim() || null,
        date: values.date ? toMySQLDateTime(values.date) : null,
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : null,
      });
      setEvent(updated);
      setStatus("success");
      toast.success("Changes saved.");
      refetchPublicEvents();
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <section className="container section auth-page">
        <Spinner label="Loading event…" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="container section auth-page">
        <Alert tone="danger">{loadError}</Alert>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="container section auth-page">
        <EmptyState
          icon={Calendar}
          title="Event not found"
          description="This event may have been removed, or the link is incorrect."
        />
      </section>
    );
  }

  if (event.organizerId !== user?.id) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <h1>Not your event</h1>
          <p className="auth-card__subtitle">You can only edit events you organize.</p>
          <Button to="/dashboard" variant="secondary" fullWidth>
            Back to dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container section auth-page">
      <div className="auth-card create-event-card">
        <div className="auth-card__icon">
          <Pencil size={20} />
        </div>
        <h1>Edit event</h1>
        <p className="auth-card__subtitle">Update the details for "{event.title}".</p>

        <EventForm
          initialValues={{
            title: event.title,
            description: event.description,
            category: event.category,
            location: event.location ?? "",
            date: toDateTimeLocalValue(event.date),
            maxCapacity: event.maxCapacity ? String(event.maxCapacity) : "",
          }}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          isSubmitting={status === "submitting"}
          onSubmit={handleSubmit}
        />

        <Button to="/dashboard" variant="secondary" fullWidth className="auth-card__cta">
          Back to dashboard
        </Button>
      </div>
    </section>
  );
}
