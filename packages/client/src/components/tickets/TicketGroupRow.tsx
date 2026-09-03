import { Link } from "react-router";
import { Calendar, MapPin } from "lucide-react";
import { TicketStatus } from "@eventhub/shared";
import type { TicketWithContextDto } from "../../api/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { ticketCategoryLabel, ticketStatusLabel, ticketStatusTone } from "../../lib/enumLabels";
import { formatEventDate, formatEventDateTime, formatLocation, formatPrice } from "../../lib/format";
import "./TicketRow.css";

interface TicketGroupRowProps {
  tickets: TicketWithContextDto[];
  isBusy: boolean;
  onPay: (tickets: TicketWithContextDto[]) => void;
}

/**
 * Same layout as TicketRow, but for several still-Reserved tickets of the
 * same type held under the same reservation — paid for with one PayPal
 * order instead of one redirect per ticket.
 */
export default function TicketGroupRow({ tickets, isBusy, onPay }: TicketGroupRowProps) {
  const [first] = tickets;
  if (!first) return null;

  const isExpired = first.reservationExpiresAt !== null && new Date(first.reservationExpiresAt) < new Date();
  const total = tickets.reduce((sum, t) => sum + t.ticketType.price, 0);

  return (
    <div className="ticket-row">
      <div className="ticket-row__main">
        <div className="ticket-row__heading">
          <Badge tone={ticketStatusTone[TicketStatus.Reserved]}>{ticketStatusLabel[TicketStatus.Reserved]}</Badge>
          <Link to={`/events/${first.event.id}`} className="ticket-row__event-title">
            {first.event.title}
          </Link>
        </div>

        <div className="ticket-row__meta">
          <span>
            <Calendar size={14} /> {formatEventDate(first.event.date)}
          </span>
          <span>
            <MapPin size={14} /> {formatLocation(first.event.location)}
          </span>
          <span>
            {tickets.length}× {ticketCategoryLabel[first.ticketType.category]} · {formatPrice(total)}
          </span>
        </div>

        <p className={`ticket-row__expiry ${isExpired ? "ticket-row__expiry--expired" : ""}`}>
          {isExpired
            ? `Reservation expired ${formatEventDateTime(first.reservationExpiresAt)}`
            : `Held until ${formatEventDateTime(first.reservationExpiresAt)}`}
        </p>
      </div>

      <Button variant="primary" onClick={() => onPay(tickets)} disabled={isBusy || isExpired}>
        {isBusy ? "Redirecting…" : `Pay ${tickets.length} with PayPal`}
      </Button>
    </div>
  );
}
