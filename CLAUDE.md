# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project layout

```
Property Management System/
├── frontend/   Next.js 14 App Router — port 4000, 100% mock data (no live API calls)
└── backend/    Express + Prisma/PostgreSQL — port 3000, production-ready REST API
```

The two packages are completely independent. The frontend does **not** call the backend yet — all data lives in `frontend/src/lib/mock.ts`.

---

## Commands

### Frontend (`cd frontend`)

```bash
npm run dev        # start dev server on :4000 (hot reload)
npm run build      # production build
npm run lint       # ESLint via next lint
```

### Backend (`cd backend`)

```bash
npm run dev              # ts-node-dev with hot reload
npm run build            # tsc → dist/
npm run lint             # ESLint src/**/*.ts

npm run db:generate      # regenerate Prisma client after schema change
npm run db:migrate       # create + apply migration (dev)
npm run db:migrate:prod  # deploy migrations without prompts (prod)
npm run db:seed          # seed from prisma/seed.ts
npm run db:studio        # Prisma Studio UI
```

Backend requires a `.env` file — copy `.env.example` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — minimum 64 chars
- `PII_ENCRYPTION_KEY` — exactly 64 hex chars (32 bytes) for AES-256-GCM

There are no test suites in either package.

---

## Backend architecture

### Module pattern

Every domain follows the same four-file structure:

```
src/modules/<domain>/
  <domain>.schema.ts      # Zod input schemas — parse at controller boundary
  <domain>.service.ts     # Business logic + Prisma queries — no HTTP concerns
  <domain>.controller.ts  # Thin: parse → call service → respond
  <domain>.routes.ts      # Wire middleware + controller handlers
```

Domains: `auth`, `dashboard`, `reservations`, `housekeeping`, `arrivals`, `departures`, `extensions/{agents,skills,instructions,hooks}`.

### Middleware chain

Applied in this order on protected routes:

```
authenticate  →  tenantGuard  →  requireRole(Roles.xxx)  →  controller
```

- **`authenticate`** — verifies JWT, attaches `req.user: { userId, propertyId, role }`
- **`tenantGuard`** — rejects requests where `:propertyId` URL param ≠ `req.user.propertyId`
- **`requireRole`** — checks `req.user.role` against an allowlist

Pre-built role sets in `src/middleware/rbac.ts`: `Roles.frontDesk`, `Roles.housekeeping`, `Roles.housekeepingManager`, `Roles.admin`, `Roles.any`.

### Multi-tenant isolation

Every Prisma query must include `propertyId: req.user.propertyId` in the `where` clause. For service-layer resource ownership checks (e.g. after a `findUnique`), call `assertTenantOwnership(sessionPropertyId, resource.propertyId)` — it throws `ForbiddenError` on mismatch.

### PII encryption

Guest `firstName` and `lastName` are **never** stored as plaintext. Always pass through `pii.encrypt()` before writing and `pii.decrypt()` / `pii.maskName()` when reading. The `pii` utility lives at `src/shared/utils/pii.ts`.

### Error handling

Throw `AppError` subclasses; the global `errorHandler` middleware converts them to the standard shape:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "...", "fields": {} } }
```

Available subclasses: `ValidationError` (422), `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409), `BadRequestError` (400).

### API conventions

All routes are prefixed `/v1/`. Responses wrap data: `{ data: ... }` for single resources, `{ data: [...], meta: { total, page, limit, totalPages } }` for lists. IDs are UUID strings.

---

## Frontend architecture

### Routing

All dashboard pages live under `src/app/dashboard/`. The root `/` redirects to `/login`. The dashboard layout (`src/app/dashboard/layout.tsx`) renders `<Sidebar>` + a flex column for the page content. Every page must include `<TopBar title="..." subtitle="..." actions={...} />` as its first child.

Add `'use client'` at the top of any page or component that uses state or browser APIs.

### Mock data

`src/lib/mock.ts` is the single source of truth for all frontend data. Confirmation numbers use the format `KEM-XXXXXX`. The property code is `KEM01`.

### Currency arithmetic

All monetary values are stored as **integer cents** (USD or EUR). Never use floats. Format for display with a local helper:

```ts
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
```

### Design system

The theme is a futuristic dark space/cyber aesthetic. Key tokens from `tailwind.config.ts`:

| Token | Value | Use |
|---|---|---|
| `space-950` / `space-900` / `space-800` / `space-700` | `#020811` → `#0F1F3D` | Backgrounds, surface levels |
| `cyber` (`#00CFFF`) | Cyan accent | Active states, highlights, borders |
| `neon.green` `neon.amber` `neon.purple` `neon.red` | Status colors | Success, warning, info, danger |

Reusable utility classes defined in `src/app/globals.css`:

- `card-cyber` — primary panel style with subtle cyan gradient border
- `glass-panel` — frosted glass surface
- `pms-table` — full-width table with dark headers and hover rows
- `btn`, `btn-cyber`, `btn-success`, `btn-danger`, `btn-ghost` — button variants
- `badge`, `badge-green`, `badge-amber`, `badge-cyan`, `badge-red`, `badge-gray`, `badge-purple` — inline status pills
- `status-dot`, `dot-green`, `dot-amber`, `dot-red`, `dot-cyan`, `dot-purple` — animated presence indicators
- `nav-item`, `.active` — sidebar navigation link
- `brackets` — corner bracket decoration via CSS `::before`/`::after`
- `animate-fade-in` — entry animation; apply to `<main>` on each page

### Domain enums (must match backend exactly)

```ts
type LoyaltyTier     = 'Club' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'None';
type ReservationStatus = 'InHouse' | 'Arrival' | 'Departure' | 'NoShow' | 'Canceled';
type DepositStatus   = 'Paid' | 'Pending' | 'Future';
// Housekeeping state machine: Dirty → Clean → Ready
// RBAC roles: FrontDeskAgent | HousekeepingStaff | HousekeepingManager | SystemAgent | Admin
```

---

## Database schema highlights

- `Room` uses a composite PK `(roomNumber, propertyId)` — no auto-generated ID.
- `Reservation.guestFirstName` / `guestLastName` are AES-256-GCM ciphertext strings (see PII section above).
- The Extensions engine (`Agent`, `Skill`, `Instruction`, `Hook`) is property-scoped. An `Agent` can have many `Skill`s via the `AgentSkill` join table, and optionally owns `Instruction`s and `Hook`s.
- `Hook.event` enum: `OnRoomStatusChange | OnCheckIn | OnCheckOut | OnReservationCreate | OnReservationCancel | OnNightAudit`.
- All tables have `created_at` / `updated_at` via Prisma's `@default(now())` / `@updatedAt`.
