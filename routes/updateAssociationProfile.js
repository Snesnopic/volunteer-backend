// routes/updateAssociationProfile.js

import { pool } from "../db/dbConfig.js";
import { getSession } from "../db/session.js";
import crypto from "crypto";

/**
 * Endpoint: updateAssociationProfile
 * Tipo: POST
 * 
 * Input (body JSON):
 *   - userEmail: stringa per identificare la sessione dell’associazione
 *   - associationWebsite (opzionale): nuovo sito web dell’associazione
 *   - associationLogo (opzionale): nuovo logo dell’associazione
 *   - associationLocation (opzionale): nuova posizione dell’associazione
 *   - associationPassword (opzionale): nuova password dell’associazione
 * 
 * Output:
 *   - state:
 *       0: Profilo dell’associazione aggiornato con successo
 *       1: Errore interno del server
 *       2: Utente non loggato come associazione
 *       3: Nessun campo da aggiornare
 *       4: Nessuna associazione trovata o nessuna modifica apportata
 *   - message: descrizione dell’esito della richiesta
 */
export async function updateAssociationProfile(request) {
  try {
    const body = await request.json();
    const { userEmail, associationWebsite, associationLogo, associationLocation, associationPassword } = body;
    
    // Verifica la presenza dell'utente e che sia loggato come associazione
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn || !session.associationId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Utente non loggato come associazione" }),
        { status: 401 }
      );
    }
    const associationId = session.associationId;
    
    // Prepara i campi da aggiornare; se nessun campo viene fornito, restituisce lo state 3
    const fields = [];
    const values = [];
    
    if (associationWebsite !== undefined) {
      fields.push("association_website = ?");
      values.push(associationWebsite);
    }
    if (associationLogo !== undefined) {
      fields.push("association_logo = ?");
      values.push(associationLogo);
    }
    if (associationLocation !== undefined) {
      fields.push("association_location = ?");
      values.push(associationLocation);
    }
    if (associationPassword !== undefined) {
      // Hash della nuova password usando SHA256 (simile a quanto fatto per i volontari)
      const hashedPassword = crypto.createHash("sha256").update(associationPassword).digest("hex");
      fields.push("association_password = ?");
      values.push(hashedPassword);
    }
    
    if (fields.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "Nessun campo da aggiornare" }),
        { status: 400 }
      );
    }
    
    // Aggiunge l'ID dell'associazione alla fine dei valori per la clausola WHERE
    values.push(associationId);
    
    // Costruisce la query dinamicamente
    const query = `UPDATE Association SET ${fields.join(", ")} WHERE association_id = ?`;
    
    const [result] = await pool.query(query, values);
    
    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ state: 4, message: "Nessuna associazione trovata o nessuna modifica apportata" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ state: 0, message: "Profilo dell’associazione aggiornato con successo" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ state: 1, message: "Errore interno del server", details: error.message }),
      { status: 500 }
    );
  }
}
