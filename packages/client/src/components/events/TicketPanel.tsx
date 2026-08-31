import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { CalendarOff, CircleCheck, Ticket, TicketX } from "lucide-react";
import { EventState } from "@eventhub/shared";
import type { EventDto, TicketDto, TicketTypeDto } from "../../api/types";
import { fetchTicketTypesByEvent } from "../../api/ticketTypes";
import { reserveTicket } from "../../api/tickets";
import { ApiError } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { isOrganizer } from "../../lib/roles";
import { ticketCategoryLabel } from "../../lib/enumLabels";
import { formatEventDateTime, formatPrice } from "../../lib/format";
import Spinner from "../ui/Spinner";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import "./TicketPanel.css";

function PanelShell({
  icon: Icon,
  muted,
  title,
  children,
}: {
  icon: typeof Ticket;
  muted?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="ticket-panel">
      <div className={`ticket-panel__icon ${muted ? "ticket-panel__icon--muted" : ""}`}>
        <Icon size={20} />
      </div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default function TicketPanel({ event }: { event: EventDto }) {
  const { user } = useAuth();

  const isPublished = event.status === EventState.Published;

  const [ticketTypes, setTicketTypes] = useState<TicketTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(isPublished);
  const [error, setError] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reservedTicket, setReservedTicket] = useState<TicketDto | null>(null);

  useEffect(() => {
    if (!isPublished) return;
    fetchTicketTypesByEvent(event.id)
      .then(setTicketTypes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load ticket types."))
      .finally(() => setIsLoading(false));
  }, [event.id, isPublished]);

  async function handleReserve(ticketType: TicketTypeDto) {
    if (!user) return;
    setReservingId(ticketType.id);
    setReserveError(null);
    try {
      const ticket = await reserveTicket(ticketType.id, user.id);
      setReservedTicket(ticket);
      setTicketTypes((prev) =>
        prev.map((t) => (t.id === ticketType.id ? { ...t, availableCapacity: t.availableCapacity - 1 } : t)),
      );
    } catch (err) {
      setReserveError(err instanceof ApiError ? err.message : "Couldn't reserve this ticket.");
    } finally {
      setReservingId(null);
    }
  }

  if (!isPublished) {
    return (
      <PanelShell icon={CalendarOff} muted title="Tickets">
        <p>Tickets aren't available for this event.</p>
      </PanelShell>
    );
  }

  if (!user) {
    return (
      <PanelShell icon={Ticket} title="Tickets">
        <p>Log in to reserve a ticket for this event.</p>
        <Button to="/login" variant="primary" fullWidth className="ticket-panel__cta">
          Log in
        </Button>
      </PanelShell>
    );
  }

  if (isOrganizer(user)) {
    return (
      <PanelShell icon={TicketX} muted title="Tickets">
        <p>Organizer accounts can't purchase tickets — this event is only bookable by attendees.</p>
      </PanelShell>
    );
  }

  if (reservedTicket) {
    return (
      <PanelShell icon={CircleCheck} title="Reserved!">
        <p>
          Your spot is held until{" "}
          <strong>{formatEventDateTime(reservedTicket.reservationExpiresAt)}</strong> — confirm it before then.
        </p>
        <Button to="/my-tickets" variant="primary" fullWidth className="ticket-panel__cta">
          Go to my tickets
        </Button>
      </PanelShell>
    );
  }

  return (
    <div className="ticket-panel">
      <div className="ticket-panel__icon">
        <Ticket size={20} />
      </div>
      <h3>Tickets</h3>

      {isLoading && <Spinner label="Loading ticket types…" />}
      {!isLoading && error && <Alert tone="danger">{error}</Alert>}
      {!isLoading && !error && ticketTypes.length === 0 && <p>No ticket types have been added for this event yet.</p>}

      {!isLoading && !error && ticketTypes.length > 0 && (
        <ul className="ticket-panel__list">
          {ticketTypes.map((ticketType) => {
            const soldOut = ticketType.availableCapacity <= 0;
            return (
              <li key={ticketType.id} className="ticket-panel__item">
                <div className="ticket-panel__item-info">
                  <span className="ticket-panel__item-category">{ticketCategoryLabel[ticketType.category]}</span>
                  <span className="ticket-panel__item-meta">
                    {formatPrice(ticketType.price)} · {soldOut ? "Sold out" : `${ticketType.availableCapacity} left`}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleReserve(ticketType)}
                  disabled={soldOut || reservingId === ticketType.id}
                >
                  {reservingId === ticketType.id ? "Reserving…" : "Reserve"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {reserveError && <Alert tone="danger">{reserveError}</Alert>}

      <Link to="/my-tickets" className="ticket-panel__link">
        View my tickets
      </Link>
    </div>
  );
}
