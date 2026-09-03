const SETTING = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/eventhub",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
  PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_SECRET: process.env.PAYPAL_SECRET,
};


export default SETTING;