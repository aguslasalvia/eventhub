import type { EventCategory, EventState, TicketCategories, TicketStatus, UserType } from "@eventhub/shared";

/** Shape returned by the server's Event.toJSON() — dates arrive as ISO strings over JSON. */
export interface EventDto {
  id: number;
  title: string;
  description: string;
  location: string | null;
  date: string | null;
  maxCapacity: number | null;
  category: EventCategory;
  organizerId: number;
  status: EventState;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: EventCategory;
  organizerId: number;
  location: string | null;
  date: string | null;
  maxCapacity: number | null;
}

export interface UpdateEventPayload {
  title: string;
  description: string;
  category: EventCategory;
  location: string | null;
  date: string | null;
  maxCapacity: number | null;
}

/** Shape returned by the server's TicketType.toJSON(). */
export interface TicketTypeDto {
  id: number;
  category: TicketCategories;
  price: number;
  totalCapacity: number;
  availableCapacity: number;
  eventId: number;
}

/** Shape returned by the server's Ticket.toJSON() (e.g. right after reserving/confirming). */
export interface TicketDto {
  id: number;
  ticketTypeId: number;
  userId: number;
  qrCode: string | null;
  status: TicketStatus;
  purchaseDate: string | null;
  reservationExpiresAt: string | null;
}

/** Shape returned by GET /tickets/user/:userId — joined with ticket type + event for display. */
export interface TicketWithContextDto {
  id: number;
  status: TicketStatus;
  qrCode: string | null;
  purchaseDate: string | null;
  reservationExpiresAt: string | null;
  ticketType: {
    id: number;
    category: TicketCategories;
    price: number;
  };
  event: {
    id: number;
    title: string;
    date: string | null;
    location: string | null;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  userType: UserType;
}

export interface LoginPayload {
  email: string,
  password: string
}

export interface AuthResponseDto {
  user: {
    id: number;
    name: string;
    email: string;
    userType: UserType;
  };
  token: string;
  refreshToken: string;
}

/** Shape returned by POST /api/payment/paypal/create-order — a PayPal Orders v2 order. */
export interface PaypalOrderDto {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}

/** Shape returned by POST /api/payment/paypal/capture-order/:orderId. */
export interface PaypalCaptureDto {
  ticket: TicketDto;
  capture: { id: string; status: string };
}
