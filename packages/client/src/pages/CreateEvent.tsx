import { useState } from "react";
import { useNavigate } from "react-router";
import { CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";
import EventForm from "../components/events/EventForm";
import type { EventFormValues } from "../components/events/EventForm";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import RequireOrganizer from "../components/auth/RequireOrganizer";
import { createEvent, publishEvent } from "../api/events";
import { ApiError } from "../api/client";
import { toMySQLDateTime } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import type { EventDto } from "../api/types";
import "./AuthPage.css";
import "./CreateEvent.css";

export default function CreateEvent() {
  return (
    <RequireOrganizer>
      <CreateEventForm />
    </RequireOrganizer>
  );
}

function CreateEventForm() {
  const { user } = useAuth();
  const { refetch } = useEvents();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"idle" | "submitting" | "created">("idle");
  const [createdEvent, setCreatedEvent] = useState<EventDto | null>(null);
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published">("idle");

  async function handleSubmit(values: EventFormValues) {
    setStatus("submitting");
    try {
      const event = await createEvent({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        organizerId: user!.id,
        location: values.location.trim() || null,
        date: values.date ? toMySQLDateTime(values.date) : null,
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : null,
      });
      setCreatedEvent(event);
      setStatus("created");
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handlePublish() {
    if (!createdEvent) return;
    setPublishState("publishing");
    try {
      await publishEvent(createdEvent.id);
      setPublishState("published");
      refetch();
    } catch (err) {
      setPublishState("idle");
      toast.error(err instanceof ApiError ? err.message : "Couldn't publish the event.");
    }
  }

  if (status === "created" && createdEvent) {
    const canPublish = Boolean(createdEvent.location && createdEvent.date);

    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <Alert tone="success">"{createdEvent.title}" was created as a draft.</Alert>

          {publishState === "published" ? (
            <>
              <Alert tone="success">It's published — attendees can see it now.</Alert>
              <Button
                variant="primary"
                fullWidth
                className="auth-card__cta"
                onClick={() => navigate(`/events/${createdEvent.id}`)}
              >
                View event
              </Button>
            </>
          ) : canPublish ? (
            <>
              <p className="auth-card__subtitle">It has a date and location, so you can publish it right away.</p>
              <Button
                variant="primary"
                fullWidth
                className="auth-card__cta"
                onClick={handlePublish}
                disabled={publishState === "publishing"}
              >
                {publishState === "publishing" ? "Publishing…" : "Publish now"}
              </Button>
            </>
          ) : (
            <Alert tone="info">
              It needs a date and location to be published — you can add those from your dashboard.
            </Alert>
          )}

          <Button to="/dashboard" variant="secondary" fullWidth className="auth-card__cta">
            Go to dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container section auth-page">
      <div className="auth-card create-event-card">
        <div className="auth-card__icon">
          <CalendarPlus size={20} />
        </div>
        <h1>Create an event</h1>
        <p className="auth-card__subtitle">
          Add a date and location if you have them — you'll be able to publish right away.
        </p>

        <EventForm
          submitLabel="Create event"
          submittingLabel="Creating event…"
          isSubmitting={status === "submitting"}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
