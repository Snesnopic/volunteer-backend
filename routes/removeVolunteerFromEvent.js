// routes/removeVolunteerFromEvent.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, deleteSession, updateSession, setSession } from "../db/session.js";

/**
 * Endpoint: removeVolunteerFromEvent
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione dell'utente
 *   - idEvent: intero contenente l'ID dell'evento
 *   - idVolunteer (opzionale): intero, richiesto solo se l'utente è un’associazione
 *
 * Output:
 *   - state:
 *       0: Volontario rimosso con successo dall’evento
 *       1: Errore interno del server
 *       2: Non loggato
 *       3: Input non valido
 *       4: L’evento non appartiene all’associazione
 *       5: Ruolo utente non valido
 *   - message: descrizione dell’esito della richiesta
 *
 * Scopo:
 *   - Se l'utente è un volontario (sessione con volunteerId), rimuove lui stesso dall’evento.
 *   - Se l'utente è un’associazione (sessione con associationId), deve fornire idVolunteer e l’evento
 *     deve appartenere all’associazione (es. essere creato da essa). In caso contrario, restituisce l’errore.
 */
export async function removeVolunteerFromEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, idEvent, idVolunteer } = body;

    // Verifica che userEmail e idEvent siano forniti e validi
    if (!userEmail || idEvent === undefined || idEvent === null || isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 3, message: "Input non valido" }),
        { status: 400 }
      );
    }
    const eventId = Number(idEvent);

    // Recupera la sessione
    const session = getSession(userEmail);
    if (!session || !session.loggedIn) {
      return new Response(
        JSON.stringify({ state: 2, message: "Non loggato" }),
        { status: 401 }
      );
    }

    // Se la sessione appartiene a un volontario, rimuove lui stesso
    if (session.volunteerId) {
      const volunteerId = session.volunteerId;

      // Verifica se il volontario è iscritto all'evento
      const checkQuery = `SELECT * FROM VolunteerEvent WHERE event_id = ? AND volunteer_id = ?`;
      const [checkRows] = await pool.query(checkQuery, [eventId, volunteerId]);
      if (checkRows.length === 0) {
        return new Response(
          JSON.stringify({ state: 3, message: "Input non valido: il volontario non è iscritto a questo evento" }),
          { status: 400 }
        );
      }

      // Esegui la rimozione
      const deleteQuery = `DELETE FROM VolunteerEvent WHERE event_id = ? AND volunteer_id = ?`;
      await pool.query(deleteQuery, [eventId, volunteerId]);

      return new Response(
        JSON.stringify({ state: 0, message: "Volontario rimosso con successo dall’evento" }),
        { status: 200 }
      );
    }
    // Se la sessione appartiene a un’associazione
    else if (session.associationId) {
      // Per le associazioni, è richiesto idVolunteer
      if (!idVolunteer || isNaN(Number(idVolunteer))) {
        return new Response(
          JSON.stringify({ state: 3, message: "Input non valido: idVolunteer mancante o non valido" }),
          { status: 400 }
        );
      }
      const volunteerId = Number(idVolunteer);
      const associationId = session.associationId;

      // Verifica che l’evento appartenga all’associazione (il creatore deve essere l’associazione)
      const eventQuery = `SELECT creator_id FROM Event WHERE event_id = ?`;
      const [eventRows] = await pool.query(eventQuery, [eventId]);
      if (eventRows.length === 0) {
        return new Response(
          JSON.stringify({ state: 3, message: "Input non valido: l’evento non esiste" }),
          { status: 400 }
        );
      }
      const creatorId = eventRows[0].creator_id;
      if (Number(creatorId) !== associationId) {
        return new Response(
          JSON.stringify({ state: 4, message: "L’evento non appartiene all’associazione" }),
          { status: 403 }
        );
      }

      // Esegui la rimozione del volontario dall'evento
      const deleteQuery = `DELETE FROM VolunteerEvent WHERE event_id = ? AND volunteer_id = ?`;
      const [result] = await pool.query(deleteQuery, [eventId, volunteerId]);

      // Se nessuna riga è stata cancellata, significa che il volontario non era iscritto
      if (result.affectedRows === 0) {
        return new Response(
          JSON.stringify({ state: 3, message: "Input non valido: il volontario non era iscritto all’evento" }),
          { status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ state: 0, message: "Volontario rimosso con successo dall’evento" }),
        { status: 200 }
      );
    } else {
      // Se la sessione non identifica né un volontario né un’associazione, ruolo non valido
      return new Response(
        JSON.stringify({ state: 5, message: "Ruolo utente non valido" }),
        { status: 403 }
      );
    }
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
