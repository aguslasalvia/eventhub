# EventHub

EventHub is an event management platform where organizers can create, publish and manage events, and attendees can browse events, reserve tickets, and confirm their attendance. It covers the full flow from event creation to ticket reservation and confirmation, including multiple ticket categories per event (Economic, Medium, Premium, VIP, Press, Student) with capacity tracking, and role-based users (Visitor, Assistant, Planner, Administrator).

The project is a Bun/TypeScript monorepo (npm/Bun workspaces) with three packages:

- `packages/server` — a REST API built with Express and Bun, backed by MySQL, exposing endpoints for users, events, ticket types, and tickets.
- `packages/client` — a React + Vite single-page app that consumes the API: browsing/searching events, an organizer dashboard (create/edit/publish events, manage ticket types), and the attendee flow (reserve a ticket, view "My tickets", confirm attendance).
- `packages/shared` — TypeScript types and enums shared between server and client (event categories/status, ticket categories/status, user types).

> The `packages/client` app was built with [Claude Code](https://claude.com/claude-code).

## Repository layout

```
eventhub/
├── package.json          # Workspace root (Bun workspaces: packages/*)
├── bun.lock               # Root lockfile
├── scripts/                # Standalone helper scripts, not part of any package
│   ├── database_table_creation.sql   # MySQL schema: users, events, ticket_types, tickets
│   └── seed-events.ts                # Resets & seeds sample events/ticket types for local testing
└── packages/
    ├── server/            # Backend API (Bun + Express + TypeScript)
    ├── client/             # Frontend app (React + Vite + TypeScript)
    └── shared/              # Types/enums shared by server and client
```

### `scripts/`

Utility scripts that support the project but aren't published as packages.

- `database_table_creation.sql` — the SQL DDL used to create the MySQL schema (`users`, `events`, `ticket_types`, `tickets`) with their foreign key relationships.
- `seed-events.ts` — resets and repopulates `events`/`ticket_types`/`tickets` with sample data for local testing. Run with `bun run scripts/seed-events.ts [organizerEmail]` (requires an existing organizer/administrator account).

### `packages/server/`

Express API server run with Bun.

- `server.ts` — app entry point: sets up Express, CORS, JSON body parsing, and mounts the API routes under `/api`.
- `src/config/` — runtime configuration (e.g. server port and other environment-derived settings).
- `src/controllers/` — request handlers for events, ticket types, tickets, and users; translate HTTP requests into service calls and shape responses.
- `src/core/entities/` — domain entity definitions for events, ticket types, tickets, and users used across the server.
- `src/db/` — database connection setup (MySQL via `mysql2`).
- `src/middlewares/` — Express middlewares, including authentication (JWT-based).
- `src/routes/` — Express routers per resource (`event.routes.ts`, `ticket-type.routes.ts`, `ticket.routes.ts`, `users.routes.ts`), aggregated in `routes/index.ts` and mounted at `/api`.
- `src/services/` — business logic and data-access layer for events, ticket types, tickets, and users, called by the controllers.
- `src/utils/` — shared helpers, such as input field validators and query response formatting.

#### Known limitations

- `auth.middleware.ts` doesn't verify anything yet (it's a pass-through) — login/register check real credentials, but no token/session is issued or enforced, so route protection is UI-only on the client.
- `POST /events/:id/cancel` reverts an event to Draft rather than a distinct "Cancelled" state, and `DELETE /events/:id` currently does the same (it doesn't actually delete).
- Ticket cancellation isn't wired up (the entity supports it, the route is commented out).

### `packages/client/`

Frontend single-page application. Plain CSS (no framework), one stylesheet co-located per component/page.

- `index.html` / `vite.config.ts` — Vite entry point and build configuration (the dev server proxies `/api` to `http://localhost:3000`).
- `src/main.tsx` — React app bootstrap.
- `src/App.tsx` — routes and the top-level `AuthProvider`/`EventsProvider`.
- `src/pages/` — route-level pages: `Home`, `Events`, `EventDetail`, `CreateEvent`, `EditEvent`, `OrganizerDashboard`, `ManageTicketTypes`, `MyTickets`, `Register`, `Login`, `NotFound`.
- `src/components/` — reusable pieces, grouped by concern:
  - `ui/` — generic primitives (`Button`, `Badge`, `Field` inputs, `Alert`, `Spinner`, `EmptyState`).
  - `layout/` — `Header`, `Footer`, `Layout`.
  - `events/` — event-specific building blocks (`EventCard`, `EventGrid`, `EventFilters`, `EventForm`, `OrganizerEventRow`, `TicketPanel`).
  - `tickets/` — `TicketRow` (used on the "My tickets" page).
  - `auth/` — `RequireOrganizer`, a route guard for organizer-only pages.
- `src/context/` + `src/hooks/` — `EventsContext`/`useEvents` (shared event list, since the API has no `GET /events/:id`) and `AuthContext`/`useAuth` (the logged-in user, persisted to `localStorage` — see the backend's known limitations above regarding sessions).
- `src/api/` — typed fetch wrappers per resource (`events.ts`, `ticketTypes.ts`, `tickets.ts`, `users.ts`), sharing request/error/timeout handling from `client.ts`.
- `src/lib/` — formatting (`format.ts`) and enum-label/role helpers (`enumLabels.ts`, `roles.ts`) shared across pages and components.
- `src/assets/` — static assets (images, icons) used by the UI.
- `public/` — static files served as-is (favicon, icon sprite).

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

The server expects a MySQL database; use `scripts/database_table_creation.sql` to create the required schema, and configure connection details via the server's environment variables (see `packages/server/.env`).

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

Optionally, seed some sample events/ticket types to test against (requires an existing organizer account — register one via the app first):

```bash
bun run scripts/seed-events.ts [organizerEmail]
```
