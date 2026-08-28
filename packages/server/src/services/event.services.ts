import Event from "src/core/entities/events"
import { EventCategory, EventState } from "@eventhub/shared"
import { pool } from "../db/database"

export default class EventService {

  static async create(title: string,
    description: string,
    capacity: number | null,
    organizerId: number,
    location: string | null,
    date: Date | null,
    category: EventCategory,
  ): Promise<Event> {

    const event = new Event(null, title, description, location, date, capacity, organizerId, EventState.Draft);
    const [result] = await pool.execute(
      `
      INSERT INTO events (title,description,location,date,maxCapacity,category,status,organizerId)
      Values (? ,? ,? ,? ,? ,? ,? ,?);`,
      [
        event.Title,
        event.Description,
        event.Location,
        event.Date,
        event.MaxCapacity,
        category,
        event.Status,
        event.OrganizerId,
      ]
    )

    const insertId = (result as any).insertId;
    return new Event(insertId, title, description, location, date, capacity, organizerId, EventState.Draft);
  }

  static async findById(id: number): Promise<Event | null> {
    const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [id])
    const row = (rows as any[])[0]
    return row ? Event.fromRow(row) : null;
  }

  // TODO: 
  // findAll
  // findPublished
  // publish
  // cancel
  // delete


}



