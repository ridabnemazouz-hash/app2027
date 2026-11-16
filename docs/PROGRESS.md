# HanziGo development progress

Living document. Baseline audit: `docs/BASELINE_AUDIT.md`.
Sync contract: `docs/SYNC.md`. Nothing here is pushed or deployed;
all work is local commits on top of the imported commit `7ddad55`.

## Completed

**First pass (audit fixes)**

- Tutor requests: 30s client timeout (server provider allows 20s);
  tutor sends the level selected on its screen.
- Reset tokens are deleted when reset-email delivery fails.
- Optional `TRUST_PROXY` (off by default) for rate limiting behind
  a reverse proxy.
- Word of the day rotates by UTC day; Home gained Listening and
  AI Tutor shortcuts.

**Stage 1 — Sync, auth, sessions** (`docs/SYNC.md`)

- Delta sync: clients send a cursor and receive only newer events
  plus conflicting stored versions and the new cursor.
- Documented conflict strategy: events are immutable, first stored
  version wins, conflicts are reported (never a batch-wide 409), and
  the client repairs its local copy and clears the event from
  pending — a conflicting event can no longer poison uploads.
- Event `skill` restricted to a closed enum; expired sessions are
  deleted on first use after expiry and pruned at startup + every
  6h; regression tests for delta sync, batch poisoning, expiry,
  pruning, and unknown skills.

**Stage 2 — Vocabulary and practice**

- Topic / part-of-speech filters gained explicit "No topic
  recorded" / "No part of speech recorded" options plus a visible
  note when a filter excludes unclassified (reference) entries.
- New Matching practice mode (4 pairs per round, ordinary answer
  events, first-try accuracy).

**Stage 3 — Listening Lab**

- Dedicated lab from the level's example sentences and reading
  paragraphs (8 items/level): device-voice or recorded playback,
  meaning questions, transcript reveal after answering, session
  summary; answers recorded as `listening` skill events.

**Stage 4 — French and Japanese**

- Complete fr/ja interface translations (362 keys × 6 locales,
  parity enforced by test). Curriculum content is NOT translated:
  core splits `Locale` (6) from `ContentLocale` (en/zh/ar/es) and
  fr/ja read English content through an explicit fallback.

**Stage 5 — Practice exams**

- Core exam engine with a documented 300-point model (Listening /
  Reading / Grammar & Vocabulary, 100 each, proportion-scaled),
  built only from real shipped content (25 questions/level).
- Exam screen: instructions + "not an official HSK exam"
  disclaimer, 30-minute countdown with auto-submit, navigation
  grid, unanswered-submission safeguard, section breakdown, full
  answer review, attempt history, on-device draft restore after
  interruption. Attempts sync as single `exam` events.

**Stage 6 — Speaking**

- Listen–record–replay lab (expo-audio): permission handling with
  clear denial/unsupported states, self-assessment only — no
  pronunciation scoring exists or is claimed. Only the current
  sentence's recording is kept, in the device temp cache.

**Stage 7 — Writing**

- Character picker for all 9 characters (was: only the target
  level's one); saved drawings listed per character and replayed
  stroke by stroke. No stroke-order data exists; the "not
  verified" notice remains.

**Pack 3 — Character stories and radicals (learning only)**
- Story card for each of the 9 stored characters, anchored by a
  seal-inspired 汉 mark: component tiles that assemble into the
  full character plus an original mnemonic story. Components and
  stories are HanziGo-authored learning aids
  (`apps/mobile/src/character-stories.ts`), labelled "Memory aid —
  not etymology" in all 6 locales; the pack's radical/stroke data
  remain null and are never presented as verified.
- Build-the-character practice: tap components in order to
  assemble; completion records one writing answer event, correct
  only on a first-try assembly.
- Similar-character discrimination from shipped data only: find
  the supplementary word containing the shown character; a test
  proves every round has exactly one correct option.

**Stage 8 — AI Tutor**

- Explain / Correct-my-sentence / Conversation presets, session
  transcript (not persisted), deliberate user-tapped retry that
  re-sends the exact failed payload; nothing retries automatically.

## Test results (this environment)

- `npm run typecheck`: 0 errors (core, server, mobile).
- `npm test`: 44/44 passing (baseline was 26).
- `npm run lint`, `npm run format:check`,
  `npm run curriculum:validate`: passing.
- `npm run export:web`: builds.
- NOT verified: real PostgreSQL integration (server tests use the
  in-memory repository implementing the same contract), real email
  or AI providers, microphone recording on a device, and any
  browser/device flow (the cloud browser cannot reach this
  machine's localhost; see baseline audit).

## Remaining priorities

1. PostgreSQL integration tests against an isolated test database.
2. Curriculum content review and depth: all records remain
   `needs-review`; reference entries are English-only with no
   examples/traditional/POS/audio; fr/ja content translation.
3. Licensed audio recordings and licensed stroke-order data
   (external purchases/licences — not fabricated).
4. Accessibility pass beyond current labels: keyboard focus order
   on web, reduced-motion, text scaling audit on devices.
5. Monetization architecture (test-only, disabled) — prices are
   documented intent (Plus 39 MAD/mo, annual 299 MAD/yr, credit
   packs 15/29/49 MAD, rewarded ads only). No billing, ads, or
   purchases may be activated without explicit approval.
6. Release configuration: production email provider, AI provider
   keys, database hosting/backups, CORS/TLS, store signing.

## External blockers

- Transactional email service account and verified sender domain.
- AI provider account/keys for end-to-end tutor verification.
- Licensed audio and stroke-order datasets.
- PostgreSQL instance for integration tests and production.
- Apple/Google store accounts and signing material.
- A reachable staging URL for browser flow verification.
