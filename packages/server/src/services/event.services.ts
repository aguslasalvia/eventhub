import Event from "src/core/entities/events"
import { pool } from "../db/database"

export default class EventService {
  static async findById(id: number): Promise<Event | null> {
    const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [id])
    const row = (rows as any[])[0]
    return row ? Event.fromRow(row) : null;
  }
}



