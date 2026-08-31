import type { EventDto } from "../../api/types";
import EventCard from "./EventCard";
import "./EventGrid.css";

export default function EventGrid({ events }: { events: EventDto[] }) {
  return (
    <div className="event-grid">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
