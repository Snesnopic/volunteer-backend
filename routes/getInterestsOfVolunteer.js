// routes/getInterestsOfVolunteer.js

// Import delle utilità per il database e per le sessioni
import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getInterestsOfVolunteer
 * Tipo: GET
 *
 * Input:
 *   - Utilizza la sessione per identificare il volontario (si aspetta un parametro "userEmail" nella query string)
 *
 * Output:
 *   - state:
 *       0: Interests retrieved successfully
 *       1: Internal server error
 *       2: Not logged in as a volunteer
 *       3: No interests found for this volunteer
 *   - message: descrizione dell’esito della richiesta
 *   - interests: array di oggetti contenenti i dettagli degli interessi (solo in caso di state = 0)
 */
export async function getInterestsOfVolunteer(request) {
  try {
    // Recupera il parametro "userEmail" dalla query string
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    // Verifica che l'utente sia autenticato come volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as a volunteer" }),
        { status: 401 }
      );
    }
    const volunteerId = session.volunteerId;

    // Query per recuperare gli interessi associati al volontario
    // Si assume l'esistenza di una tabella di join "VolunteerInterest" che collega Volunteer e Interest
    const query = `
      SELECT i.*
      FROM Interest i
      JOIN VolunteerInterest vi ON i.interest_id = vi.interest_id
      WHERE vi.volunteer_id = ?
    `;
    const [rows] = await pool.query(query, [volunteerId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          state: 3,
          message: "No interests found for this volunteer",
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
