import { useCallback, useEffect, useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import TicketRow from "../components/tickets/TicketRow";
import { fetchMyTickets } from "../api/tickets";
import { createPaypalOrder, getPaypalApprovalLink, setPendingPayment } from "../api/payments";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import type { TicketWithContextDto } from "../api/types";
import "./MyTickets.css";

export default function MyTickets() {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <h1>Log in to see your tickets</h1>
          <p className="auth-card__subtitle">You need to be logged in to view your reservations.</p>
          <Button to="/login" variant="primary" fullWidth>
            Log in
          </Button>
        </div>
      </section>
    );
  }

  return <MyTicketsContent userId={user.id} />;
}

function MyTicketsContent({ userId }: { userId: number }) {
  const [tickets, setTickets] = useState<TicketWithContextDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchMyTickets(userId)
      .then(setTickets)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your tickets."))
      .finally(() => setIsLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePay(ticket: TicketWithContextDto) {
    setPendingId(ticket.id);
    setActionError(null);
    try {
      const order = await createPaypalOrder(ticket.id, window.location.origin);
      const approvalLink = getPaypalApprovalLink(order);
      if (!approvalLink) throw new Error("PayPal didn't return an approval link.");

      setPendingPayment({ ticketId: ticket.id, orderId: order.id });
      window.location.href = approvalLink;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : `Couldn't start payment for "${ticket.event.title}".`);
      setPendingId(null);
    }
  }

  return (
    <section className="container section my-tickets-page">
      <header className="my-tickets-page__heading">
        <h1>My tickets</h1>
        <p>Your reservations and confirmed tickets.</p>
      </header>

      {isLoading && <Spinner label="Loading your tickets…" />}
      {!isLoading && error && <Alert tone="danger">{error}</Alert>}
      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {!isLoading && !error && tickets.length === 0 && (
        <EmptyState
          icon={TicketIcon}
          title="No tickets yet"
          description="Reserve a ticket from an event page and it'll show up here."
        />
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <div className="my-tickets-page__list">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} isBusy={pendingId === ticket.id} onPay={handlePay} />
          ))}
        </div>
      )}
    </section>
  );
}
