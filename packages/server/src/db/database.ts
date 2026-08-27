import mysql from "mysql2/promise"

export const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "eventhub_user",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "eventhub",
  waitForConnections: true,
  connectionLimit: 10,
})