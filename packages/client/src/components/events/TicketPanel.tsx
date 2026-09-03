import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { CalendarOff, CircleCheck, Minus, Plus, Ticket, TicketX } from "lucide-react";
import toast from "react-hot-toast";
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
import PayPalCheckoutButtons from "../payments/PayPalCheckoutButtons";
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

// Mirrors TicketService.MAX_RESERVE_QUANTITY on the server — the server is
// the source of truth and re-validates this, this just avoids letting
// someone dial up a quantity request that's guaranteed to be rejected.
const MAX_QUANTITY = 10;

export default function TicketPanel({ event }: { event: EventDto }) {
  const { user } = useAuth();

  const isPublished = event.status === EventState.Published;

  const [ticketTypes, setTicketTypes] = useState<TicketTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(isPublished);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reservedTickets, setReservedTickets] = useState<TicketDto[] | null>(null);
  const [paidTickets, setPaidTickets] = useState<TicketDto[] | null>(null);

  useEffect(() => {
    if (!isPublished) return;
    fetchTicketTypesByEvent(event.id)
      .then(setTicketTypes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load ticket types."))
      .finally(() => setIsLoading(false));
  }, [event.id, isPublished]);

  function maxFor(ticketType: TicketTypeDto): number {
    return Math.max(1, Math.min(ticketType.availableCapacity, MAX_QUANTITY));
  }

  function getQuantity(ticketType: TicketTypeDto): number {
    return Math.min(quantities[ticketType.id] ?? 1, maxFor(ticketType));
  }

  function setQuantity(ticketType: TicketTypeDto, next: number) {
    const clamped = Math.min(Math.max(next, 1), maxFor(ticketType));
    setQuantities((prev) => ({ ...prev, [ticketType.id]: clamped }));
  }

  async function handleReserve(ticketType: TicketTypeDto) {
    if (!user) return;
    const quantity = getQuantity(ticketType);
    setReservingId(ticketType.id);
    try {
      const tickets = await reserveTicket(ticketType.id, user.id, quantity);
      setReservedTickets(tickets);
      setTicketTypes((prev) =>
        prev.map((t) => (t.id === ticketType.id ? { ...t, availableCapacity: t.availableCapacity - quantity } : t)),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't reserve these tickets.");
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

  if (paidTickets) {
    const count = paidTickets.length;
    return (
      <PanelShell icon={CircleCheck} title="Paid!">
        <p>{count === 1 ? "Your ticket is confirmed." : `Your ${count} tickets are confirmed.`} See you at the event!</p>
        <Button to="/my-tickets" variant="primary" fullWidth className="ticket-panel__cta">
          Go to my tickets
        </Button>
      </PanelShell>
    );
  }

  if (reservedTickets) {
    const [firstTicket] = reservedTickets;
    const count = reservedTickets.length;
    return (
      <PanelShell icon={CircleCheck} title="Reserved!">
        <p>
          {count === 1 ? "Your spot is" : `Your ${count} spots are`} held until{" "}
          <strong>{formatEventDateTime(firstTicket?.reservationExpiresAt ?? null)}</strong> —{" "}
          {count === 1 ? "confirm it" : "confirm them"} before then.
        </p>
        <PayPalCheckoutButtons
          ticketIds={reservedTickets.map((t) => t.id)}
          onSuccess={setPaidTickets}
          className="ticket-panel__cta"
        />
        <Button to="/my-tickets" variant="ghost" fullWidth className="ticket-panel__cta">
          Pay later from my tickets
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
            const quantity = getQuantity(ticketType);
            const isBusy = reservingId === ticketType.id;
            return (
              <li key={ticketType.id} className="ticket-panel__item">
                <div className="ticket-panel__item-info">
                  <span className="ticket-panel__item-category">{ticketCategoryLabel[ticketType.category]}</span>
                  <span className="ticket-panel__item-meta">
                    {formatPrice(ticketType.price)} · {soldOut ? "Sold out" : `${ticketType.availableCapacity} left`}
                  </span>
                </div>

                <div className="ticket-panel__actions">
                  {!soldOut && (
                    <div className="ticket-panel__stepper">
                      <button
                        type="button"
                        aria-label={`Fewer ${ticketCategoryLabel[ticketType.category]} tickets`}
                        onClick={() => setQuantity(ticketType, quantity - 1)}
                        disabled={isBusy || quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`More ${ticketCategoryLabel[ticketType.category]} tickets`}
                        onClick={() => setQuantity(ticketType, quantity + 1)}
                        disabled={isBusy || quantity >= maxFor(ticketType)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleReserve(ticketType)}
                    disabled={soldOut || isBusy}
                  >
                    {isBusy ? "Reserving…" : "Reserve"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/my-tickets" className="ticket-panel__link">
        View my tickets
      </Link>
    </div>
  );
}
