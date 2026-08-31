import { TicketCategories } from "@eventhub/shared";

export default class TicketType {
  private _id: number | null;
  private _category: TicketCategories;
  private _price: number;
  private _totalCapacity: number;
  private _availableCapacity: number;
  private _eventId: number;

  constructor(
    id: number | null,
    category: TicketCategories,
    price: number,
    totalCapacity: number,
    availableCapacity: number,
    eventId: number,
  ) {
    if (totalCapacity <= 0)
      throw new Error("Total capacity must be greater than zero");
    if (price < 0)
      throw new Error("Price cannot be negative");

    this._id = id;
    this._category = category;
    this._price = price;
    this._totalCapacity = totalCapacity;
    this._availableCapacity = availableCapacity;
    this._eventId = eventId;
  }

  public get Id(): number | null {
    return this._id;
  }
  public get Category(): TicketCategories {
    return this._category;
  }
  public get Price(): number {
    return this._price;
  }
  public get TotalCapacity(): number {
    return this._totalCapacity;
  }
  public get AvailableCapacity(): number {
    return this._availableCapacity;
  }
  public get EventId(): number {
    return this._eventId;
  }

  static fromRow(row: any): TicketType {
    return new TicketType(
      row.id,
      row.category as TicketCategories,
      Number(row.price),
      row.totalCapacity,
      row.availableCapacity,
      row.eventId,
    );
  }

  public toJSON() {
    return {
      id: this._id,
      category: this._category,
      price: this._price,
      totalCapacity: this._totalCapacity,
      availableCapacity: this._availableCapacity,
      eventId: this._eventId,
    };
  }
}
