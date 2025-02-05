// routes/getEventsOfAssociation.js

// Import delle utilità per il database e per le sessioni
import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getEventsOfAssociation
 * Tipo: POST
 * 
 * Input (attesi nel body JSON):
 *   - userEmail: stringa (per verificare la sessione dell'utente associativo)
 *   - idAssociation: intero (l'ID dell'associazione di cui recuperare gli eventi)
 * 
 * Output:
 *   - state: codifica numerica con:
 *       0: Eventi recuperati con successo
 *       1: Errore interno del server
 *       2: Non loggato
 *       3: Missing association ID
 *       4: Invalid association ID
 *       5: Nessun evento trovato per questa associazione
 *   - message: stringa descrittiva
 *   - events: array di oggetti (solo in caso di state = 0)
 */
export async function getEventsOfAssociation(request) {
  try {
    const body = await request.json();
    const { userEmail, idAssociation } = body;

    // Verifica che venga fornito l'ID dell'associazione
    if (!idAssociation) {
      return new Response(
        JSON.stringify({ state: 3, message: "Missing association ID" }),
        { status: 400 }
      );
    }
    if (isNaN(Number(idAssociation))) {
      return new Response(
        JSON.stringify({ state: 4, message: "Invalid association ID" }),
        { status: 400 }
      );
    }

    // Verifica che l'utente sia loggato (per questo endpoint si richiede che l'utente sia un'associazione)
    if (!userEmail) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in" }),
        { status: 401 }
      );
    }
    const session = getSession(userEmail);
    if (!session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as an association" }),
        { status: 401 }
      );
    }
    // Controlliamo che l'ID fornito corrisponda a quello presente nella sessione
    if (Number(idAssociation) !== session.associationId) {
      return new Response(
        JSON.stringify({ state: 4, message: "Invalid association ID" }),
        { status: 400 }
      );
    }

    // Eseguiamo la query per recuperare tutti gli eventi creati da questa associazione.
    // Si assume che nella tabella "Event" il campo "creator_id" indichi l'ID dell'associazione creatrice.
    const query = `SELECT * FROM Event WHERE creator_id = ?`;
    const [rows] = await pool.query(query, [idAssociation]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 5, message: "No events found for this association" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Events retrieved successfully",
        events: rows,
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
