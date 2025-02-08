// routes/fetchVolunteerDetails.js

import { pool } from "../db/dbConfig.js";
import { getSession } from "../db/session.js";

/**
 * Endpoint: fetchVolunteerDetails
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione dell’utente
 *   - volunteerId: intero contenente l’ID del volontario di cui recuperare i dettagli
 *
 * Output:
 *   - state:
 *       0: Dettagli del volontario recuperati con successo
 *       1: Errore interno del server
 *       2: Non loggato
 *       3: Volontario non trovato
 *   - message: stringa descrittiva (utilizzata in caso di errori)
 *   - data: oggetto contenente i dettagli del volontario (solo se state = 0)
 *
 * Scopo:
 *   Verifica se l’utente è autenticato (controllando la sessione basata su userEmail).
 *   Se autenticato, recupera i dettagli del volontario per l’ID fornito; altrimenti,
 *   restituisce lo stato 2. Se il volontario non viene trovato, restituisce lo stato 3.
 */
export async function fetchVolunteerDetails(request) {
  try {
    const body = await request.json();
    const { userEmail, volunteerId } = body;

    // Verifica che l'utente sia autenticato come volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Non loggato" }),
        { status: 401 }
      );
    }

    // Verifica che volunteerId sia fornito e valido
    if (!volunteerId || isNaN(Number(volunteerId))) {
      return new Response(
        JSON.stringify({ state: 3, message: "Volontario non trovato" }),
        { status: 400 }
      );
    }

    // Recupera i dettagli del volontario dal database
    const query = `SELECT * FROM Volunteer WHERE volunteer_id = ?`;
    const [rows] = await pool.query(query, [volunteerId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "Volontario non trovato" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Dettagli del volontario recuperati con successo",
        data: rows[0],
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
