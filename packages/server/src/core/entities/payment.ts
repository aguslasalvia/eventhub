export default class Payment {
  private _id: number | null;
  private _userId: number;
  private _provider: string;
  private _orderId: string;
  private _captureId: string;
  private _amount: number;
  private _currency: string;
  private _createdAt: Date | null;

  constructor(
    id: number | null,
    userId: number,
    provider: string,
    orderId: string,
    captureId: string,
    amount: number,
    currency: string,
    createdAt: Date | null,
  ) {
    this._id = id;
    this._userId = userId;
    this._provider = provider;
    this._orderId = orderId;
    this._captureId = captureId;
    this._amount = amount;
    this._currency = currency;
    this._createdAt = createdAt;
  }

  public get Id(): number | null {
    return this._id;
  }
  public get UserId(): number {
    return this._userId;
  }
  public get Provider(): string {
    return this._provider;
  }
  public get OrderId(): string {
    return this._orderId;
  }
  public get CaptureId(): string {
    return this._captureId;
  }
  public get Amount(): number {
    return this._amount;
  }
  public get Currency(): string {
    return this._currency;
  }
  public get CreatedAt(): Date | null {
    return this._createdAt;
  }

  static fromRow(row: any): Payment {
    return new Payment(
      row.id,
      row.userId,
      row.provider,
      row.orderId,
      row.captureId,
      Number(row.amount),
      row.currency,
      row.createdAt ? new Date(row.createdAt) : null,
    );
  }

  public toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      provider: this._provider,
      orderId: this._orderId,
      captureId: this._captureId,
      amount: this._amount,
      currency: this._currency,
      createdAt: this._createdAt,
    };
  }
}
