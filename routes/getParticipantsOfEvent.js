// routes/getParticipantsOfEvent.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getParticipantsOfEvent
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa (per identificare la sessione dell'utente associativo)
 *   - idEvent: intero contenente l'ID dell'evento
 *
 * Output:
 *   - state:
 *       0: Partecipanti recuperati con successo
 *       1: Errore interno del server
 *       2: Non loggato come associazione
 *       3: ID dell'evento mancante o non valido
 *       4: L'associazione non è il creatore né un'associazione partecipante
 *       5: Nessun partecipante trovato per questo evento
 *   - message: stringa descrittiva
 *   - participants: array di oggetti contenenti i dettagli dei partecipanti (solo se state = 0)
 *
 * Scopo:
 *   Verifica che l'utente sia autenticato come associazione e che, per l'evento indicato,
 *   l'associazione sia il creatore oppure risulti registrata come partecipante. In caso affermativo,
 *   recupera e restituisce i partecipanti dell'evento.
 */
export async function getParticipantsOfEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, idEvent } = body;

    // Verifica che l'utente sia autenticato come associazione
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as an association" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;

    // Verifica che idEvent sia fornito e valido
    if (!idEvent || isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 3, message: "ID dell'evento mancante o non valido" }),
        { status: 400 }
      );
    }

    // Controllo preliminare: verificare se l'associazione è il creatore dell'evento
    // oppure se è già registrata come partecipante
    const creatorQuery = `SELECT creator_id FROM Event WHERE event_id = ?`;
    const [eventRows] = await pool.query(creatorQuery, [idEvent]);
    if (eventRows.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "ID dell'evento non valido" }),
        { status: 400 }
      );
    }
    const creatorId = eventRows[0].creator_id;

    // Se l'associazione non è il creatore, controlla la tabella EventAssociation
    if (Number(creatorId) !== associationId) {
      const associationQuery = `
        SELECT * FROM EventAssociation 
        WHERE event_id = ? AND association_id = ?
      `;
      const [assocRows] = await pool.query(associationQuery, [idEvent, associationId]);
      if (assocRows.length === 0) {
        return new Response(
          JSON.stringify({
            state: 4,
            message: "L'associazione non è il creatore né un'associazione partecipante",
          }),
          { status: 403 }
        );
      }
    }

    // Recupera i partecipanti dell'evento dalla tabella VolunteerEvent unita a Volunteer
    const participantsQuery = `
      SELECT v.*
      FROM Volunteer v
      JOIN VolunteerEvent ve ON v.volunteer_id = ve.volunteer_id
      WHERE ve.event_id = ?
    `;
    const [participantRows] = await pool.query(participantsQuery, [idEvent]);

    if (participantRows.length === 0) {
      return new Response(
        JSON.stringify({
          state: 5,
          message: "Nessun partecipante trovato per questo evento",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Partecipanti recuperati con successo",
        participants: participantRows,
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
