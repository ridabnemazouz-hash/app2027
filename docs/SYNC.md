# HanziGo synchronization protocol

Learning history is an append-only list of immutable events
(`packages/core/src/schema.ts:eventSchema`). This document is the
contract between the mobile client (`apps/mobile/src/state.tsx`) and
the API (`POST /sync` in `apps/server/src/app.ts`, storage in
`apps/server/src/repository.ts`).

## Identities and isolation

- Events belong to exactly one account. The server derives the user id
  from the session token; a client can never name another user.
- The event primary key is `(userId, eventId)`, so the same UUID may
  exist under different accounts without collision.
- Guest ("demo") progress lives in a separate local profile and is
  never uploaded. Signing in loads the account profile; the demo
  profile is not merged into it.

## Upload

- The client persists every event locally **before** attempting an
  upload, and keeps unacknowledged event IDs in a per-profile
  `pending` queue. Events survive restarts and reconnects.
- Uploads are batches of at most 500 pending events:
  `POST /sync { events, cursor }`, where `cursor` is the last sync
  position the server returned for this profile (or `null` on the
  first sync). Retrying a batch is always safe: storing an event that
  is already stored with an identical payload is a no-op
  (idempotent).
- Events more than 5 minutes in the future are rejected (400
  `FUTURE_EVENT`); the batch is not stored.

## Conflict strategy: first stored version wins

Event IDs are random UUIDs, so a conflict — the same ID arriving with
a _different_ payload — means a client bug or tampering, never a
legitimate edit (events are immutable by design).

- The server keeps the **first stored version** and does **not**
  fail the batch. The rest of the batch is stored normally, so one
  bad event can never poison future uploads.
- The response lists the conflicting IDs in `conflicts` and includes
  their stored versions in `events` (even when they fall before the
  client's cursor), so the client can repair its local copy.
- The client (`mergeServerEvents` in `packages/core`) replaces its
  local copies of conflicting IDs with the stored versions and
  removes those IDs from `pending`. Derived progress is then
  replayed from the repaired history.
- Payload comparison uses a canonical (key-sorted) JSON form,
  because JSONB storage does not preserve key order.

## Delta download

- Stored events are ordered deterministically by `(occurredAt,
eventId)`. A **cursor** is the `{ at, id }` pair of one position in
  that order.
- The response contains only events strictly after the request
  cursor, plus any conflicting stored versions described above.
- The response `cursor` is the position of the newest stored event
  (or the request cursor when nothing is stored). The client saves
  it in its profile and sends it on the next sync.
- Omitting the cursor returns the full history (first sync and
  older clients).

## Sessions and expiry

- Session tokens are opaque, stored SHA-256-hashed, and valid for
  30 days. There is no sliding renewal.
- An expired session is rejected and its row is deleted on first use
  after expiry (lazy cleanup). The server also prunes expired
  session and password-reset rows at startup and every 6 hours
  (`pruneExpiredAuth`).
- Logout revokes the current session; a password reset revokes all
  sessions; account deletion cascades to sessions, resets, and
  events.

## Known limitations

- Preferences use last-successful-upload wins; there is no per-field
  conflict resolution.
- A `reset` event is a progress barrier on every device: earlier
  history stays stored server-side (until account deletion) but is
  excluded when progress is derived.
- There is no server-side plausibility check on a user's own events;
  a modified client can fabricate its _own_ progress. No server
  rewards depend on it.
