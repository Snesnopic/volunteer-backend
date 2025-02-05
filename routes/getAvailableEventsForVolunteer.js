// routes/getAvailableEventsForVolunteer.js
import { pool } from "../db/dbConfig.js";
import { sessions, getSession, setSession, updateSession, deleteSession } from "../db/session.js";

export async function getAvailableEventsForVolunteer(request) {
  try {
    // Otteniamo il parametro "userEmail" dalla query string
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    // Verifica che l'utente sia autenticato e sia un volontario
    const session = getSession(userEmail);
    if (!userEmail || !session || !session.loggedIn) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in" }),
        { status: 401 }
      );
    }
    if (!session.volunteerId) {
      return new Response(
        JSON.stringify({ state: 2, message: "Not logged in as a volunteer" }),
        { status: 401 }
      );
    }
    const volunteerId = session.volunteerId;

    // Query per recuperare gli eventi disponibili
    const query = `
      SELECT e.*
      FROM Event e
      WHERE e.event_date > NOW()
        AND e.event_id NOT IN (
          SELECT event_id FROM VolunteerEvent WHERE volunteer_id = ?
        )
        AND (e.event_max_capacity IS NULL OR
             (SELECT COUNT(*) FROM VolunteerEvent WHERE event_id = e.event_id) < e.event_max_capacity)
    `;
    const [rows] = await pool.query(query, [volunteerId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ state: 3, message: "No available events found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        state: 0,
        message: "Available events retrieved successfully",
        data: rows,
      }),
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
