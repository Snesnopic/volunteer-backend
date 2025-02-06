// routes/publishEvent.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession } from "../db/session.js";

/**
 * Endpoint: publishEvent
 * Tipo: POST
 * 
 * Input (body JSON):
 *   - eventName (string, obbligatorio)
 *   - eventDescription (string, obbligatorio)
 *   - eventLocation (string, obbligatorio)
 *   - eventDate (string in formato ISO o simile, obbligatorio)
 *   - eventMaxCapacity (integer, opzionale)
 *   - eventApproxLocation (string, opzionale)
 *   - eventIsPrivate (boolean, obbligatorio)
 *   - eventPosterImage (string o base64, opzionale)
 *   - userEmail (string, per identificare la sessione dell’associazione)
 * 
 * Output:
 *   - state:
 *       0: Evento creato con successo
 *       1: Errore interno del server
 *       2: Utente non loggato
 *       3: Permessi non sufficienti
 *       4: Campi obbligatori mancanti
 *   - message: descrizione dell’esito
 *   - details: (solo in caso di errore interno)
 */
export async function publishEvent(request) {
  try {
    const body = await request.json();
    const {
      userEmail,
      eventName,
      eventDescription,
      eventLocation,
      eventDate,
      eventMaxCapacity,
      eventApproxLocation,
      eventIsPrivate,
      eventPosterImage,
    } = body;

    // Controllo che i campi obbligatori siano presenti
    if (
      !userEmail ||
      !eventName ||
      !eventDescription ||
      !eventLocation ||
      !eventDate ||
      eventIsPrivate === undefined
    ) {
      return new Response(
        JSON.stringify({ state: 4, message: "Campi obbligatori mancanti" }),
        { status: 400 }
      );
    }

    // Verifica che l'utente sia autenticato come associazione
    const session = getSession(userEmail);
    if (!session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Utente non loggato come associazione" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;

    // Costruzione della query di inserimento.
    // Si assume che la tabella "Event" abbia i seguenti campi:
    // event_id (auto-increment), event_name, event_description, event_location,
    // event_approx_location, event_date, event_max_capacity, event_poster_image,
    // event_is_private, creator_id
    const insertQuery = `
      INSERT INTO Event 
      (event_name, event_description, event_location, event_approx_location, event_date, event_max_capacity, event_poster_image, event_is_private, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    // Per i campi opzionali, se non forniti, si passa NULL.
    const values = [
      eventName,
      eventDescription,
      eventLocation,
      eventApproxLocation || null,
      eventDate,
      eventMaxCapacity || null,
      eventPosterImage || null,
      eventIsPrivate,
      associationId,
    ];

    await pool.query(insertQuery, values);

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Evento creato con successo",
      }),
      { status: 201 }
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
