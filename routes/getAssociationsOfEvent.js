// routes/getAssociationsOfEvent.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getAssociationsOfEvent
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa (per identificare la sessione dell'utente)
 *   - idEvent: intero (l'ID dell'evento per cui recuperare le associazioni partecipanti)
 *
 * Output:
 *   - state:
 *       0: Participating associations retrieved successfully
 *       1: Internal server error
 *       2: Not logged in
 *       3: Invalid event ID
 *       4: No participating associations found for this event
 *   - message: stringa descrittiva
 *   - associations: array di oggetti (solo se state = 0)
 */
export async function getAssociationsOfEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, idEvent } = body;

    // Verifica che l'utente sia autenticato
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in" }),
        { status: 401 }
      );
    }

    // Verifica che l'id dell'evento sia presente e valido
    if (!idEvent || isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 3, message: "Invalid event ID" }),
        { status: 400 }
      );
    }

    // Query: recupera le associazioni partecipanti all'evento
    const query = `
      SELECT a.*
      FROM Association a
      JOIN EventAssociation ea ON a.association_id = ea.association_id
      WHERE ea.event_id = ?
    `;
    const [rows] = await pool.query(query, [idEvent]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          state: 4,
          message: "No participating associations found for this event",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Participating associations retrieved successfully",
        associations: rows,
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
