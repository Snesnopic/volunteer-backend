// routes/login.js
import { pool } from "../db/dbConfig.js";
import crypto from "crypto";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

// Mappa per gestire le sessioni in memoria (già gestita in session.js, ma l'importazione consente di accedervi)
  
export async function loginVolunteer(request) {
  try {
    const body = await request.json();
    const { userEmail, userPassword, confirmationCode } = body;

    // Se l'utente risulta già loggato, restituisci l'errore
    const currentSession = getSession(userEmail);
    if (userEmail && currentSession && currentSession.loggedIn) {
      return new Response(
        JSON.stringify({ state: 5, message: "Already logged in" }),
        { status: 400 }
      );
    }

    // Scenario II: Login tramite conferma (confirmationCode inviato via email)
    if (confirmationCode) {
      if (!userEmail || !currentSession) {
        return new Response(
          JSON.stringify({ state: 7, message: "Missing confirmation code" }),
          { status: 400 }
        );
      }
      if (currentSession.confirmationCode !== confirmationCode) {
        return new Response(
          JSON.stringify({ state: 10, message: "Invalid confirmation code, please try again" }),
          { status: 400 }
        );
      }
      // Verifica che il codice non sia scaduto (scadenza di 120 secondi)
      if (Date.now() - currentSession.timestamp > 120000) {
        deleteSession(userEmail);
        return new Response(
          JSON.stringify({ state: 11, message: "Confirmation code expired" }),
          { status: 400 }
        );
      }
      // Conferma effettuata: segna l'utente come loggato
      updateSession(userEmail, { loggedIn: true });
      return new Response(
        JSON.stringify({ state: -1, message: "Login successful as volunteer" }),
        { status: 200 }
      );
    }
    // Scenario I: Login con credenziali (email e password)
    else {
      if (!userEmail || !userPassword) {
        return new Response(
          JSON.stringify({ state: 1, message: "Missing credentials" }),
          { status: 400 }
        );
      }

      // Recupera il volontario dal database
      const [rows] = await pool.query("SELECT * FROM Volunteer WHERE email = ?", [userEmail]);
      if (rows.length === 0) {
        return new Response(
          JSON.stringify({ state: 3, message: "Invalid volunteer email or volunteer password" }),
          { status: 400 }
        );
      }
      const volunteer = rows[0];

      // Calcola l'hash della password fornita
      const hash = crypto.createHash("sha256").update(userPassword).digest("hex");
      if (hash !== volunteer.password) {
        return new Response(
          JSON.stringify({ state: 3, message: "Invalid volunteer email or volunteer password" }),
          { status: 400 }
        );
      }

      // Genera un codice di conferma (es. numero a 6 cifre)
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Registra o aggiorna la sessione per questo utente, includendo volunteerId
      setSession(userEmail, {
        confirmationCode: generatedCode,
        loggedIn: false,
        volunteerId: volunteer.volunteer_id,
      });

      // In un'app reale invieresti l'email; qui stampiamo il codice in console
      console.log(`Confirmation code for ${userEmail}: ${generatedCode}`);

      return new Response(
        JSON.stringify({ state: 0, message: "Login confirmation code sent" }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        state: 4,
        message: "An error occurred during login",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
