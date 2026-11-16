# HanziGo

A TypeScript Expo app for Android, iOS and web, with a local learning engine and an optional PostgreSQL API. This repository is a working development product, **not a complete official HSK course or a production-certified release**.

The supplied request ends at “21. P”. Sections 1–20 were used; any remaining specification has not been received.

The distinctive home and onboarding illustration was created for HanziGo. See `docs/DESIGN.md` for its prompt and design notes.

## Run the app

Requires Node 22.13+ (Node 24 used during implementation). On Windows, use `npm.cmd` / `npx.cmd` if PowerShell blocks npm.ps1.

```sh
npm install
npm run web
# or, for Expo Go / a development build:
npm start
```

The first launch offers language, goal, level, daily study target and a local demo. No account or backend is needed for lessons, vocabulary, reading, reviews, handwriting or analytics. Web defaults to port 8081. Open the local URL printed by Expo. On phones, scan Expo's QR code using a compatible Expo Go version, or create a native development build. SDK 58 requires compatible recent tooling; do not force an older Expo Go client.

All dependencies are installed at the repository root. `apps/mobile`, `apps/server` and `packages/core` separate responsibilities without requiring filesystem links, which this Windows sandbox disallows. Do not run a second dependency installation inside the app folders. The root lockfile is authoritative.

## Run the API and PostgreSQL

```sh
# Copy .env.example to .env. If changing the database password, update both
# POSTGRES_PASSWORD and the password embedded in DATABASE_URL.
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run server
```

The API defaults to port 4000 and allows `http://localhost:8081` and `http://127.0.0.1:8081`. Configure `CORS_ORIGINS` for your own origins. For a physical phone, copy `apps/mobile/.env.example` to `apps/mobile/.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN address (Android emulator: usually `http://10.0.2.2:4000`). Restart Expo after changing environment variables. Development HTTP is for a trusted local network; deploy behind HTTPS for real accounts.

`GET /health` reports API process and provider configuration, not a deep database health check. The server connects to PostgreSQL before listening. Startup fails explicitly if the database is unreachable. There is no production in-memory database fallback.

## Checks

```sh
npm run db:generate
npm run typecheck
npm test
npm run lint
npm run curriculum:validate
npm run format:check
npm run export:web
cd apps/mobile
npx expo install --check
```

See `docs/QA.md` for the checks actually run, results and device limitations. Tests use Node's test runner with tsx; API tests exercise HTTP behavior using a test-only repository. They are not evidence that a real PostgreSQL deployment has passed integration tests.

## Learning content

`data/curriculum/supplementary-v1/content.json` holds an original, AI-assisted development learning pack. All vocabulary, grammar, translations and character records have `needs-review` validation status. Level allocations and lesson organization are HanziGo pedagogical choices. They are **not verified membership in official HSK lists**, and the application states that clearly.

The architecture supports stages → levels → units → lessons → learning items → exercises, individually navigable target levels 1–9, and a shared official source range for advanced 7–9 material. Official-source verification, edition, retrieval date and licensing limitations are recorded in `docs/CURRICULUM_SOURCES.md`. See `data/reports/import-report.json` for actual imported counts after validation.

## Features available locally

- Four centralized interface dictionaries (English, 简体中文, العربية, Español), persisted language, explicit Arabic layout mirroring and preserved Mandarin/pinyin direction.
- Onboarding; daily targets; target-level switching; light/dark/system appearance.
- Search across Chinese, traditional forms, pinyin and all translations; level/topic/part-of-speech filtering; favorites; learned and difficult states.
- Reusable lesson player, introductory word/grammar cards, deterministic exercises, feedback, saved answers and resume position, completion only after all questions, results and mistake explanations.
- SM-2-style review queue, flashcards, shuffled study, due/difficult review and automatic supplementary assessments.
- Original reading practice with pinyin/translation toggles, tappable vocabulary, bookmarks, comprehension and completion records.
- SVG handwriting canvas with clear/retry, per-session self-assessment, stored strokes and dated practice history. No automatic handwriting grading or fabricated stroke-order metadata.
- Real progress derived from stored events, weekly chart, skill accuracy, streak and next reviews. Subjective ratings do not inflate automatic accuracy.
- Offline grammar guide with real explanations, examples and common mistakes for each target level.

