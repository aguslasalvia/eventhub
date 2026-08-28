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
    const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [id]);
    const row = (rows as any[])[0];
    return row ? Event.fromRow(row) : null;
  }

  /**
   * Search all the events published
   * @returns -> all the event available
   */
  static async findAll(): Promise<Event[]> {
    const [rows] = await pool.execute("SELECT * FROM events WHERE status <> ? ORDER BY id DESC;", [EventState.Draft]);
    return (rows as any[]).map(e => Event.fromRow(e));
  }

  /**
   * Returns only the events that haven't happend yet and are published.
   * @returns -> List of Event[] 
   */
  static async findPublished(): Promise<Event[]> {
    const [rows] = await pool.execute("SELECT * FROM events WHERE status = ? AND (date IS NULL OR date >= NOW()) ORDER BY date ASC;", [EventState.Published]);
    return (rows as any[]).map(e => Event.fromRow(e))
  }


  /**
   * Search the Event if exists and change the status from draft to published
   * @param id -> the id fo the event retrieved by the controller parsed to a number
   * @returns -> returns the event with the changed status
   */
  static async publish(id: number): Promise<Event> {
    const event = await this.findById(id);
    if (!event)
      throw new Error("Event not found");

    event.publish();

    await pool.execute("UPDATE events SET status = ? WHERE id = ?;", [event.Status, event.Id]);
    return event;
  }

  // cancel
  static async cancel(id: number): Promise<Event> {
    const event = await this.findById(id);
    if (!event)
      throw new Error("Event Not Found")

    event.unpublish();

    await pool.execute("UPDATE events SET status = ? WHERE id = ?", [event.Status, event.Id])
    return event;
  }


  static async delete(id: number) {
    const event = await this.findById(id);
    if (!event)
      throw new Error("Event Not Found")

    if (event.Status !== EventState.Cancelled && event.Status !== EventState.Draft)
      throw new Error("The Event needs to be canceled before ")

    await pool.execute("DELETE FROM events WHERE id = ?;", [id])

  }


}



