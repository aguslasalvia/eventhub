import { Link } from "react-router";
import { Calendar, MapPin } from "lucide-react";
import { TicketStatus } from "@eventhub/shared";
import type { TicketWithContextDto } from "../../api/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { ticketCategoryLabel, ticketStatusLabel, ticketStatusTone } from "../../lib/enumLabels";
import { formatEventDate, formatEventDateTime, formatLocation, formatPrice } from "../../lib/format";
import "./TicketRow.css";

interface TicketRowProps {
  ticket: TicketWithContextDto;
  isBusy: boolean;
  onPay: (ticket: TicketWithContextDto) => void;
}

export default function TicketRow({ ticket, isBusy, onPay }: TicketRowProps) {
  const isExpired =
    ticket.status === TicketStatus.Reserved &&
    ticket.reservationExpiresAt !== null &&
    new Date(ticket.reservationExpiresAt) < new Date();

  return (
    <div className="ticket-row">
      <div className="ticket-row__main">
        <div className="ticket-row__heading">
          <Badge tone={ticketStatusTone[ticket.status]}>{ticketStatusLabel[ticket.status]}</Badge>
          <Link to={`/events/${ticket.event.id}`} className="ticket-row__event-title">
            {ticket.event.title}
          </Link>
        </div>

        <div className="ticket-row__meta">
          <span>
            <Calendar size={14} /> {formatEventDate(ticket.event.date)}
          </span>
          <span>
            <MapPin size={14} /> {formatLocation(ticket.event.location)}
          </span>
          <span>
            {ticketCategoryLabel[ticket.ticketType.category]} · {formatPrice(ticket.ticketType.price)}
          </span>
        </div>

        {ticket.status === TicketStatus.Reserved && (
          <p className={`ticket-row__expiry ${isExpired ? "ticket-row__expiry--expired" : ""}`}>
            {isExpired
              ? `Reservation expired ${formatEventDateTime(ticket.reservationExpiresAt)}`
              : `Held until ${formatEventDateTime(ticket.reservationExpiresAt)}`}
          </p>
        )}
        {ticket.status === TicketStatus.Confirmed && ticket.qrCode && (
          <p className="ticket-row__qr">QR code: {ticket.qrCode}</p>
        )}
      </div>

      {ticket.status === TicketStatus.Reserved && (
        <Button variant="primary" onClick={() => onPay(ticket)} disabled={isBusy || isExpired}>
          {isBusy ? "Redirecting…" : "Pay with PayPal"}
        </Button>
      )}
    </div>
  );
}
