import Payment from "@core/entities/payment";
import { pool } from "../db/database";

export default class PaymentService {
  /**
   * Records a completed PayPal capture and links it to the tickets it paid
   * for. This is the minimum needed to ever issue a refund later: PayPal's
   * refund API is called with a capture id, which only exists here — once
   * the HTTP response to the client is sent, it's gone if it isn't persisted.
   *
   * @param userId -> the buyer
   * @param orderId -> the PayPal order id
   * @param captureId -> the PayPal capture id (what a future refund call needs)
   * @param amount -> the captured amount, as reported by PayPal (not recomputed locally)
   * @param currency -> the captured currency, as reported by PayPal
   * @param ticketIds -> the tickets this single payment covers
   */
  static async record(
    userId: number,
    orderId: string,
    captureId: string,
    amount: number,
    currency: string,
    ticketIds: number[],
  ): Promise<Payment> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [insert] = await conn.execute(
        "INSERT INTO payments (userId, provider, orderId, captureId, amount, currency) VALUES (?, 'paypal', ?, ?, ?, ?)",
        [userId, orderId, captureId, amount, currency],
      );
      const paymentId = (insert as any).insertId;

      await conn.query("UPDATE tickets SET paymentId = ? WHERE id IN (?)", [paymentId, ticketIds]);

      await conn.commit();
      return new Payment(paymentId, userId, "paypal", orderId, captureId, amount, currency, new Date());
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async findByCaptureId(captureId: string): Promise<Payment | null> {
    const [rows] = await pool.execute("SELECT * FROM payments WHERE captureId = ?;", [captureId]);
    const row = (rows as any[])[0];
    return row ? Payment.fromRow(row) : null;
  }
}
