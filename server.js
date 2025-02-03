// server.js
import { registerVolunteer } from "./routes/registerVolunteer.js";
import { loginVolunteer } from "./routes/login.js";

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
    
    // Altri endpoint possono essere aggiunti qui...
    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
