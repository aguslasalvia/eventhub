# EventHub

EventHub is an event management platform where organizers can create, publish and manage events, and attendees can browse events, reserve tickets, and confirm their attendance. It covers the full flow from event creation to ticket reservation and payment, including multiple ticket categories per event (Economic, Medium, Premium, VIP, Press, Student) with capacity tracking, role-based users (Visitor, Assistant, Planner, Administrator), and PayPal checkout — a buyer can pay with a PayPal account or with a debit/credit card, no account required, without leaving the page.

The project is a Bun/TypeScript monorepo (npm/Bun workspaces) with three packages:

- `packages/server` — a REST API built with Express and Bun, backed by MySQL, exposing endpoints for users, events, ticket types, tickets, and PayPal payments.
- `packages/client` — a React + Vite single-page app that consumes the API: browsing/searching events, an organizer dashboard (create/edit/publish events, manage ticket types), and the attendee flow (reserve a ticket, view "My tickets", confirm attendance).
- `packages/shared` — TypeScript types and enums shared between server and client (event categories/status, ticket categories/status, user types).

> The `packages/client` app was built with [Claude Code](https://claude.com/claude-code).

## Repository layout

```
eventhub/
├── package.json          # Workspace root (Bun workspaces: packages/*)
├── bun.lock               # Root lockfile
├── scripts/                # Standalone helper scripts, not part of any package
│   ├── database_table_creation.sql   # MySQL schema (users, events, tickets, payments, ...)
│   └── seed-data.sql                 # Resets & seeds sample users/events/ticket types/tickets for local testing
└── packages/
    ├── server/            # Backend API (Bun + Express + TypeScript)
    ├── client/             # Frontend app (React + Vite + TypeScript)
    └── shared/              # Types/enums shared by server and client
```

### `scripts/`

Utility scripts that support the project but aren't published as packages.

- `database_table_creation.sql` — the SQL DDL used to create the MySQL schema (`users`, `refresh_tokens`, `events`, `ticket_types`, `payments`, `tickets`) with their foreign key relationships.
- `seed-data.sql` — resets and repopulates `users`/`events`/`ticket_types`/`tickets` with sample data for local testing, including a ready-to-use organizer and visitor account (both log in with `Password123!`). Run with `mysql -u eventhub_user -p eventhub < scripts/seed-data.sql`.

### `packages/server/`

Express API server run with Bun.

- `server.ts` — app entry point: sets up Express, CORS, JSON body parsing, and mounts the API routes under `/api`.
- `src/config/` — runtime configuration (DB connection, JWT secret, PayPal credentials — all read from environment variables, see `.env`).
- `src/controllers/` — request handlers for events, ticket types, tickets, users, and payments; translate HTTP requests into service calls and shape responses.
- `src/core/entities/` — domain entity definitions for events, ticket types, tickets, users, and payments used across the server.
- `src/db/` — database connection setup (MySQL via `mysql2`).
- `src/middlewares/` — Express middlewares, including `auth.middleware.ts`, which verifies the JWT access token on protected routes.
- `src/routes/` — Express routers per resource (`event.routes.ts`, `ticket-type.routes.ts`, `ticket.routes.ts`, `users.routes.ts`, `payment.routes.ts`), aggregated in `routes/index.ts` and mounted at `/api`.
- `src/services/` — business logic and data-access layer for events, ticket types, tickets, users, refresh tokens, and payments, called by the controllers.
- `src/utils/` — shared helpers: input field validators, query response formatting, and `jwt.ts` (signing/verifying access tokens, generating/hashing refresh tokens).

#### Auth

Login issues a short-lived access token (15 min) plus a refresh token. The refresh token is single-use — redeeming it via `POST /users/refresh-token` returns a new access/refresh pair and revokes the old one, so a stolen-but-unused refresh token stops working the moment the real client refreshes. `POST /users/logout` revokes a refresh token outright.

#### Payments

Tickets are reserved first (`POST /tickets`, holds for 10 minutes, `quantity` lets a buyer reserve several at once) and paid for separately. Payment goes through PayPal's Smart Payment Buttons (`@paypal/react-paypal-js` on the client) — rendered in-page, no redirect to paypal.com, and a buyer without a PayPal account can still pay by card. One PayPal order can cover several reserved tickets at once (however many were reserved together). `GET /payment/paypal/client-id` hands the client its (public) PayPal client id; `POST /payment/paypal/create-order` and `POST /payment/paypal/capture-order/:orderId` create and capture the order and confirm the covered tickets. Each successful capture is recorded in `payments` (capture id, amount, which tickets it covers) — enough to issue a refund later, though there's no refund endpoint yet.

#### Running under plain Node

The server runs on Bun day to day (`bun run server.ts`), but `bun run build` also produces a CommonJS build under `dist/` (via `tsc` + `tsc-alias`) that runs on plain Node: `bun run build && bun run start:node`.

#### Known limitations

- `POST /events/:id/cancel` reverts an event to Draft rather than a distinct "Cancelled" state.
- Ticket cancellation isn't wired up (the entity supports it, the route is commented out).
- No automated tests — this is a solo/local project, nothing runs them in CI, so they weren't worth maintaining.

### `packages/client/`

Frontend single-page application. Plain CSS (no framework), one stylesheet co-located per component/page.

- `index.html` / `vite.config.ts` — Vite entry point and build configuration (the dev server proxies `/api` to `http://localhost:3000`).
- `src/main.tsx` — React app bootstrap.
- `src/App.tsx` — routes, the top-level `AuthProvider`/`EventsProvider`, and the `react-hot-toast` `<Toaster/>`.
- `src/pages/` — route-level pages: `Home`, `Events`, `EventDetail`, `CreateEvent`, `EditEvent`, `OrganizerDashboard`, `ManageTicketTypes`, `MyTickets`, `Register`, `Login`, `NotFound`.
- `src/components/` — reusable pieces, grouped by concern:
  - `ui/` — generic primitives (`Button`, `Badge`, `Field` inputs, `Alert`, `Spinner`, `EmptyState`).
  - `layout/` — `Header`, `Footer`, `Layout`.
  - `events/` — event-specific building blocks (`EventCard`, `EventGrid`, `EventFilters`, `EventForm`, `OrganizerEventRow`, `TicketPanel`).
  - `tickets/` — `TicketRow` and `TicketGroupRow` (several tickets reserved together, paid for as one), used on "My tickets".
  - `payments/` — `PayPalCheckoutButtons`, wrapping PayPal's Smart Payment Buttons (PayPal account or debit/credit card, in-page, no redirect).
  - `auth/` — `RequireOrganizer`, a route guard for organizer-only pages.
- `src/context/` + `src/hooks/` — `EventsContext`/`useEvents` (shared event list, since the API has no `GET /events/:id`) and `AuthContext`/`useAuth` (the logged-in user; access/refresh tokens live in `localStorage`, refreshed transparently by `api/client.ts` on a 401).
- `src/api/` — typed fetch wrappers per resource (`events.ts`, `ticketTypes.ts`, `tickets.ts`, `users.ts`, `payments.ts`), sharing request/error/timeout handling (and the access-token refresh-and-retry logic) from `client.ts`.
- `src/lib/` — formatting (`format.ts`) and enum-label/role helpers (`enumLabels.ts`, `roles.ts`) shared across pages and components.
- `src/assets/` — static assets (images, icons) used by the UI.
- `public/` — static files served as-is (favicon, icon sprite).

Transient feedback (form errors, reserve/pay/publish results) shows as a toast (`react-hot-toast`); persistent page state (data failed to load, "event not found") stays an inline `Alert`.

### `packages/shared/`

Types and enums shared between the server and client so both sides agree on domain values.

- `index.ts` — package entry point re-exporting everything below.
- `enums/event.ts` — `EventCategory` and `EventState` (Draft/Published/Cancelled).
- `enums/tickets.ts` — `TicketStatus` (Reserved/Confirmed/Cancelled) and `TicketCategories` (Economic/Medium/Premium/VIP/Press/Student).
- `enums/user.ts` — `UserType` (Visitor/Assistant/Planner/Administrator).
- `types/ticket.ts` / `types.ts` — shared TypeScript type definitions.

## Getting started

```bash
bun install
```

The server expects a MySQL database; use `scripts/database_table_creation.sql` to create the required schema, and configure connection details via the server's environment variables (see `packages/server/.env`). It also needs `JWT_SECRET` (signs access/refresh tokens) and, for payments, `PAYPAL_CLIENT_ID`/`PAYPAL_SECRET`/`PAYPAL_BASE_URL` (defaults to the PayPal sandbox) from a PayPal developer app.

Run the server:

```bash
cd packages/server
bun run server.ts
```

Run the client:

```bash
cd packages/client
bun run dev
```

Optionally, seed some sample users/events/ticket types to test against (includes a ready-to-use organizer and visitor account — see `scripts/seed-data.sql`):

```bash
mysql -u eventhub_user -p eventhub < scripts/seed-data.sql
```
