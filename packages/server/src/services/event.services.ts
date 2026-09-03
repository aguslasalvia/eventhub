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

    const event = new Event(null, title, description, location, date, capacity, category, organizerId, EventState.Draft);
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
        event.Category,
        event.Status,
        event.OrganizerId,
      ]
    )

    const insertId = (result as any).insertId;
    return new Event(insertId, title, description, location, date, capacity, category, organizerId, EventState.Draft);
  }

  /**
   * Updates an event's editable fields. Location and date are only changed
   * when both are provided together, since confirmDateAndLocation requires both.
   * @param id -> the event's id
   * @param fields -> the new field values
   * @returns -> the updated Event
   */
  static async update(id: number, fields: {
    title: string;
    description: string;
    maxCapacity: number | null;
    location: string | null;
    date: Date | string | null;
    category: EventCategory;
  }): Promise<Event> {
    const event = await this.findById(id);
    if (!event)
      throw new Error("Event Not Found");

    event.updateTitle(fields.title);
    event.updateDescription(fields.description);
    event.updateCapacity(fields.maxCapacity);
    event.updateCategory(fields.category);

    if (fields.location && fields.date) {
      event.confirmDateAndLocation(new Date(fields.date), fields.location);
    }

    await pool.execute(
      "UPDATE events SET title = ?, description = ?, maxCapacity = ?, location = ?, date = ?, category = ? WHERE id = ?;",
      [event.Title, event.Description, event.MaxCapacity, event.Location, event.Date, event.Category, event.Id],
    );

    return event;
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
   * All events (any status, including drafts) owned by one organizer.
   * @param organizerId -> the organizer's user id
   * @returns -> List of Event[]
   */
  static async findByOrganizer(organizerId: number): Promise<Event[]> {
    const [rows] = await pool.execute("SELECT * FROM events WHERE organizerId = ? ORDER BY id DESC;", [organizerId]);
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
      throw new Error("The Event needs to be canceled before it can be deleted")

    await pool.execute("DELETE FROM events WHERE id = ?;", [id])

  }


}



