// routes/getEventsNotParticipating.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getEventsNotParticipating
 * Tipo: GET
 * 
 * Input:
 *   - Utilizza la sessione per identificare l'associazione, ad es. tramite il parametro "userEmail" nella query string.
 * 
 * Output:
 *   - state:
 *       0: Events retrieved successfully
 *       1: Internal server error
 *       2: Not logged in as an association
 *       3: No events found
 *   - message: stringa descrittiva
 *   - data: array di oggetti contenenti i dettagli degli eventi disponibili (solo se state = 0)
 * 
 * Scopo:
 *   Recuperare gli eventi futuri ai quali l’associazione non partecipa e che non sono stati creati dall’associazione stessa.
 */
export async function getEventsNotParticipating(request) {
  try {
    // Otteniamo il parametro "userEmail" dalla query string
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    // Verifica che l'utente sia autenticato come associazione
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as an association" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;

    /*  
      Query:
      - Seleziona gli eventi futuri (event_date > NOW())
      - Esclude gli eventi creati dall’associazione stessa (creator_id <> associationId)
      - Esclude gli eventi a cui l’associazione ha già partecipato (tramite tabella EventAssociation)
    */
    const query = `
      SELECT e.*
      FROM Event e
      WHERE e.event_date > NOW()
        AND e.creator_id <> ?
        AND e.event_id NOT IN (
          SELECT event_id FROM EventAssociation WHERE association_id = ?
        )
    `;
    const [rows] = await pool.query(query, [associationId, associationId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "No events found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Events retrieved successfully",
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
