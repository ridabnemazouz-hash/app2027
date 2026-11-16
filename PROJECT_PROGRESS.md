# HanziGo implementation progress

## Workspace inspection — 2026-10-28

- Workspace contains only empty `outputs/` and `work/`; no existing app or branding found.
- No applicable AGENTS.md found. Node 24 is installed; use npm.cmd because PowerShell script execution is restricted.
- Project deliverable: `outputs/HanziGo/` (mobile, shared learning engine, curriculum tools, PostgreSQL backend, documentation).
- Requested specification ends at `21. P`; implementing sections 1–20 received.

## In progress

1. Verify official HSK source, edition and rights; avoid unsupported official-content claims.
2. Build Expo mobile/web app with offline persistence, localization, reusable learning flows and real progress.
3. Build secure backend, schema, migrations, importer and tests.
4. Run compatibility, type, unit/integration and UI checks; document actual content coverage and remaining dependencies.

## Implementation checkpoint

- Added versioned curriculum schema, JSON/CSV validation/import reports, original supplementary bundle across all 9 target levels, reusable exercises, SM-2 scheduling and deterministic event replay.
- Added Expo Router screens, 304 translation keys across English/Chinese/Arabic/Spanish, explicit Arabic row/text direction, light/dark themes, SQLite/native and localStorage/web persistence.
- Added onboarding, dashboard, curriculum, vocabulary, lesson resume, reading comprehension, reviews, assessments, SVG handwriting, analytics, account/settings and offline grammar tutor.
- Added Express/Prisma/PostgreSQL backend, migration/seed, scrypt password hashing, hashed opaque sessions, user-isolated sync, reset-email and AI provider interfaces.
- npm workspace symlinks are blocked by the Windows sandbox. Changed to one root dependency installation with relative shared-code imports; source modules remain separated.
- Docker is installed but was not running. Attempting to start it for database verification.
- Official alternate PDF cover/contents verified: publication 2025-11, implementation 2026-07; source groups advanced levels 7–9. No official content redistributed.
- Validation and UI checks still pending; implementation is not yet declared production-ready.

## Verification checkpoint

- Expo SDK 58 compatibility check reports dependencies up to date; Prisma Client generation succeeded.
- Shared, server and mobile strict TypeScript checks succeeded. 25 engine/API tests passed; JSON and CSV imports validated. Web production export succeeded.
- Browser checks covered onboarding in English and Arabic, answer feedback, resume and reload persistence, phone navigation, search, favorites and drawing save. Fixed an entry-point resolution issue, nested buttons, RTL arrows and web SQLite export during verification.
- PostgreSQL migration/seed and real database integration remain untested: Docker Desktop's engine is not running. No iOS or Android hardware was available. Expo Android and iOS Hermes bundles and the web bundle exported successfully after setting a writable workspace temp directory. This is not an installed or signed build.
- Source pack contains 36 supplementary words, 9 grammar records, 9 character records, 9 levels, 9 units, 18 lessons, 459 stored exercises and 9 readings. Zero records are verified; all need independent language review. No official syllabus content or licensed recordings is bundled.
- Email delivery, AI provider, reminders and official curriculum licensing require external setup; app UI does not pretend these are configured.
- ESLint and Prettier checks passed. Account restoration uses the cached local profile while offline, with secure phone tokens; web tokens remain memory-only.
- Follow-up design refinement: added a custom transparent paper-sculpture illustration, a high-contrast charcoal lesson card, refined card shadows and a compact three-metric mobile layout. Rechecked the phone-size dashboard and Arabic layout in the browser. Design provenance and prompt are in `docs/DESIGN.md`.

## Content policy

Official syllabus PDF retrieval initially timed out. Website groups advanced vocabulary as 7–9. Redistribution rights have not been established. Original supplementary content will be explicitly labeled, with level assignments identified as pedagogical rather than official.

## 2026-10-28 refinement

Preserved existing navigation, layout, progress identifiers, supplementary material, and branding. Added a CC BY-SA third-party reference vocabulary set (11,000 entries; not independently verified as complete official coverage), deterministic pedagogical reference lessons and exercises, source and missing-translation notices, pagination, pronunciation repeat, real derived dashboard XP and achievements, weekly activity, and refined existing light/dark colors and icons. See `docs/CURRICULUM_SOURCES.md` and the dataset licence. Arabic/Spanish meanings and sentence examples are not available for those reference entries. Validation is in progress.

- Verification update: 26 automated tests passed; strict TypeScript, Expo compatibility, lint and formatting were checked. The updated Android JS/Hermes bundle exported successfully but is not an APK. Browser checks covered mobile, tablet, desktop, dark mode, reference search/detail, and generated-lesson feedback. `npm audit --omit=dev` reported 7 high and 5 low advisories; these need review before deployment. Android SDK and compatible JDK / Expo account and signing setup are unavailable in this environment. See `docs/ANDROID.md` and `docs/QA.md`.

## 2026-10-28 Android APK request

The supplied source ZIP was verified against the existing project. EAS preview profile already requests an internal APK. Added the EAS pre-install hook that installs root dependencies, a repository-root `.easignore` excluding environment files, `expo-system-ui` SDK-compatible `~58.0.7`, and Android blocked-permission entries for legacy external storage and system overlay. A prebuild in an isolated copy succeeded before these last permission changes; re-run prebuild and inspect the final merged Android manifest after sufficient disk space is restored. Expo's prebuild warned that its template recommends React Native 0.88.1 while the installed SDK-compatible dependency check accepted 0.88.0; no upgrade was performed. Expo SDK dependency check, strict typecheck, lint, 26 automated tests and supplementary curriculum validation passed. The import report confirms 36 supplementary vocabulary records; the independent reference test validates the separate 11,000-entry dataset. Icon: 1024×1024 PNG; Android package: `com.hanzigo.learning`.

A stored Expo session was verified by EAS CLI. `eas project:info` did not complete before being stopped. The source app does not yet contain an EAS project ID. At the start 8.1 GiB were free; available C: space fell below 0.4 GiB, so the attempted CLI installation and native inspection were stopped to avoid ENOSPC. No EAS cloud build was submitted and no APK was produced. The user must restore space, then the project must be linked to the intended account, its EAS archive checked, signing credentials configured, and the cloud build started. No user files were deleted.

## Android build submission

Disk space recovered to approximately 2.2 GiB; Expo dependency compatibility passed. Isolated Android prebuild succeeded after adding expo-system-ui, with legacy storage and overlay permissions marked for removal; INTERNET and VIBRATE remain. EAS project linked to the signed-in account, a mobile package-lock was generated for the EAS lockfile requirement, and the root-dependency hook and full EAS archive were inspected (including 11,000 reference records). EAS reports Android signing credentials created and build `f0a5d9ba-1d14-48cc-96ae-18539010ca6c` submitted using preview/internal APK profile. Initial status IN_QUEUE; a submitted build is not an APK.
