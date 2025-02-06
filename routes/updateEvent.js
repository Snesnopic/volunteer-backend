// routes/updateEvent.js

import { pool } from "../db/dbConfig.js";
import { getSession } from "../db/session.js";

/**
 * Endpoint: updateEvent
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione dell’associazione
 *   - eventId: intero contenente l’ID dell’evento da aggiornare
 *   - fieldsToUpdate: oggetto contenente i campi e i relativi valori da aggiornare
 *
 * Output:
 *   - state:
 *       0: Event details updated successfully
 *       1: Internal server error
 *       2: Not logged in as an association
 *       3: Invalid event ID
 *       4: Association does not own this event
 *       5: No event found or no changes made
 *   - message: stringa descrittiva dell’esito
 */
export async function updateEvent(request) {
  try {
    const body = await request.json();
    const { userEmail, eventId, fieldsToUpdate } = body;
    
    // Controllo presenza e validità di userEmail e eventId
    if (!userEmail || !eventId || isNaN(Number(eventId))) {
      return new Response(
        JSON.stringify({ state: 3, message: "Invalid event ID" }),
        { status: 400 }
      );
    }
    
    // Verifica che l'utente sia autenticato come associazione
    const session = getSession(userEmail);
    if (!session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as an association" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;
    
    // Verifica che fieldsToUpdate sia un oggetto non vuoto
    if (!fieldsToUpdate || typeof fieldsToUpdate !== "object" || Object.keys(fieldsToUpdate).length === 0) {
      return new Response(
        JSON.stringify({ state: 5, message: "No event found or no changes made" }),
        { status: 400 }
      );
    }
    
    // Controlla che l'evento esista e che l'associazione sia il creatore
    const eventQuery = `SELECT creator_id FROM Event WHERE event_id = ?`;
    const [eventRows] = await pool.query(eventQuery, [eventId]);
    if (eventRows.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "Invalid event ID" }),
        { status: 400 }
      );
    }
    const creatorId = eventRows[0].creator_id;
    if (Number(creatorId) !== associationId) {
      return new Response(
        JSON.stringify({ state: 4, message: "Association does not own this event" }),
        { status: 403 }
      );
    }
    
    // Costruzione dinamica della query di aggiornamento
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      // Si presume che i nomi dei campi nell'oggetto corrispondano ai nomi delle colonne nella tabella Event
      fields.push(`${key} = ?`);
      values.push(value);
    }
    // Se non ci sono campi da aggiornare, restituisci state 5
    if (fields.length === 0) {
      return new Response(
        JSON.stringify({ state: 5, message: "No event found or no changes made" }),
        { status: 400 }
      );
    }
    
    // Aggiungi l'eventId ai valori per la clausola WHERE
    values.push(eventId);
    
    const updateQuery = `UPDATE Event SET ${fields.join(", ")} WHERE event_id = ?`;
    const [result] = await pool.query(updateQuery, values);
    
    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ state: 5, message: "No event found or no changes made" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ state: 0, message: "Event details updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ state: 1, message: "Internal server error", details: error.message }),
      { status: 500 }
    );
  }
}
