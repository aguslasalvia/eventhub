-- Test data for EventHub: users, events, ticket types, and tickets.
-- Replaces the old scripts/seed-events.ts (Bun script) with plain SQL.
--
-- DESTRUCTIVE: deletes every row in `tickets`, `ticket_types` and `events`
-- before inserting, same as the script it replaces. Run against a
-- local/dev/test database only.
--
-- Usage:
--   mysql -u eventhub_user -p eventhub < scripts/seed-data.sql
--   # or, against the Docker Compose db service:
--   docker compose exec -T db mysql -u eventhub_user -peventhub eventhub < scripts/seed-data.sql
--
-- Both test users below log in with the password: Password123!

DELETE FROM tickets;
DELETE FROM ticket_types;
DELETE FROM events;
INSERT IGNORE INTO users (name, email, password, userType) VALUES
  ('Test Organizer', 'organizer@eventhub.test', '$2b$10$IGkHYD.C47We8kel99.grO4TWadfJTxB1D7XaKhT/i6y2XnpeXgrW', 2),
  ('Test Visitor', 'visitor@eventhub.test', '$2b$10$7l.cAWLiJeknwraQAPVZF.50KZejyj9AXD82MH.RvagjkgGX6VfdC', 0);

SET @organizerId = (SELECT id FROM users WHERE email = 'organizer@eventhub.test');
SET @visitorId = (SELECT id FROM users WHERE email = 'visitor@eventhub.test');

-- Events ----------------------------------------------------------------
-- category: 0 Technology, 1 Music, 2 Sports, 4 Food, 6 Education (see
-- packages/shared/enums/event.ts). status: 0 Draft, 1 Published, 2 Cancelled.

INSERT INTO events (title, description, location, date, maxCapacity, category, status, organizerId) VALUES
  ('Tech Conference Montevideo', 'A full day of talks on software architecture, AI, and career growth in tech.', 'LATU, Montevideo', '2026-10-14 09:00:00', 400, 0, 1, @organizerId),
  ('Rooftop Live Music Night', 'An open-air night of live bands and local artists on a rooftop terrace.', 'Sky Bar, Punta Carretas', '2026-09-20 20:00:00', 150, 1, 1, @organizerId),
  ('5K Charity Run', 'A community run through the Rambla to raise funds for local shelters.', 'Rambla de Montevideo', '2026-11-02 08:00:00', 800, 2, 1, @organizerId),
  ('UX Design Workshop', 'Hands-on workshop covering user research, wireframing, and prototyping basics.', NULL, NULL, 40, 6, 0, @organizerId),
  ('Cybersecurity Talk', 'An evening talk on common web vulnerabilities and how to defend against them.', 'Torre Antel, Sala 3', '2026-10-05 18:30:00', 100, 0, 0, @organizerId),
  ('Food Truck Fair', 'Cancelled due to a scheduling conflict with the venue.', 'Parque Rodo', '2026-09-28 12:00:00', 300, 4, 2, @organizerId);

SET @techConfId = (SELECT id FROM events WHERE title = 'Tech Conference Montevideo' AND organizerId = @organizerId);
SET @musicId = (SELECT id FROM events WHERE title = 'Rooftop Live Music Night' AND organizerId = @organizerId);
SET @runId = (SELECT id FROM events WHERE title = '5K Charity Run' AND organizerId = @organizerId);

-- Ticket types ------------------------------------------------------------
-- category: 0 Economic, 1 Midium, 2 Premium, 3 VIP, 4 Press, 5 Student
-- (see packages/shared/enums/tickets.ts).

INSERT INTO ticket_types (category, price, totalCapacity, availableCapacity, eventId) VALUES
  (0, 25.50, 300, 300, @techConfId),
  (3, 80.00, 20, 20, @techConfId),
  (0, 15.00, 150, 150, @musicId),
  (0, 10.00, 700, 700, @runId),
  (5, 5.00, 100, 100, @runId);

-- Tickets ------------------------------------------------------------------
-- One Reserved and one Confirmed ticket for the test visitor, so "My
-- tickets" has data to show. status: 0 Reserved, 1 Confirmed, 2 Cancelled.

SET @econTechTicketTypeId = (SELECT id FROM ticket_types WHERE eventId = @techConfId AND category = 0);
SET @econMusicTicketTypeId = (SELECT id FROM ticket_types WHERE eventId = @musicId AND category = 0);

INSERT INTO tickets (ticketTypeId, userId, qrCode, status, purchaseDate, reservationExpiresAt) VALUES
  (@econTechTicketTypeId, @visitorId, NULL, 0, NULL, DATE_ADD(NOW(), INTERVAL 15 MINUTE)),
  (@econMusicTicketTypeId, @visitorId, CONCAT('QR-', UUID()), 1, NOW(), NULL);

UPDATE ticket_types SET availableCapacity = availableCapacity - 1 WHERE id IN (@econTechTicketTypeId, @econMusicTicketTypeId);
