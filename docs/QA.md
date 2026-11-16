# QA record — 2026-10-28

## Automated checks

- **25 tests passed**: spaced repetition (including early-review interval protection), deterministic replay, reset barrier, subjective versus automatic accuracy, input validation, CSV parsing, bundle validation, account registration/login/logout, secure hashing, isolated idempotent synchronization, CORS, invalid requests, password reset, deletion, and provider availability. HTTP tests use a test-only in-memory repository and a real local HTTP listener. Production uses Prisma/PostgreSQL.
- **TypeScript strict checks passed** for shared core, server and mobile sources. Prisma Client 6.19 generated from the supplied schema.
- **Expo SDK 58 dependency compatibility:** `expo install --check` returned “Dependencies are up to date.” The environment required `EXPO_NO_CACHE=1` because Expo's default user cache was outside the sandbox.
- **Curriculum JSON validation and CSV round-trip passed:** 36 vocabulary, 9 grammar, 9 characters, 9 populated levels, 9 units, 18 lessons, 459 stored exercise records and 9 readings. Zero records have verified validation status. See `data/reports/import-report.json`.
- **Expo exports passed for Android, iOS and web**, producing Hermes bytecode for both native platforms and a web bundle. The default sandbox temp directory denied Hermes output, so the successful retry set `TMP` and `TEMP` to a writable workspace directory. This is a bundling check, not an installed or signed app.
- **ESLint and Prettier checks passed.**

## Interactive browser checks

- English onboarding completed in local demo; Arabic selection immediately changed direction and labels.
- Dashboard showed zero initial activity. A wrong answer produced an explanation and the next question was locked until an answer was checked. Saving and reopening the lesson restored question 2 without marking the lesson complete.
- Arabic lesson showed Arabic meaning choices and correct-answer feedback; reload preserved both Arabic and the lesson answer.
- At a 390 × 844 viewport, lesson content and phone navigation rendered; More exposed vocabulary, progress, tutor, settings and account.
- Searching `zhengju` found `证据 / zhèngjù`; marking a favorite changed its icon without opening the word. A nested interactive-control issue discovered in this pass was fixed.
- The handwriting canvas accepted a drawn stroke and saved a dated, self-assessed practice session.

These checks do not establish complete accessibility conformance or native behavior. Test VoiceOver/TalkBack, dynamic text, RTL gestures, safe areas, offline restarts, keyboard behavior, native SecureStore/SQLite, installed Mandarin voices, drawing touch input, audio playback, account sync and background/foreground behavior on actual iOS and Android devices before distribution.

## Environment and outstanding tests

- Docker Desktop was installed but its engine was not running. A start attempt did not make the engine available. PostgreSQL migration, seed, Prisma-backed integration and multi-device synchronization were therefore **not run**. Run them against a disposable real PostgreSQL database before relying on accounts.
- Native JavaScript bundles exported successfully. An Expo bundle is not an installed app, signed build, store release or physical-device test.
- No configured transactional email provider, AI provider, licensed recording set, stroke-order source, or independently reviewed official curriculum was supplied. Their dependent behavior remains explicitly unavailable or supplementary.
- The Expo server used a fallback React Native DevTools after an environment-specific download/rename error; it did serve the app and UI testing proceeded. This does not validate production native DevTools.
- Preferences sync uses last successful upload, not per-field conflict resolution. Event ordering uses client UTC timestamps; significant device-clock errors can alter replay order.
- Reset hides earlier events from progress using a synchronized barrier. It is not data erasure; earlier server events are retained until account deletion.
- Rate limits are process-local; a production deployment needs a shared rate-limit store, stronger operational controls and a security review.

## Refinement verification — 2026-10-28

- 26 automated tests passed, including validation of all reference records, unique IDs, source bands and missing fields; strict TypeScript and Expo dependency compatibility passed. ESLint and formatting checks were run.
- Web preview: reviewed the preserved dashboard at 1440×900, HSK cards at 768×1024, vocabulary at 390×844, and dark appearance. Searched 包子, opened its reference detail, confirmed missing-example and device-voice labels, opened a generated lesson and verified an incorrect answer showed feedback and remained recorded. Actual voice output was not verified on an Android or iOS device.
- The Android preview APK profile is present but no APK was built: Android SDK/adb and Gradle are absent, installed Java is 8, and no configured Expo build account/signing setup is available. `docs/ANDROID.md` explains next steps and the unverified EAS upload layout. Native-device, RTL and accessibility checks must be repeated for this refinement on target devices.
- Source-based exercises are generated from the reference English meanings and pinyin. Source-sentence attribution is insufficient to bundle examples; no Arabic/Spanish translations, grammar, POS or recorded audio were invented for reference rows.

- Updated Android Hermes/JS export succeeded; it is not an APK. `npm audit --omit=dev` reports 12 dependency advisories (7 high, 5 low), including Zod and transitive Expo/Prisma tooling. Some suggested fixes require major dependency changes. These have not been remediated or assessed for exploitability; review and resolve them before production deployment instead of applying a blind forced upgrade.
- Added accessible device-voice buttons directly on vocabulary cards. In the browser used for testing, no Mandarin voice was installed and the control correctly displayed the missing-voice message; actual playback still requires testing on a device with a Mandarin voice installed.
