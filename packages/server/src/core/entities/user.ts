import { UserType } from "@eventhub/shared";

export default class User {
  private _id: number | null;
  private _name: string;
  private _email: string;
  private _password: string;
  private _userType: UserType;

  constructor(
    id: number | null,
    name: string,
    email: string,
    password: string,
    userType: UserType,
  ) {
    this._id = id;
    this._name = name;
    this._email = email.toLowerCase();
    this._password = password;
    this._userType = userType;
  }

  static fromRow(row: any): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.password,
      row.userType as UserType,
    );
  }

  public get Id(): number | null {
    return this._id;
  }
  public get Name(): string {
    return this._name;
  }
  public get Email(): string {
    return this._email;
  }
  public get Password(): string {
    return this._password;
  }
  public get UserType(): UserType {
    return this._userType;
  }

  public isOrganizer(): boolean {
    return this._userType === UserType.Planner || this._userType === UserType.Administrator;
  }

  public isAdmin(): boolean {
    return this._userType === UserType.Administrator;
  }
}