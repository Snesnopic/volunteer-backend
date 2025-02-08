// routes/updateVolunteerProfile.js

import { pool } from "../db/dbConfig.js";
import { getSession } from "../db/session.js";
import crypto from "crypto";

/**
 * Endpoint: updateVolunteerProfile
 * Tipo: POST
 *
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione del volontario
 *   - volunteerPhoto (opzionale): nuovo blob/URL/base64 della foto del volontario
 *   - volunteerAvailability (opzionale): stringa contenente la disponibilità del volontario
 *   - volunteerPassword (opzionale): nuova password del volontario
 *
 * Output:
 *   - state:
 *       0: Volunteer profile updated successfully
 *       1: Internal server error
 *       2: Not logged in as a volunteer
 *       3: No fields to update
 *       4: No volunteer found or no changes made
 *   - message: stringa descrittiva dell’esito
 */
export async function updateVolunteerProfile(request) {
  try {
    const body = await request.json();
    const { userEmail, volunteerPhoto, volunteerAvailability, volunteerPassword } = body;

    // Verifica che l'utente sia autenticato come volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as a volunteer" }),
        { status: 401 }
      );
    }
    const volunteerId = session.volunteerId;

    // Prepara i campi da aggiornare; se nessun campo viene fornito, restituisce lo state 3
    const fields = [];
    const values = [];
    
    if (volunteerPhoto !== undefined) {
      fields.push("volunteer_photo = ?");
      values.push(volunteerPhoto);
    }
    if (volunteerAvailability !== undefined) {
      fields.push("volunteer_availability = ?");
      values.push(volunteerAvailability);
    }
    if (volunteerPassword !== undefined) {
      // Calcola l'hash della nuova password usando SHA256
      const hashedPassword = crypto.createHash("sha256").update(volunteerPassword).digest("hex");
      fields.push("volunteer_password = ?");
      values.push(hashedPassword);
    }
    
    if (fields.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "No fields to update" }),
        { status: 400 }
      );
    }
    
    // Aggiunge volunteerId ai valori per la clausola WHERE
    values.push(volunteerId);
    
    // Costruisce la query dinamicamente; si assume che nella tabella "Volunteer" i nomi delle colonne
    // corrispondano a quelli usati qui (es. volunteer_photo, volunteer_availability, volunteer_password)
    const updateQuery = `UPDATE Volunteer SET ${fields.join(", ")} WHERE volunteer_id = ?`;
    const [result] = await pool.query(updateQuery, values);
    
    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ state: 4, message: "No volunteer found or no changes made" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ state: 0, message: "Volunteer profile updated successfully" }),
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
