import { Link } from "react-router";
import { Calendar, MapPin, Users } from "lucide-react";
import type { EventDto } from "../../api/types";
import Badge from "../ui/Badge";
import { eventStateLabel, eventStateTone } from "../../lib/enumLabels";
import { formatCapacity, formatEventDate, formatLocation } from "../../lib/format";
import "./EventCard.css";

export default function EventCard({ event }: { event: EventDto }) {
  return (
    <Link to={`/events/${event.id}`} className="event-card">
      <div className="event-card__header">
        <Badge tone={eventStateTone[event.status]}>{eventStateLabel[event.status]}</Badge>
      </div>

      <h3 className="event-card__title">{event.title}</h3>
      <p className="event-card__description">{event.description}</p>

      <dl className="event-card__meta">
        <div className="event-card__meta-item">
          <Calendar size={15} />
          <span>{formatEventDate(event.date)}</span>
        </div>
        <div className="event-card__meta-item">
          <MapPin size={15} />
          <span>{formatLocation(event.location)}</span>
        </div>
        <div className="event-card__meta-item">
          <Users size={15} />
          <span>{formatCapacity(event.maxCapacity)}</span>
        </div>
      </dl>
    </Link>
  );
}
