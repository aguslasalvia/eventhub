import { Calendar, MapPin, Users } from "lucide-react";
import { EventState } from "@eventhub/shared";
import type { EventDto } from "../../api/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { eventStateLabel, eventStateTone } from "../../lib/enumLabels";
import { formatCapacity, formatEventDate, formatLocation } from "../../lib/format";
import "./OrganizerEventRow.css";

interface OrganizerEventRowProps {
  event: EventDto;
  isBusy: boolean;
  onPublish: (event: EventDto) => void;
  onUnpublish: (event: EventDto) => void;
}

export default function OrganizerEventRow({ event, isBusy, onPublish, onUnpublish }: OrganizerEventRowProps) {
  const canPublish = Boolean(event.location && event.date);

  return (
    <div className="organizer-row">
      <div className="organizer-row__main">
        <div className="organizer-row__heading">
          <Badge tone={eventStateTone[event.status]}>{eventStateLabel[event.status]}</Badge>
          <h3>{event.title}</h3>
        </div>
        <div className="organizer-row__meta">
          <span>
            <Calendar size={14} /> {formatEventDate(event.date)}
          </span>
          <span>
            <MapPin size={14} /> {formatLocation(event.location)}
          </span>
          <span>
            <Users size={14} /> {formatCapacity(event.maxCapacity)}
          </span>
        </div>
      </div>

      <div className="organizer-row__actions">
        <Button to={`/events/${event.id}/edit`} state={{ event }} variant="ghost">
          Edit
        </Button>
        <Button to={`/events/${event.id}/tickets`} state={{ event }} variant="ghost">
          Tickets
        </Button>
        {event.status === EventState.Draft && (
          <Button
            variant="primary"
            onClick={() => onPublish(event)}
            disabled={!canPublish || isBusy}
            title={canPublish ? undefined : "Needs a date and location to publish"}
          >
            {isBusy ? "Publishing…" : "Publish"}
          </Button>
        )}
        {event.status === EventState.Published && (
          <Button variant="secondary" onClick={() => onUnpublish(event)} disabled={isBusy}>
            {isBusy ? "Unpublishing…" : "Unpublish"}
          </Button>
        )}
      </div>
    </div>
  );
}
