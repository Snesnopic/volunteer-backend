// db/session.js

/**
 * SessionManager:
 * - Utilizza una Map per memorizzare le sessioni in memoria.
 * - Ogni sessione è indicizzata dalla chiave (tipicamente l'email o un identificativo univoco dell'utente).
 * - Ogni sessione contiene un oggetto che può includere informazioni quali:
 *      - loggedIn: Boolean (stato di autenticazione)
 *      - volunteerId / associationId: l'ID dell'utente (se applicabile)
 *      - confirmationCode: codice di conferma (se in fase di login)
 *      - timestamp: momento in cui la sessione è stata creata/aggiornata (per il controllo del TTL)
 */

const sessions = new Map();

// Time-to-live per una sessione (in millisecondi). Ad esempio, 1 ora.
const SESSION_TTL = 3600000; // 1 ora

/**
 * setSession(userKey, sessionData)
 * Crea o aggiorna una sessione associata a "userKey".
 * Imposta il timestamp corrente per la sessione.
 */
function setSession(userKey, sessionData) {
  sessionData.timestamp = Date.now();
  sessions.set(userKey, sessionData);
}

/**
 * getSession(userKey)
 * Recupera la sessione associata a "userKey".
 * Se la sessione è scaduta, la rimuove e restituisce null.
 */
function getSession(userKey) {
  const session = sessions.get(userKey);
  if (session) {
    // Verifica se la sessione è scaduta
    if (Date.now() - session.timestamp > SESSION_TTL) {
      sessions.delete(userKey);
      return null;
    }
    return session;
  }
  return null;
}

/**
 * updateSession(userKey, newData)
 * Aggiorna i dati della sessione associata a "userKey".
 * Esegue una fusione (merge) tra i dati esistenti e quelli nuovi e aggiorna il timestamp.
 */
function updateSession(userKey, newData) {
  const session = getSession(userKey);
  if (session) {
    const updatedSession = { ...session, ...newData, timestamp: Date.now() };
    sessions.set(userKey, updatedSession);
    return updatedSession;
  }
  return null;
}

/**
 * deleteSession(userKey)
 * Rimuove la sessione associata a "userKey".
 */
function deleteSession(userKey) {
  sessions.delete(userKey);
}

/**
 * cleanupSessions()
 * (Opzionale) Funzione per pulire periodicamente le sessioni scadute.
 */
function cleanupSessions() {
  for (const [key, session] of sessions.entries()) {
    if (Date.now() - session.timestamp > SESSION_TTL) {
      sessions.delete(key);
    }
  }
}

// Esempio di esecuzione periodica del cleanup (ogni 30 minuti)
setInterval(cleanupSessions, 1800000);

export { sessions, setSession, getSession, updateSession, deleteSession };