## Dependencies that need configuration or further work

- **Official full HSK curriculum:** not imported. Acquire redistribution rights, obtain approved source data, add professional translation/language review, then import a new version. See the source and import docs.
- **Verified audio:** no licensed recordings shipped. Data accepts recording URLs and the app uses `expo-audio` for playback. Device Mandarin TTS is explicitly labeled synthetic and requires an installed Mandarin voice. No speech scoring is claimed. Verified listening-comprehension tasks cannot be imported without playable audio references.
- **AI:** configure `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` for an OpenAI-compatible `/chat/completions` endpoint. Keys remain server-only. Without a provider `/tutor` returns 503 and the offline grammar guide remains usable.
- **Password reset:** implement/connect a real transactional email webhook using `EMAIL_WEBHOOK_URL`, `EMAIL_WEBHOOK_TOKEN`, `RESET_APP_URL`. Without configuration, reset-request returns 503. It does not display a false success. Requests for unknown accounts get the same accepted response when email is configured. No email verification is implemented yet.
- **Notifications:** reminder delivery is not implemented; onboarding and Settings state this. No reminder scheduling button is presented as working.
- **Publishing:** no Apple/Google developer accounts, signing credentials, store listings or native artifacts are supplied. Native device accessibility, RTL and audio/drawing must be verified on hardware before release. Web previews do not establish native correctness.
- **Production operations:** configure TLS, backups, retention/export policy, monitoring, shared rate-limit storage, provider limits, email-domain verification, privacy/legal review and account verification as needed. No payment/subscription system was requested in the received sections.

## Security and synchronization

Passwords use salted scrypt. Sessions are random opaque tokens; only SHA-256 hashes are stored in PostgreSQL. Phone tokens use Expo SecureStore. Web tokens stay in memory and intentionally end on refresh; do not substitute localStorage for tokens. Each account's local learning history is isolated from the local demo. Demo history is not silently uploaded into an account.

Learning changes are immutable UUID events, persisted before synchronization, uploaded in batches, deduplicated per user and deterministically replayed. The server rejects conflicting reuse of an event ID. Unsynced changes remain on the device. A reset is an explicit confirmation and an event barrier, so earlier offline history does not resurrect progress after a merged reset. Earlier server events remain stored until account deletion; resetting is not an erasure request. UTC activity dates avoid changing history between devices; date labels use the chosen locale. Device clock accuracy matters. Preferences use last successful client upload; full per-field conflict resolution is not implemented.

Logout attempts to revoke the server session and always removes the local token. If offline, the unrevoked server token expires within 30 days. Password reset revokes all sessions. Deleting an account requires its password, cascades server records and removes its local profile data.

Original educational text is offered under CC BY 4.0. Code is provided for this project; no third-party curriculum license is implied. Dependency licenses remain their own.

## HSK reference vocabulary and pronunciation

The current app adds 11,000 independently transcribed Gushi reference entries across learner targets 1–9, alongside 36 original supplementary words. See `docs/CURRICULUM_SOURCES.md` and `data/curriculum/hsk3-gushi-2025/LICENSE.md` for counts, licences, the shared 7–9 source band, review status and redistribution caveats. The third-party data is not independently verified as complete official HSK content. Arabic/Spanish meanings, parts of speech and per-sentence-attributed examples are not supplied for those entries. The app labels English fallback and missing examples. Reference lessons and 22,000 exercises are app-generated study groupings based on the data, not official lesson titles.

Where no licensed recording is present, the pronunciation controls use the device's installed Mandarin voice. Normal, slow and two-repeat playback are available; voice availability depends on the device. See `docs/ANDROID.md` for the unbuilt APK profile and its prerequisites.
