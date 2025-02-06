// routes/getNumberOfParticipants.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getNumberOfParticipants
 * Tipo: POST
 *
 * Input (body JSON):
 *   - idEvent: Intero contenente l'ID dell'evento
 *
 * Output:
 *   - state:
 *       0: Numero di partecipanti recuperato con successo
 *       1: ID dell'evento mancante
 *       2: ID dell'evento non valido
 *       3: Errore interno del server
 *   - message: Descrizione dell’esito della richiesta
 *   - numParticipants: Intero contenente il numero di partecipanti (solo se state = 0)
 */
export async function getNumberOfParticipants(request) {
  try {
    const body = await request.json();
    const { idEvent } = body;
    
    // Verifica che l'id dell'evento sia fornito
    if (idEvent === undefined || idEvent === null) {
      return new Response(
        JSON.stringify({ state: 1, message: "ID dell'evento mancante" }),
        { status: 400 }
      );
    }
    
    // Verifica che l'id dell'evento sia un numero valido
    if (isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 2, message: "ID dell'evento non valido" }),
        { status: 400 }
      );
    }
    
    // Esegui la query per contare il numero di partecipanti per l'evento
    // Si assume l'esistenza della tabella "VolunteerEvent" che tiene traccia delle partecipazioni
    const query = `SELECT COUNT(*) AS numParticipants FROM VolunteerEvent WHERE event_id = ?`;
    const [rows] = await pool.query(query, [idEvent]);
    
    // Estrae il conteggio dalla query
    const numParticipants = rows[0]?.numParticipants || 0;
    
    return new Response(
      JSON.stringify({
        state: 0,
        message: "Numero di partecipanti recuperato con successo",
        numParticipants: numParticipants,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        state: 3,
        message: "Errore interno del server",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
