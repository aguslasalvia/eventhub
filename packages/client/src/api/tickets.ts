import { request } from "./client";
import type { TicketDto, TicketWithContextDto } from "./types";

/** POST /api/tickets — reserves a ticket, held for a 10-minute window until confirmed. */
export function reserveTicket(ticketTypeId: number, userId: number): Promise<TicketDto> {
  return request<TicketDto>("/tickets", { method: "POST", body: { ticketTypeId, userId } });
}

/** POST /api/tickets/:id/confirm */
export function confirmTicket(id: number): Promise<TicketDto> {
  return request<TicketDto>(`/tickets/${id}/confirm`, { method: "POST" });
}

/** GET /api/tickets/user/:userId — joined with ticket type + event context. */
export function fetchMyTickets(userId: number): Promise<TicketWithContextDto[]> {
  return request<TicketWithContextDto[]>(`/tickets/user/${userId}`);
}
