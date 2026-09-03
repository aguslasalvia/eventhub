import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useParams } from "react-router";
import { Calendar, TicketPlus } from "lucide-react";
import toast from "react-hot-toast";
import { TicketCategories } from "@eventhub/shared";
import { Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import RequireOrganizer from "../components/auth/RequireOrganizer";
import { fetchOrganizerEvents } from "../api/events";
import { createTicketType, fetchTicketTypesByEvent } from "../api/ticketTypes";
import { ApiError } from "../api/client";
import { ticketCategoryLabel } from "../lib/enumLabels";
import { formatPrice } from "../lib/format";
import { useAuth } from "../hooks/useAuth";
import type { EventDto, TicketTypeDto } from "../api/types";
import "./AuthPage.css";
import "./ManageTicketTypes.css";

export default function ManageTicketTypes() {
  return (
    <RequireOrganizer>
      <ManageTicketTypesContent />
    </RequireOrganizer>
  );
}

function ManageTicketTypesContent() {
  const { id } = useParams<{ id: string }>();
  const routerLocation = useLocation();
  const { user } = useAuth();

  const passedEvent = (routerLocation.state as { event?: EventDto } | null)?.event;

  const [event, setEvent] = useState<EventDto | null>(passedEvent ?? null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(!passedEvent);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDto[]>([]);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState<TicketCategories>(TicketCategories.Economic);
  const [price, setPrice] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (passedEvent || !user) return;
    fetchOrganizerEvents(user.id)
      .then((events) => setEvent(events.find((e) => e.id === Number(id)) ?? null))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load this event."))
      .finally(() => setIsLoadingEvent(false));
  }, [passedEvent, user, id]);

  useEffect(() => {
    if (!id) return;
    fetchTicketTypesByEvent(Number(id))
      .then(setTicketTypes)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load ticket types."))
      .finally(() => setIsLoadingTicketTypes(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const priceValue = Number(price);
    const capacityValue = Number(totalCapacity);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("Enter a valid price.");
      return;
    }
    if (isNaN(capacityValue) || capacityValue <= 0) {
      toast.error("Enter a capacity greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createTicketType({ eventId: Number(id), category, price: priceValue, totalCapacity: capacityValue });
      setTicketTypes((prev) => [...prev, created]);
      setPrice("");
      setTotalCapacity("");
      toast.success("Ticket type added.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create this ticket type.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingEvent) {
    return (
      <section className="container section auth-page">
        <Spinner label="Loading event…" />
      </section>
    );
  }

  if (!event || event.organizerId !== user?.id) {
    return (
      <section className="container section auth-page">
        <EmptyState
          icon={Calendar}
          title="Event not found"
          description="This event may have been removed, or you don't own it."
        />
      </section>
    );
  }

  return (
    <section className="container section manage-tickets-page">
      <header className="manage-tickets-page__heading">
        <h1>Ticket types</h1>
        <p>Managing tickets for "{event.title}".</p>
      </header>

      {loadError && <Alert tone="danger">{loadError}</Alert>}

      {isLoadingTicketTypes ? (
        <Spinner label="Loading ticket types…" />
      ) : ticketTypes.length === 0 ? (
        <EmptyState
          icon={TicketPlus}
          title="No ticket types yet"
          description="Add one below so attendees have something to reserve."
        />
      ) : (
        <ul className="manage-tickets-page__list">
          {ticketTypes.map((ticketType) => (
            <li key={ticketType.id} className="manage-tickets-page__item">
              <span className="manage-tickets-page__item-category">{ticketCategoryLabel[ticketType.category]}</span>
              <span className="manage-tickets-page__item-meta">
                {formatPrice(ticketType.price)} · {ticketType.availableCapacity}/{ticketType.totalCapacity} available
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="auth-card manage-tickets-page__form-card">
        <h2>Add a ticket type</h2>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Select
            label="Category"
            htmlFor="ticket-category"
            value={category}
            onChange={(e) => setCategory(Number(e.target.value) as TicketCategories)}
          >
            {Object.entries(ticketCategoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <div className="manage-tickets-page__row">
            <Input
              label="Price"
              htmlFor="ticket-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Capacity"
              htmlFor="ticket-capacity"
              type="number"
              min={1}
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(e.target.value)}
            />
          </div>

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add ticket type"}
          </Button>
        </form>
      </div>

      <Button to="/dashboard" variant="secondary" className="manage-tickets-page__back">
        Back to dashboard
      </Button>
    </section>
  );
}
