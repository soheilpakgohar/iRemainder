# ADR 0001 — Shared password with SHA-256 hash + iron-session

- **Status:** Accepted
- **Date:** 2026-07-19

## Context

iRemainder is a single-store, single-operator tool. There is no need for
user accounts, roles, or registration — the store staff share one login.
The user explicitly asked for "a static predefined hash" for authentication.

The choice is how to implement that shared-password auth on the web without
introducing unnecessary infrastructure or security holes.

## Decision

We use a **single shared password** verified against a **precomputed
SHA-256 hash stored in an environment variable**, and issue a **signed
httpOnly session cookie via iron-session** on success.

- `OPERATOR_PASSWORD_HASH` (env) = `sha256(password)` as hex. The plaintext
  password is never stored. The operator types the password; the server
  hashes the input and constant-time-compares to the env hash.
- `SESSION_SECRET` (env) = a 32-byte random hex string used to sign the
  cookie.
- On success, iron-session writes a sealed `iremainder_session` cookie:
  `{ loggedIn: true, exp: <7d> }`, httpOnly, sameSite=lax, secure in prod.
- `src/proxy.ts` (Next.js "proxy", formerly middleware) reads the cookie on
  every request and redirects unauthenticated users to `/login`.
- Every mutation server action additionally calls `requireOperator()`.

## Alternatives considered

1. **NextAuth.js / Auth.js Credentials provider.** More infrastructure than
   a single shared password warrants. Its value (multi-provider, account
   model, DB sessions) is unused here and would add a dependency surface
   for no benefit. Easy to migrate to later if real accounts are needed.

2. **Plain cookie / localStorage flag** (no signed session). Rejected: a
   client-readable "loggedIn: true" flag is trivially forgeable. The whole
   point of the hash is to gate server-side mutations; the session must be
   unforgeable too.

3. **bcrypt / argon2 instead of SHA-256.** SHA-256 is what the user asked
   for ("static predefined hash") and is sufficient *because the hash is
   precomputed offline* — there is no online brute-force surface (the only
   input is one password, rate-limited by being a human at a keyboard). A
   slow KDF would add a dependency with no real security gain in this
   threat model. If the password were ever user-chosen-and-stored, we'd
   switch to argon2id.

## Consequences

- **Hard to reverse:** changing the auth scheme (e.g. to real accounts)
  touches `proxy.ts`, `lib/auth.ts`, `lib/session.ts`, and every server
  action's `requireOperator()` call. That's the cost of a real upgrade.
- **Surprising without context:** a future reader sees SHA-256 (not a KDF)
  and a shared password and may flag it as insecure. This ADR records that
  it's a deliberate fit for the single-operator, offline-hash threat model.
- **Operational:** changing the password means recomputing the hash and
  updating `OPERATOR_PASSWORD_HASH` in the deployment environment. Documented
  in `.env.example`.
