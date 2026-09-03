import { request } from "./client";
import type { TicketDto, TicketWithContextDto } from "./types";

/** POST /api/tickets — reserves `quantity` tickets at once, each held for a 10-minute window until confirmed. */
export function reserveTicket(ticketTypeId: number, userId: number, quantity: number = 1): Promise<TicketDto[]> {
  return request<TicketDto[]>("/tickets", { method: "POST", body: { ticketTypeId, userId, quantity } });
}

/** GET /api/tickets/user/:userId — joined with ticket type + event context. */
export function fetchMyTickets(userId: number): Promise<TicketWithContextDto[]> {
  return request<TicketWithContextDto[]>(`/tickets/user/${userId}`);
}
