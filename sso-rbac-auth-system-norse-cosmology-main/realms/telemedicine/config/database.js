import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); 

// Configuración de la conexión MySQL
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "telemedicine_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 
});

// Función para intentar conectar a MySQL con reintentos
async function checkMySQLConnectionWithRetries(pool, retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log("Conectado exitosamente a la base de datos MySQL!");
      connection.release(); 
      return; 
    } catch (error) {
      console.error(`Error al conectar a la base de datos MySQL (intento ${i + 1}/${retries}): ${error.message}`);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("No se pudo conectar a la base de datos MySQL después de varios intentos.");
        // process.exit(1); 
        throw error; 
      }
    }
  }
}


checkMySQLConnectionWithRetries(mysqlPool)
  .catch(error => {
    console.error("Fallo crítico al intentar establecer la conexión inicial con MySQL desde database.js.");
  });

export default mysqlPool;