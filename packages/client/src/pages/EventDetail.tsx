import { Link, useParams } from "react-router";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import TicketPanel from "../components/events/TicketPanel";
import { useEvents } from "../hooks/useEvents";
import { eventStateLabel, eventStateTone } from "../lib/enumLabels";
import { formatCapacity, formatEventDateTime, formatLocation } from "../lib/format";
import "./EventDetail.css";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { getById, isLoading, error } = useEvents();
  const event = getById(Number(id));

  return (
    <section className="container section event-detail">
      <Link to="/events" className="event-detail__back">
        <ArrowLeft size={16} /> Back to events
      </Link>

      {isLoading && <Spinner label="Loading event…" />}
      {!isLoading && error && <Alert tone="danger">{error}</Alert>}

      {!isLoading && !error && !event && (
        <EmptyState
          icon={Calendar}
          title="Event not found"
          description="This event may have been removed, or the link is incorrect."
        />
      )}

      {!isLoading && !error && event && (
        <div className="event-detail__layout">
          <div className="event-detail__main">
            <Badge tone={eventStateTone[event.status]}>{eventStateLabel[event.status]}</Badge>
            <h1 className="event-detail__title">{event.title}</h1>

            <ul className="event-detail__meta">
              <li>
                <Calendar size={17} />
                {formatEventDateTime(event.date)}
              </li>
              <li>
                <MapPin size={17} />
                {formatLocation(event.location)}
              </li>
              <li>
                <Users size={17} />
                {formatCapacity(event.maxCapacity)}
              </li>
            </ul>

            <h2 className="event-detail__section-title">About this event</h2>
            <p className="event-detail__description">{event.description}</p>
          </div>

          <aside className="event-detail__aside">
            <TicketPanel event={event} />
          </aside>
        </div>
      )}
    </section>
  );
}
