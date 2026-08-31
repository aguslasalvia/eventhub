import { TicketCategories } from "@eventhub/shared";
import TicketType from "@core/entities/ticketType";
import { pool } from "../db/database";

export default class TicketTypeService {
  /**
   * Creates a new ticket type for an event, with availableCapacity starting
   * equal to totalCapacity.
   */
  static async create(
    eventId: number,
    category: TicketCategories,
    price: number,
    totalCapacity: number,
  ): Promise<TicketType> {
    const ticketType = new TicketType(null, category, price, totalCapacity, totalCapacity, eventId);

    const [result] = await pool.execute(
      "INSERT INTO ticket_types (category, price, totalCapacity, availableCapacity, eventId) VALUES (?, ?, ?, ?, ?)",
      [ticketType.Category, ticketType.Price, ticketType.TotalCapacity, ticketType.AvailableCapacity, ticketType.EventId],
    );

    const insertId = (result as any).insertId;
    return new TicketType(insertId, category, price, totalCapacity, totalCapacity, eventId);
  }

  static async findById(id: number): Promise<TicketType | null> {
    const [rows] = await pool.execute("SELECT * FROM ticket_types WHERE id = ?;", [id]);
    const row = (rows as any[])[0];
    return row ? TicketType.fromRow(row) : null;
  }

  /**
   * All ticket types for one event, ordered by price.
   */
  static async findByEvent(eventId: number): Promise<TicketType[]> {
    const [rows] = await pool.execute("SELECT * FROM ticket_types WHERE eventId = ? ORDER BY price ASC;", [eventId]);
    return (rows as any[]).map((row) => TicketType.fromRow(row));
  }
}
