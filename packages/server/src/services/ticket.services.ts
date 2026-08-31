import { TicketStatus } from "@eventhub/shared"
import Ticket from "@core/entities/ticket"
import { pool } from "../db/database"
import { randomUUID } from "crypto"

export default class TicketService {

  /**
 * Reserves a ticket for a user under the given ticket type, applying a
 * temporary 10-minute hold (RF-03.4) before it needs to be confirmed.
 *
 * Uses a transaction with an atomic UPDATE (`WHERE availableCapacity > 0`)
 * so that concurrent reservations for the last available ticket can't both
 * succeed (RF-03.5) — MySQL serializes the row update, no manual locking needed.
 *
 * @param ticketTypeId -> the TicketType being reserved from
 * @param userId -> the user making the reservation
 * @returns the newly created Ticket, in Reserved status
 * @throws {Error} if there's no available capacity for the given ticket type
 */
  static async reserve(ticketTypeId: number, userId: number): Promise<Ticket> {
    const conn = await pool.getConnection();

    try {


      const [result] = await conn.execute(
        "UPDATE ticket_types SET availableCapacity = availableCapacity - 1 WHERE id = ? AND availableCapacity > 0",
        [ticketTypeId]
      );

      if ((result as any).affectedRows === 0) {
        await conn.rollback();
        throw new Error("No tickets available for this type")
      }

      const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const [insert] = await conn.execute(
        `INSERT INTO tickets (ticketTypeId, userId, status, reservationExpiresAt)
        VALUES (?, ?, ?, ?)`,
        [ticketTypeId, userId, TicketStatus.Reserved, reservationExpiresAt],
      );

      await conn.commit();

      const insertId = (insert as any).insertId;
      return new Ticket(insertId, ticketTypeId, userId, null, TicketStatus.Reserved, null, reservationExpiresAt);
    }
    catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  /**
   * 
   * @param id 
   * @returns 
   */
  static async findById(id: number): Promise<Ticket | null> {
    const [rows] = await pool.execute("SELECT * FROM tickets WHERE id = ?;", [id]);
    const row = (rows as any[])[0];
    return row ? Ticket.fromRow(row) : null;

  }

  /**
   * 
   * @param userId 
   * @returns 
   */
  static async findByUser(userId: number): Promise<Ticket[]> {
    const [rows] = await pool.execute("SELECT * FROM tickets WHERE userId = ?;", [userId]);
    return (rows as any[]).map(t => Ticket.fromRow(t))
  }

  /**
   * Same as findByUser, but joined with the ticket's ticket type and event so
   * a "my tickets" view has something human-readable to show (a bare Ticket
   * only carries a ticketTypeId, no event title/price/etc).
   */
  static async findByUserDetailed(userId: number) {
    const [rows] = await pool.execute(
      `SELECT
        t.id AS id, t.status AS status, t.qrCode AS qrCode,
        t.purchaseDate AS purchaseDate, t.reservationExpiresAt AS reservationExpiresAt,
        tt.id AS ticketTypeId, tt.category AS ticketTypeCategory, tt.price AS ticketTypePrice,
        e.id AS eventId, e.title AS eventTitle, e.date AS eventDate, e.location AS eventLocation
      FROM tickets t
      JOIN ticket_types tt ON tt.id = t.ticketTypeId
      JOIN events e ON e.id = tt.eventId
      WHERE t.userId = ?
      ORDER BY t.id DESC;`,
      [userId],
    );

    return (rows as any[]).map((row) => ({
      id: row.id,
      status: row.status,
      qrCode: row.qrCode,
      purchaseDate: row.purchaseDate,
      reservationExpiresAt: row.reservationExpiresAt,
      ticketType: {
        id: row.ticketTypeId,
        category: row.ticketTypeCategory,
        price: Number(row.ticketTypePrice),
      },
      event: {
        id: row.eventId,
        title: row.eventTitle,
        date: row.eventDate,
        location: row.eventLocation,
      },
    }));
  }

  /**
   * 
   * @param ticketTypeId 
   * @returns 
   */
  static async findByTicketType(ticketTypeId: number): Promise<Ticket[]> {
    const [rows] = await pool.execute("SELECT * FROM tickets WHERE ticket_type = ?;", [ticketTypeId]);
    return (rows as any[]).map(t => Ticket.fromRow(t))
  }

  /**
   * Confirms a previously reserved ticket, generating its QR code.
   * Fails if the ticket isn't in Reserved status, or if its temporary
   * hold already expired (RF-03.4).
   *
   * @param id - the ticket's id
   * @returns the updated Ticket, in Confirmed status
   * @throws {Error} if the ticket doesn't exist, isn't Reserved, or has expired
   */
  static async confirm(id: number): Promise<Ticket> {
    const ticket = await this.findById(id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const qrCode = randomUUID();
    ticket.confirm(qrCode); // el método de la clase valida el estado y la expiración

    await pool.execute(
      "UPDATE tickets SET status = ?, qrCode = ?, purchaseDate = ?, reservationExpiresAt = ? WHERE id = ?",
      [ticket.Status, ticket.QrCode, ticket.PurchaseDate, ticket.ReservationExpiresAt, ticket.Id],
    );

    return ticket;
  }

  /**
   * Cancels a ticket (reserved or confirmed) and releases its slot back
   * to the corresponding TicketType's available capacity.
   *
   * @param id - the ticket's id
   * @returns the updated Ticket, in Cancelled status
   * @throws {Error} if the ticket doesn't exist or is already cancelled
   */
  static async cancel(id: number): Promise<Ticket> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const ticket = await this.findById(id);
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      ticket.cancel(); // valida que no esté ya cancelado

      await conn.execute("UPDATE tickets SET status = ? WHERE id = ?", [ticket.Status, ticket.Id]);

      await conn.execute(
        "UPDATE ticket_types SET availableCapacity = availableCapacity + 1 WHERE id = ?",
        [ticket.TicketTypeId],
      );

      await conn.commit();
      return ticket;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }


  /** *
   * @returns the number of reservations that were released
   */
  static async releaseExpiredReservations(): Promise<number> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        "SELECT * FROM tickets WHERE status = ? AND reservationExpiresAt < NOW()",
        [TicketStatus.Reserved],
      );
      const expiredTickets = (rows as any[]).map((row) => Ticket.fromRow(row));

      if (expiredTickets.length === 0) {
        await conn.commit();
        return 0;
      }

      const expiredIds = expiredTickets.map((t) => t.Id);

      await conn.query(
        `UPDATE tickets SET status = ? WHERE id IN (?)`,
        [TicketStatus.Cancelled, expiredIds],
      );

      const countByTicketType = new Map<number, number>();
      for (const ticket of expiredTickets) {
        const current = countByTicketType.get(ticket.TicketTypeId) ?? 0;
        countByTicketType.set(ticket.TicketTypeId, current + 1);
      }

      for (const [ticketTypeId, count] of countByTicketType) {
        await conn.execute(
          "UPDATE ticket_types SET availableCapacity = availableCapacity + ? WHERE id = ?",
          [count, ticketTypeId],
        );
      }

      await conn.commit();
      return expiredTickets.length;

    } catch (err) {
      await conn.rollback();
      throw err;

    } finally {
      conn.release();
    }
  }
}