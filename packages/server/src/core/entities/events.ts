import { EventState } from "@eventhub/shared";

export default class Event {
  /* 
   note:
   location can be null, because an event may be announced but it can not have a place/location determinated
   date: same as location, can be announce but don't have a date for now
  */
  private _id: number | null;
  private _title: string;
  private _description: string;
  private _location: string | null;
  private _date: Date | null;
  private _maxCapacity: number | null;
  private _organizerId: number;
  private _status: EventState;

  constructor(
    id: number | null = null,
    title: string,
    description: string,
    location: string | null = null,
    date: Date | null = null,
    capacity: number,
    organizerId: number,
    state: EventState = EventState.Draft) {
    if (capacity !== null && capacity <= 0) {
      throw new Error("Capacity must be greater than zero");
    }
    this._id = id;
    this._title = title;
    this._description = description;
    this._location = location;
    this._date = date;
    this._maxCapacity = capacity;
    this._organizerId = organizerId;
    this._status = state
  }


  //#region getters
  public get Id(): number | null {
    return this._id
  }

  public get Title(): string {
    return this._title
  }

  public get Description(): string {
    return this._description
  }

  public get Location(): string | null {
    return this._location
  }

  public get Date(): Date | null {
    return this._date
  }

  public get MaxCapacity(): number | null {
    return this._maxCapacity;
  }


  public get OrganizerId(): number {
    return this._organizerId;
  }


  public get Status(): EventState {
    return this._status;
  }
  //#endregion

  //#region class-functions

  /* note: this method it's for retrieving the row data from the database */
  static fromRow(row: any): Event {
    return new Event(
      row.id,
      row.title,
      row.description,
      row.location,
      row.date ? new Date(row.date) : null,
      row.maxCapacity,
      row.organizerId,
      row.status as EventState,
    );
  }


  public confirmDateAndLocation(date: Date, location: string): void {
    if (date < new Date())
      throw new Error("The date cannot be in the past");

    this._date = date;
    this._location = location;
  }

  public updateDescription(description: string) {
    if (description.trim().length === 0)
      throw new Error("The description cannot be empty");

    this._description = description;
  }

  public publish(): void {
    if (this._status === EventState.Published) {
      throw new Error("The event is already published");
    }
    if (!this._date || !this._location) {
      throw new Error("Cannot publish an event without a confirmed date and location");
    }
    this._status = EventState.Published;
  }

  public unpublish(): void {
    if (this._status === EventState.Draft) {
      throw new Error("The event is already a draft");
    }
    this._status = EventState.Draft;
  }




  //#endregion

}