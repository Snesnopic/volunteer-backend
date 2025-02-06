// routes/joinEvent.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: joinEvent
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa per identificare il volontario (nella sessione)
 *   - idEvent: intero contenente l'ID dell'evento al quale il volontario vuole unirsi
 *
 * Output:
 *   - state:
 *       0: Il volontario è stato aggiunto con successo all'evento
 *       1: Errore interno del server
 *       2: Non loggato
 *       3: Permessi non sufficienti
 *       4: ID evento mancante
 *       5: ID evento non valido
 *       6: Il volontario è già registrato per questo evento
 *       7: L'evento non esiste
 *   - message: stringa descrittiva
 *
 * Scopo:
 *   Gestisce la richiesta del volontario di unirsi ad un evento.
 */
export async function joinEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, idEvent } = body;

    // Controllo sulla sessione: l'utente deve essere autenticato come volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as a volunteer" }),
        { status: 401 }
      );
    }
    const volunteerId = session.volunteerId;

    // Controllo che idEvent sia fornito
    if (idEvent === undefined || idEvent === null) {
      return new Response(
        JSON.stringify({ state: 4, message: "ID evento mancante" }),
        { status: 400 }
      );
    }
    // Controllo che idEvent sia un numero valido
    if (isNaN(Number(idEvent))) {
      return new Response(
        JSON.stringify({ state: 5, message: "ID evento non valido" }),
        { status: 400 }
      );
    }

    // Verifica l'esistenza dell'evento
    const eventQuery = `SELECT * FROM Event WHERE event_id = ?`;
    const [eventRows] = await pool.query(eventQuery, [idEvent]);
    if (eventRows.length === 0) {
      return new Response(
        JSON.stringify({ state: 7, message: "L'evento non esiste" }),
        { status: 404 }
      );
    }

    // Controlla se il volontario è già registrato per l'evento nella tabella VolunteerEvent
    const checkQuery = `SELECT * FROM VolunteerEvent WHERE event_id = ? AND volunteer_id = ?`;
    const [checkRows] = await pool.query(checkQuery, [idEvent, volunteerId]);
    if (checkRows.length > 0) {
      return new Response(
        JSON.stringify({ state: 6, message: "Il volontario è già registrato per questo evento" }),
        { status: 400 }
      );
    }

    // Inserisci il volontario nell'evento
    const insertQuery = `INSERT INTO VolunteerEvent (volunteer_id, event_id) VALUES (?, ?)`;
    await pool.query(insertQuery, [volunteerId, idEvent]);

    return new Response(
      JSON.stringify({ state: 0, message: "Il volontario è stato aggiunto con successo all'evento" }),
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
