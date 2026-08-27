import { UserType } from "@eventhub/shared"

export default class User {
  private _id: number | null;
  private _email: string;
  private _password: string;
  private _rol: UserType;

  public get Id(): number | null {
    return this._id;
  }

  public get Email(): string {
    return this._email;
  }

  public get Password(): string {
    return this._password;
  }
  public get Rol(): UserType {
    return this._rol;
  }

  constructor(id: number | null, email: string, password: string, rol: UserType) {
    this._id = id;
    this._email = email.toLocaleLowerCase();
    this._password = password;
    this._rol = rol;
  }
}