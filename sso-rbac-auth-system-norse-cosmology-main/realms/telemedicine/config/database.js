import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  HOST: process.env.DB_HOST || "127.0.0.1",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DATABASE: process.env.DB_NAME || "centro_salud_db_final",
  DIALECT: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

export default dbConfig;
