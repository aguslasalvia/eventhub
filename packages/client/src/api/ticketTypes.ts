import { request } from "./client";
import type { TicketTypeDto } from "./types";

/** GET /api/ticket-types/event/:eventId */
export function fetchTicketTypesByEvent(eventId: number): Promise<TicketTypeDto[]> {
  return request<TicketTypeDto[]>(`/ticket-types/event/${eventId}`);
}

export interface CreateTicketTypePayload {
  eventId: number;
  category: number;
  price: number;
  totalCapacity: number;
}

/** POST /api/ticket-types */
export function createTicketType(payload: CreateTicketTypePayload): Promise<TicketTypeDto> {
  return request<TicketTypeDto>("/ticket-types", { method: "POST", body: payload });
}
