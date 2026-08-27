import { TicketCategories } from "@eventhub/shared"

export interface TicketType {
  id: number | null;
  category: TicketCategories;
  price: number;
  totalCapacity: number;
  availableCapacity: number;
  eventId: number;
}

export default class TicketService {
  
}