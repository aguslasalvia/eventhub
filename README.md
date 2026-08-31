# EventHub

EventHub is an event management platform where organizers can create and publish events, and attendees can browse events and reserve tickets. It covers the full flow from event creation to ticket reservation and confirmation, including multiple ticket categories per event (Economic, Medium, Premium, VIP, Press, Student) with capacity tracking, and role-based users (Visitor, Assistant, Planner, Administrator).

The project is a Bun/TypeScript monorepo (npm/Bun workspaces) with three packages:

- `packages/server` — a REST API built with Express and Bun, backed by MySQL, exposing endpoints for users, events, and tickets.
- `packages/client` — a React + Vite single-page app that will consume the API.
- `packages/shared` — TypeScript types and enums shared between server and client (event categories/status, ticket categories/status, user types).

## Repository layout

```
eventhub/
├── package.json          # Workspace root (Bun workspaces: packages/*)
├── bun.lock               # Root lockfile
├── scripts/                # Standalone helper scripts, not part of any package
│   └── database_table_creation.sql   # MySQL schema: users, events, ticket_types, tickets
└── packages/
    ├── server/            # Backend API (Bun + Express + TypeScript)
    ├── client/             # Frontend app (React + Vite + TypeScript)
    └── shared/              # Types/enums shared by server and client
```

### `scripts/`

Utility scripts that support the project but aren't published as packages. Currently contains `database_table_creation.sql`, the SQL DDL used to create the MySQL schema (`users`, `events`, `ticket_types`, `tickets`) with their foreign key relationships.

### `packages/server/`

Express API server run with Bun.

- `server.ts` — app entry point: sets up Express, CORS, JSON body parsing, and mounts the API routes under `/api`.
- `src/config/` — runtime configuration (e.g. server port and other environment-derived settings).
- `src/controllers/` — request handlers for events, tickets, and users; translate HTTP requests into service calls and shape responses.
- `src/core/entities/` — domain entity definitions for events, tickets, and users used across the server.
- `src/db/` — database connection setup (MySQL via `mysql2`).
- `src/middlewares/` — Express middlewares, including authentication (JWT-based).
- `src/routes/` — Express routers per resource (`event.routes.ts`, `ticket.routes.ts`, `users.routes.ts`), aggregated in `routes/index.ts` and mounted at `/api`.
- `src/services/` — business logic and data-access layer for events, tickets, and users, called by the controllers.
- `src/utils/` — shared helpers, such as input field validators and query response formatting.

### `packages/client/`

Frontend single-page application.

- `index.html` / `vite.config.ts` — Vite entry point and build configuration.
- `src/main.tsx` — React app bootstrap.
- `src/App.tsx` / `src/App.css` — root application component and its styles.
- `src/pages/` — page-level components (currently the home page).
- `src/styles/` — page/component-specific stylesheets.
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

Run the server:

```bash
cd packages/server
bun run index.ts
```

Run the client:

```bash
cd packages/client
bun run dev
```

The server expects a MySQL database; use `scripts/database_table_creation.sql` to create the required schema, and configure connection details via the server's environment variables (see `packages/server/.env`).
