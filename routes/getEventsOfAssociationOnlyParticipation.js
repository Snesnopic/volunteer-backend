// routes/getEventsOfAssociationOnlyParticipation.js

import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

/**
 * Endpoint: getEventsOfAssociationOnlyParticipation
 * Tipo: POST
 * 
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione dell'utente associativo
 * 
 * Output:
 *   - state:
 *       0: Events retrieved successfully
 *       1: Internal server error
 *       2: Not logged in
 *       3: Permessi non sufficienti
 *       4: No events found for this association
 *   - message: descrizione dell’esito
 *   - events: array di oggetti contenenti i dettagli degli eventi (solo se state = 0)
 * 
 * Scopo:
 *   Recupera tutti gli eventi a cui un'associazione ha partecipato (cioè, è presente nella tabella di join *EventAssociation*)
 *   che **non sono stati creati** dall’associazione stessa.
 */
export async function getEventsOfAssociationOnlyParticipation(request) {
  try {
    const body = await request.json();
    const { userEmail } = body;

    // Verifica che l'utente sia autenticato come associazione
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as an association" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;

    // Query per recuperare gli eventi a cui l'associazione ha partecipato, esclusi quelli creati da essa
    const query = `
      SELECT e.*
      FROM Event e
      JOIN EventAssociation ea ON e.event_id = ea.event_id
      WHERE ea.association_id = ? AND e.creator_id <> ?
    `;
    const [rows] = await pool.query(query, [associationId, associationId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 4, message: "No events found for this association" }),
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
