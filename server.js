// server.js
import { registerVolunteer } from "./routes/registerVolunteer.js";
import { loginVolunteer } from "./routes/login.js";
import { getAssociationsOfEvent } from "./routes/getAssociationsOfEvent.js";
import { getAvailableEventsForVolunteer } from "./routes/getAvailableEventsForVolunteer.js";

Bun.serve({
  port: 3000,
  async fetch(request) {
    const { pathname, method } = new URL(request.url);

    if (pathname === "/API/registerVolunteer" && method === "POST") {
      return await registerVolunteer(request);
    }
    if (pathname === "/API/login" && method === "POST") {
      return await loginVolunteer(request);
    }
    if (pathname === "/API/getAssociationsOfEvent" && method === "POST") {
      return await getAssociationsOfEvent(request);
    }
    if (pathname === "/API/getAvailableEventsForVolunteer" && method === "GET") {
      return await getAvailableEventsForVolunteer(request);
    }
    if (pathname === "/API/getEventsOfAssociation" && method === "POST") {
      return await getEventsOfAssociation(request);
    }
    if (pathname === "/API/getInterestsOfEvent" && method === "POST") {
      return await getInterestsOfEvent(request);
    }
    // Altri endpoint verranno aggiunti qui successivamente...

    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
