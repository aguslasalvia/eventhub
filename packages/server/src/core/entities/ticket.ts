import { TicketStatus } from "@eventhub/shared/enums/tickets"

export default class Ticket {
  private _id: number | null;
  private _ticketTypeId: number;
  private _userId: number;
  private _qrCode: string | null;
  private _status: TicketStatus;
  private _purchaseDate: Date | null;
  private _reservationExpiresAt: Date | null;

  constructor(
    id: number | null,
    ticketTypeId: number,
    userId: number,
    qrCode: string | null,
    status: TicketStatus,
    purchaseDate: Date | null,
    reservationExpiresAt: Date | null,
  ) {
    this._id = id;
    this._ticketTypeId = ticketTypeId;
    this._userId = userId;
    this._qrCode = qrCode;
    this._status = status;
    this._purchaseDate = purchaseDate;
    this._reservationExpiresAt = reservationExpiresAt;
  }

  public get Id(): number | null {
    return this._id;
  }
  public get TicketTypeId(): number {
    return this._ticketTypeId;
  }
  public get UserId(): number {
    return this._userId;
  }
  public get QrCode(): string | null {
    return this._qrCode;
  }
  public get Status(): TicketStatus {
    return this._status;
  }
  public get PurchaseDate(): Date | null {
    return this._purchaseDate;
  }
  public get ReservationExpiresAt(): Date | null {
    return this._reservationExpiresAt;
  }


  /** 
  * note: this method it's for retrieving the row data from the database 
  * simple: database obj -> Ticket object
  * @param row -> database row
  * @returns -> Ticket obj based on the database result
  */
  static fromRow(row: any): Ticket {
    return new Ticket(
      row.id,
      row.ticketTypeId,
      row.userId,
      row.qrCode,
      row.status as TicketStatus,
      row.purchaseDate ? new Date(row.purchaseDate) : null,
      row.reservationExpiresAt ? new Date(row.reservationExpiresAt) : null,
    );
  }

  /**
   * 
   * @returns boolean -> check if a ticket is reserved or not
   */
  public isExpired(): boolean {
    if (this._status !== TicketStatus.Reserved) return false;
    if (!this._reservationExpiresAt) return false;
    return new Date() > this._reservationExpiresAt
  }

  /**
 * Simply updates the status of the event
 * @param qr -> saves the qr unique UUID string
 * @throws  Error if the ticket is already reserved
 * @throws Error if the ticket's reservation already expired
 */
  public confirm(qr: string): void {
    if (this._status !== TicketStatus.Reserved)
      throw new Error("Only a reserved ticket can be confirmed");

    if (this.isExpired())
      throw new Error("The reservation has expired, cannot confirm");

    this._status = TicketStatus.Confirmed;
    this._qrCode = qr;
    this._purchaseDate = new Date();
    this._reservationExpiresAt = null;
  }


  /**
   * Simply updates the status of the event
   * @throws Error if the ticket is already canceled
   */
  public cancel(): void {
    if (this._status === TicketStatus.Cancelled)
      throw new Error("The Ticket is already canceled");
    this._status = TicketStatus.Cancelled;
  }

}