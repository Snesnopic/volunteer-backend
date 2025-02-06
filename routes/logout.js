// routes/logout.js

import { deleteSession, getSession } from "../db/session.js";

/**
 * Endpoint: logout
 * Tipo: GET
 *
 * Input:
 *   - Utilizza la query string per identificare l'utente, ad es. tramite "userEmail"
 *
 * Output:
 *   - state: 0 (Logout avvenuto con successo)
 *   - message: Stringa che indica che l'utente è stato disconnesso con successo
 *
 * Scopo:
 *   Questo endpoint elimina la sessione dell'utente (basata su userEmail)
 *   e restituisce un messaggio di conferma del logout.
 */
export async function logout(request) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");
    
    // Se non viene fornito userEmail, restituisci un messaggio di errore (anche se le specifiche non lo richiedono esplicitamente)
    if (!userEmail) {
      return new Response(
        JSON.stringify({ state: 1, message: "Missing userEmail" }),
        { status: 400 }
      );
    }
    
    // Controlla se esiste una sessione per l'utente e, in caso, eliminala
    const session = getSession(userEmail);
    if (session) {
      deleteSession(userEmail);
    }
    
    return new Response(
      JSON.stringify({ state: 0, message: "Logout avvenuto con successo" }),
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
