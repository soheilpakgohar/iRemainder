# ADR 0002 — SQLite + Prisma for a single-store operator tool

- **Status:** Accepted
- **Date:** 2026-07-19
- **Supersedes note:** Pinned to **Prisma 6**, not 7. See "Why Prisma 6" below.

## Context

iRemainder tracks customers and installment due dates for one store. The
data is small (hundreds to low thousands of customers × a handful of
installments each), the access pattern is simple (read by date, toggle
paid, insert a plan), and there is a single operator. The store runs the
app locally (laptop / small server), not on serverless infrastructure.

## Decision

**SQLite** as the database, accessed through **Prisma ORM (v6)**.

- The database is a single file (`prisma/dev.db`), lives next to the app,
  and needs zero external services or network.
- Prisma gives a typed client, migrations, and a clean schema as the source
  of truth (`prisma/schema.prisma`).
- Connection pooling is handled by the Prisma client singleton
  (`src/lib/prisma.ts`) to survive Next.js dev hot-reload.

## Alternatives considered

1. **PostgreSQL (hosted, e.g. Neon/Supabas).** Stronger concurrency and a
   real server — but unnecessary here. There is one operator, no concurrent
   writers, and no multi-machine deployment. Postgres would add an external
   account, a connection string to manage, and a network dependency for a
   tool that could otherwise run offline. **Migration path is open**: the
   Prisma schema is database-agnostic — swap `provider = "sqlite"` for
   `"postgres"` and run a new migration.

2. **Static JSON / TypeScript seed file (no DB).** Read-only by nature.
   Marking installments paid, adding customers, editing the SMS template —
   none of that would persist without bolting on a write layer, which is
   just a worse database. Rejected for a real daily-use tool.

3. **Prisma 7 (latest).** v7 ships major breaking changes: driver adapters
   become **required** (e.g. `@prisma/adapter-better-sqlite3` for SQLite),
   the `url` moves out of `schema.prisma` into a `prisma.config.ts`, the
   `output` path becomes mandatory, and env vars aren't auto-loaded. For a
   local SQLite tool with no serverless/edge needs, that friction buys
   nothing. **v6's simpler pattern (`provider = "sqlite"`, `url = env(...)`,
   plain `import { PrismaClient }`) is battle-tested and has zero
   driver-adapter setup.** We pin to `prisma@^6`. When v6 enters maintenance
   we can migrate on our own schedule.

## Consequences

- **Hard to reverse (the DB choice):** all queries go through Prisma, so
  swapping to Postgres is mostly a schema + migration change — but the
  *choice to be local-first* means deployment assumes a writable local
  filesystem. Moving to a hosted DB also means revisiting backups and
  connection security.
- **Surprising without context:** a future reader might expect Postgres for
  a "real" app. This ADR records that SQLite is intentional and the
  Prisma-6 pin is intentional — both fit the single-operator, local-first
  threat and deployment model.
- **Backups:** the entire database is one file. Copying `dev.db` is a full
  backup. Document this in the README.
