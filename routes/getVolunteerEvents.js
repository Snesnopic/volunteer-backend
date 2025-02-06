// routes/getVolunteerEvents.js

import { pool } from "../db/dbConfig.js";
import { getSession } from "../db/session.js";

/**
 * Endpoint: getVolunteerEvents
 * Tipo: GET
 *
 * Input:
 *   - Utilizza la query string per identificare il volontario tramite "userEmail"
 *
 * Output:
 *   - state:
 *       0: Eventi recuperati con successo
 *       1: Errore interno del server
 *       2: Non loggato
 *       3: Non autorizzato come volontario
 *       4: Nessun evento trovato per questo volontario
 *   - message: descrizione dell’esito della richiesta
 *   - events: array di oggetti contenenti i dettagli degli eventi (solo se state = 0)
 *
 * Scopo:
 *   Recupera tutti gli eventi ai quali il volontario autenticato (identificato dalla sessione)
 *   ha partecipato. Se il volontario non è autenticato o non è un volontario, restituisce un errore.
 */
export async function getVolunteerEvents(request) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    // Verifica che l'utente sia autenticato e sia un volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as a volunteer" }),
        { status: 401 }
      );
    }
    const volunteerId = session.volunteerId;

    // Query per recuperare gli eventi a cui il volontario ha partecipato
    // Si assume l'esistenza della tabella di join "VolunteerEvent" che collega Volunteer e Event
    // ed il fatto che la tabella "Event" contenga i dettagli degli eventi.
    const query = `
      SELECT e.*
      FROM Event e
      JOIN VolunteerEvent ve ON e.event_id = ve.event_id
      WHERE ve.volunteer_id = ?
    `;
    const [rows] = await pool.query(query, [volunteerId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 4, message: "Nessun evento trovato per questo volontario" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Eventi recuperati con successo",
        events: rows,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        state: 1,
        message: "Errore interno del server",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
