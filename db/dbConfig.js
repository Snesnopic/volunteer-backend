import mysql from "mysql2/promise";

// Configurazione della connessione al database
export const pool = mysql.createPool({
  host: "localhost",
  user: "niva",
  password: "lupin",
  database: "volunteer_db",
  waitForConnections: true,
  connectionLimit: 10,
});
