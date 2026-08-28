import { TicketCategories } from "../enums/tickets"

export interface TicketType {
  id: number | null;
  category: TicketCategories;
  price: number;
  totalCapacity: number;
  availableCapacity: number;
  eventId: number;
}