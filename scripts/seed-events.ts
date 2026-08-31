/**
 * Resets the `events` (and `tickets`/`ticket_types`) tables and inserts a
 * handful of sample events covering every status (Published/Draft/Cancelled)
 * and both with/without a confirmed date and location, plus ticket types for
 * the published ones, for local testing.
 *
 * DESTRUCTIVE: deletes every row in `tickets`, `ticket_types` and `events`
 * before inserting. Run against a local/dev database only.
 *
 * Usage (from the repo root):
 *   bun run scripts/seed-events.ts [organizerEmail]
 *
 * If no organizerEmail is given, the first Planner/Administrator account
 * found is used. Requires that account to already exist (register one via
 * the app first) — this script does not create users.
 */
import { readFileSync } from "fs";
import path from "path";

// Load packages/server/.env manually (regardless of the caller's cwd) since
// this script lives outside any package, before importing the server's pool
// below — that import reads process.env at module-load time.
const envPath = path.join(import.meta.dir, "../packages/server/.env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/,$/, "").replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // no .env file — fall back to the same defaults packages/server/src/db/database.ts uses
}

// Imported dynamically (after the env is loaded above) and by path into the
// server package so its mysql2 dependency resolves from there, since this
// script lives outside any package and has no node_modules of its own.
const { pool } = await import("../packages/server/src/db/database.ts");

const EventCategory = {
  Technology: 0,
  Music: 1,
  Sports: 2,
  Art: 3,
  Food: 4,
  Business: 5,
  Education: 6,
  Health: 7,
  Community: 8,
  Other: 9,
} as const;

const EventState = { Draft: 0, Published: 1, Cancelled: 2 } as const;

const TicketCategory = { Economic: 0, Midium: 1, Premium: 2, VIP: 3, Press: 4, Student: 5 } as const;

const sampleEvents = [
  {
    title: "Tech Conference Montevideo",
    description: "A full day of talks on software architecture, AI, and career growth in tech.",
    location: "LATU, Montevideo",
    date: new Date("2026-10-14 09:00:00"),
    maxCapacity: 400,
    category: EventCategory.Technology,
    status: EventState.Published,
    ticketTypes: [
      { category: TicketCategory.Economic, price: 25.5, totalCapacity: 300 },
      { category: TicketCategory.VIP, price: 80, totalCapacity: 20 },
    ],
  },
  {
    title: "Rooftop Live Music Night",
    description: "An open-air night of live bands and local artists on a rooftop terrace.",
    location: "Sky Bar, Punta Carretas",
    date: new Date("2026-09-20 20:00:00"),
    maxCapacity: 150,
    category: EventCategory.Music,
    status: EventState.Published,
    ticketTypes: [{ category: TicketCategory.Economic, price: 15, totalCapacity: 150 }],
  },
  {
    title: "5K Charity Run",
    description: "A community run through the Rambla to raise funds for local shelters.",
    location: "Rambla de Montevideo",
    date: new Date("2026-11-02 08:00:00"),
    maxCapacity: 800,
    category: EventCategory.Sports,
    status: EventState.Published,
    ticketTypes: [
      { category: TicketCategory.Economic, price: 10, totalCapacity: 700 },
      { category: TicketCategory.Student, price: 5, totalCapacity: 100 },
    ],
  },
  {
    title: "UX Design Workshop",
    description: "Hands-on workshop covering user research, wireframing, and prototyping basics.",
    location: null,
    date: null,
    maxCapacity: 40,
    category: EventCategory.Education,
    status: EventState.Draft,
    ticketTypes: [],
  },
  {
    title: "Cybersecurity Talk",
    description: "An evening talk on common web vulnerabilities and how to defend against them.",
    location: "Torre Antel, Sala 3",
    date: new Date("2026-10-05 18:30:00"),
    maxCapacity: 100,
    category: EventCategory.Technology,
    status: EventState.Draft,
    ticketTypes: [],
  },
  {
    title: "Food Truck Fair",
    description: "Cancelled due to a scheduling conflict with the venue.",
    location: "Parque Rodo",
    date: new Date("2026-09-28 12:00:00"),
    maxCapacity: 300,
    category: EventCategory.Food,
    status: EventState.Cancelled,
    ticketTypes: [],
  },
];

async function resolveOrganizerId(requestedEmail: string | undefined): Promise<{ id: number; name: string }> {
  const [rows] = requestedEmail
    ? await pool.execute("SELECT id, name FROM users WHERE email = ? AND userType IN (2, 3)", [requestedEmail])
    : await pool.execute("SELECT id, name FROM users WHERE userType IN (2, 3) ORDER BY id LIMIT 1");

  const organizer = (rows as { id: number; name: string }[])[0];
  if (!organizer) {
    const scope = requestedEmail ? `with email "${requestedEmail}"` : "at all";
    throw new Error(
      `No organizer/administrator account found ${scope}. Register one via the app first (choose "I want to organize events").`,
    );
  }
  return organizer;
}

async function main() {
  const requestedEmail = process.argv[2];
  const organizer = await resolveOrganizerId(requestedEmail);

  // Delete in FK dependency order: tickets -> ticket_types -> events.
  await pool.execute("DELETE FROM tickets");
  await pool.execute("DELETE FROM ticket_types");
  await pool.execute("DELETE FROM events");

  let ticketTypeCount = 0;
  for (const event of sampleEvents) {
    const [result] = await pool.execute(
      "INSERT INTO events (title, description, location, date, maxCapacity, category, status, organizerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [event.title, event.description, event.location, event.date, event.maxCapacity, event.category, event.status, organizer.id],
    );
    const eventId = (result as { insertId: number }).insertId;

    for (const ticketType of event.ticketTypes) {
      await pool.execute(
        "INSERT INTO ticket_types (category, price, totalCapacity, availableCapacity, eventId) VALUES (?, ?, ?, ?, ?)",
        [ticketType.category, ticketType.price, ticketType.totalCapacity, ticketType.totalCapacity, eventId],
      );
      ticketTypeCount++;
    }
  }

  console.log(
    `Seeded ${sampleEvents.length} events (${ticketTypeCount} ticket types) for organizer "${organizer.name}" (id ${organizer.id}):`,
  );
  for (const event of sampleEvents) {
    console.log(`  - [${Object.keys(EventState)[event.status]}] ${event.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
