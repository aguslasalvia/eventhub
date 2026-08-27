const SETTING = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/eventhub",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
};


export default SETTING;