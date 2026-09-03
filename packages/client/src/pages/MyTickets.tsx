import { useCallback, useEffect, useMemo, useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import toast from "react-hot-toast";
import { TicketStatus } from "@eventhub/shared";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import TicketRow from "../components/tickets/TicketRow";
import TicketGroupRow from "../components/tickets/TicketGroupRow";
import { fetchMyTickets } from "../api/tickets";
import { createPaypalOrder, getPaypalApprovalLink, setPendingPayment } from "../api/payments";
import { ApiError } from "../api/client";
import { redirectTo } from "../lib/navigation";
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

/** Tickets reserved together (same type, same call) share this exact hold timestamp. */
function groupKey(ticket: TicketWithContextDto): string {
  return `${ticket.ticketType.id}::${ticket.reservationExpiresAt}`;
}

function MyTicketsContent({ userId }: { userId: number }) {
  const [tickets, setTickets] = useState<TicketWithContextDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchMyTickets(userId)
      .then(setTickets)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your tickets."))
      .finally(() => setIsLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Reserved tickets from the same batch (same type, same hold timestamp)
  // collapse into one row that pays for all of them at once; everything
  // else (confirmed/cancelled, or a lone reservation) stays one row each.
  const rows = useMemo(() => {
    const reservedGroups = new Map<string, TicketWithContextDto[]>();
    for (const ticket of tickets) {
      if (ticket.status !== TicketStatus.Reserved) continue;
      const key = groupKey(ticket);
      const group = reservedGroups.get(key);
      if (group) group.push(ticket);
      else reservedGroups.set(key, [ticket]);
    }

    const seen = new Set<string>();
    const result: { key: string; tickets: TicketWithContextDto[] }[] = [];
    for (const ticket of tickets) {
      if (ticket.status !== TicketStatus.Reserved) {
        result.push({ key: `single:${ticket.id}`, tickets: [ticket] });
        continue;
      }
      const key = groupKey(ticket);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ key, tickets: reservedGroups.get(key) ?? [ticket] });
    }
    return result;
  }, [tickets]);

  async function payFor(key: string, batch: TicketWithContextDto[]) {
    setPendingKey(key);
    try {
      const ticketIds = batch.map((t) => t.id);
      const order = await createPaypalOrder(ticketIds, window.location.origin);
      const approvalLink = getPaypalApprovalLink(order);
      if (!approvalLink) throw new Error("PayPal didn't return an approval link.");

      setPendingPayment({ ticketIds, orderId: order.id });
      redirectTo(approvalLink);
    } catch (err) {
      const label = batch.length === 1 ? `"${batch[0]!.event.title}"` : `these ${batch.length} tickets`;
      toast.error(err instanceof ApiError ? err.message : `Couldn't start payment for ${label}.`);
      setPendingKey(null);
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

      {!isLoading && !error && tickets.length === 0 && (
        <EmptyState
          icon={TicketIcon}
          title="No tickets yet"
          description="Reserve a ticket from an event page and it'll show up here."
        />
      )}

      {!isLoading && !error && rows.length > 0 && (
        <div className="my-tickets-page__list">
          {rows.map(({ key, tickets: batch }) =>
            batch.length > 1 ? (
              <TicketGroupRow
                key={key}
                tickets={batch}
                isBusy={pendingKey === key}
                onPay={(group) => payFor(key, group)}
              />
            ) : (
              <TicketRow
                key={key}
                ticket={batch[0]!}
                isBusy={pendingKey === key}
                onPay={(ticket) => payFor(key, [ticket])}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
