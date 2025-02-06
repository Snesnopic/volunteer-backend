// routes/getInterestList.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getInterestList
 * Tipo: GET
 * 
 * Input: Nessuna variabile di input specifica.
 * 
 * Output:
 *   - state:
 *       0: Risultati ottenuti con successo
 *       1: Nessun risultato trovato per la query
 *   - message: Stringa descrittiva
 *   - data: Array di oggetti contenenti i dettagli degli interessi (solo se state = 0)
 * 
 * Scopo:
 *   Recuperare tutti i record dalla tabella Interest.
 */
export async function getInterestList(request) {
  try {
    const query = `SELECT * FROM Interest`;
    const [rows] = await pool.query(query);
    
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 1, message: "Nessun risultato trovato per la query" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({
        state: 0,
        message: "Risultati ottenuti con successo",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        state: 1,
        message: "Internal server error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
