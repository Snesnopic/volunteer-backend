// server.js
import { registerVolunteer } from "./routes/registerVolunteer.js";
import { loginVolunteer } from "./routes/login.js";
import { getAvailableEventsForVolunteer } from "./routes/getAvailableEventsForVolunteer.js";
import { getAssociationsOfEvent } from "./routes/getAssociationsOfEvent.js";
import { getInterestsOfEvent } from "./routes/getInterestsOfEvent.js";
import { getInterestsOfVolunteer } from "./routes/getInterestsOfVolunteer.js";
import { getEventsNotParticipating } from "./routes/getEventsNotParticipating.js";
import { getEventsOfAssociationOnlyParticipation } from "./routes/getEventsOfAssociationOnlyParticipation.js";
import { getInterestList } from "./routes/getInterestList.js";
import { getNumberOfParticipants } from "./routes/getNumberOfParticipants.js";
import { getParticipantsOfEvent } from "./routes/getParticipantsOfEvent.js";
import { logout } from "./routes/logout.js";
import { joinEvent } from "./routes/joinEvent.js";
import { removeVolunteerFromEvent } from "./routes/removeVolunteerFromEvent.js";
import { publishEvent } from "./routes/publishEvent.js";
import { updateAssociationProfile } from "./routes/updateAssociationProfile.js";
import { updateEvent } from "./routes/updateEvent.js";
import { getVolunteerEvents } from "./routes/getVolunteerEvents.js";


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
    if (pathname === "/API/getAvailableEventsForVolunteer" && method === "GET") {
      return await getAvailableEventsForVolunteer(request);
    }
    if (pathname === "/API/getEventsOfAssociation" && method === "POST") {
      return await getEventsOfAssociation(request);
    }
    if (pathname === "/API/getInterestsOfEvent" && method === "POST") {
      return await getInterestsOfEvent(request);
    }
    if (pathname === "/API/getInterestsOfVolunteer" && method === "GET") {
      return await getInterestsOfVolunteer(request);
    }
    if (pathname === "/API/getAssociationsOfEvent" && method === "POST") {
      return await getAssociationsOfEvent(request);
    }
    if (pathname === "/API/getEventsNotParticipating" && method === "GET") {
      return await getEventsNotParticipating(request);
    }
    if (pathname === "/API/getEventsOfAssociationOnlyParticipation" && method === "POST") {
      return await getEventsOfAssociationOnlyParticipation(request);
    }
    if (pathname === "/API/getInterestList" && method === "GET") {
      return await getInterestList(request);
    }
    if (pathname === "/API/getNumberOfParticipants" && method === "POST") {
      return await getNumberOfParticipants(request);
    }
    if (pathname === "/API/getParticipantsOfEvent" && method === "POST") {
      return await getParticipantsOfEvent(request);
    }
    if (pathname === "/API/logout" && method === "GET") {
      return await logout(request);
    }
    if (pathname === "/API/joinEvent" && method === "POST") {
      return await joinEvent(request);
    }
    if (pathname === "/API/removeVolunteerFromEvent" && method === "POST") {
      return await removeVolunteerFromEvent(request);
    }
    if (pathname === "/API/publishEvent" && method === "POST") {
      return await publishEvent(request);
    }
    if (pathname === "/API/updateAssociationProfile" && method === "POST") {
      return await updateAssociationProfile(request);
    }
    if (pathname === "/API/updateEvent" && method === "POST") {
      return await updateEvent(request);
    }
    if (pathname === "/API/getVolunteerEvents" && method === "GET") {
      return await getVolunteerEvents(request);
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
