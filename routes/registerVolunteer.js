import { pool } from "../db/dbConfig";

export async function registerVolunteer(request) {
  try {
    const body = await request.json();
    const {
      volunteerFirstName,
      volunteerLastName,
      volunteerEmail,
      volunteerPhone,
      volunteerPassword,
      volunteerDateOfBirth,
    } = body;

    // Validazione input
    if (
      !volunteerFirstName ||
      !volunteerLastName ||
      !volunteerEmail ||
      !volunteerPhone ||
      !volunteerPassword ||
      !volunteerDateOfBirth
    ) {
      return new Response(
        JSON.stringify({ state: 1, message: "Missing parameters" }),
        { status: 400 }
      );
    }

    // Verifica lunghezza e complessità password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(volunteerPassword)) {
      return new Response(
        JSON.stringify({
          state: 2,
          message:
            "Password must be at least 8 characters long and contain an uppercase, lowercase, digit, and special character",
        }),
        { status: 400 }
      );
    }

    // Verifica età minima
    const birthDate = new Date(volunteerDateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      return new Response(
        JSON.stringify({ state: 3, message: "Volunteer must be at least 18 years old" }),
        { status: 400 }
      );
    }

    // Salva nel database
    const [result] = await pool.query(
      `INSERT INTO Volunteer (first_name, last_name, email, phone, password, date_of_birth) VALUES (?, ?, ?, ?, SHA2(?, 256), ?)`,
      [
        volunteerFirstName,
        volunteerLastName,
        volunteerEmail,
        volunteerPhone,
        volunteerPassword,
        volunteerDateOfBirth,
      ]
    );

    return new Response(
      JSON.stringify({ state: 0, message: "Volunteer registration successful" }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        state: 4,
        message: "Error registering volunteer",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
