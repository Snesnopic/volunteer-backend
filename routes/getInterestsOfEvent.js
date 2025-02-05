// routes/getInterestsOfEvent.js

// Import delle utilità per il database e per le sessioni
import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getInterestsOfEvent
 * Tipo: POST
 * 
 * Input (nel body JSON):
 *   - userEmail: stringa per identificare la sessione dell'utente
 *   - idEvent: intero contenente l'ID dell'evento
 * 
 * Output:
 *   - state: 
 *       0: Interests retrieved successfully
 *       1: Internal server error
 *       2: Not logged in
 *       3: Invalid event ID
 *       4: No interests found for this event
 *   - message: stringa descrittiva
 *   - interests: array di oggetti (solo se state = 0)
 * 
 * Scopo: Recuperare tutti gli interessi associati all'evento specificato.
 */
export async function getInterestsOfEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, idEvent } = body;

    // Verifica se l'utente è autenticato
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in" }),
        { status: 401 }
      );
    }

    // Verifica che l'ID dell'evento sia presente e valido
    if (!idEvent || isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 3, message: "Invalid event ID" }),
        { status: 400 }
      );
    }

    // Esegui la query per recuperare gli interessi associati all'evento
    const query = `
      SELECT i.*
      FROM Interest i
      JOIN EventInterest ei ON i.interest_id = ei.interest_id
      WHERE ei.event_id = ?
    `;
    const [rows] = await pool.query(query, [idEvent]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          state: 4,
          message: "No interests found for this event",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Interests retrieved successfully",
        interests: rows,
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
