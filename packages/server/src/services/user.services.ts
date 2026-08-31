import type { UserType } from "@eventhub/shared"
import User from "@core/entities/user"
import bcrypt from "bcryptjs"
import { pool } from "../db/database"

const BASE_SALT = 10

export default class UserService {
  static async create(name: string, email: string, password: string, userType: UserType): Promise<User> {

    const hasshedPassword = await bcrypt.hash(password, BASE_SALT);

    const user = new User(null, name, email, hasshedPassword, userType);

    const [result] = await pool.execute(
      `INSERT INTO users(name,email,password,userType) VALUES (?, ?, ?, ?);`,
      [
        user.Name,
        user.Email,
        user.Password,
        user.UserType
      ]
    )

    const insertId = (result as any).insertId;
    return new User(insertId, name, email, hasshedPassword, userType);
  }


  static async authenticate(email: string, password: string): Promise<User> {

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?;", [email]);
    const row = (rows as any[])[0];

    if (!row)
      throw new Error("Invalid Credentials");

    const user = User.fromRow(row);
    const passwordOk = bcrypt.compare(password, user.Password);

    if (!passwordOk)
      throw new Error("Invalid Credentials");

    return user;
  }
}