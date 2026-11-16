# Android preview APK — HanziGo

## Build status

The `preview` profile in `apps/mobile/eas.json` requests an internal, installable Android APK. The profile is not itself an APK. The app is now linked to the configured Expo account; the EAS CLI reported that Android signing credentials were created. Keep the Expo account and its credentials accessible for future updates. This machine does not currently have Android SDK/adb or Gradle and has Java 8; cloud EAS is the intended route. See the build result recorded in `PROJECT_PROGRESS.md`.

The source archive is a multi-directory project. Mobile is `apps/mobile`; the application imports `packages/` and `data/`, and the root `package-lock.json` is authoritative. On EAS the `eas-build-pre-install` hook runs `npm ci` at the repository root. To include the full repository in an EAS no-VCS archive, set `EAS_PROJECT_ROOT` to the **absolute repository root**, set `EAS_NO_VCS=1`, and run EAS from `apps/mobile`. `.easignore` excludes node_modules and environment files. The EAS archive was inspected and contains the root lockfile, mobile lockfile, shared code and all 11,000 reference entries; environment files and node_modules were excluded. The cloud result must still be checked before claiming an APK.

From the extracted repository root in Windows PowerShell:

```powershell
npm.cmd ci
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
Set-Location apps/mobile
npx.cmd eas-cli@latest whoami
# If not authenticated: npx.cmd eas-cli@latest login
# Link/create the intended project in the signed-in Expo account:
npx.cmd eas-cli@latest init
# Inspect the uploaded file tree before the first build (choose a new output path):
npx.cmd eas-cli@latest build:inspect --platform android --stage archive --output ..\..\eas-archive-check
npx.cmd eas-cli@latest build --platform android --profile preview
```

EAS can request a project selection or Android signing keystore; choose/create them in your own account. Do not send passwords or tokens through chat. No Google Play publication is involved. `com.hanzigo.learning` is the current Android identifier; verify that it is suitable for your own project/account and does not conflict with an existing app before creating credentials. Keep signing credentials safe to allow future updates.

## Installation et partage — darija

Mlli build EAS ykml, télécharge l'APK men lien dyal EAS, puis siftou l téléphone (USB, Drive ou message). F téléphone, 7ell fichier APK w ila Android talab permission dyal **install unknown apps**, 3tiha ghir l'application li 7ellti biha fichier. Kmmel installation, puis 7ell HanziGo. T9der tsift nafs APK l s7abk; kol wa7ed ghadi ykoun 3ando progress local dyalou. APK ma kayt7tajch Play Store.

Sans serveur, l'onboarding local, les leçons, le vocabulaire, les exercices et les révisions utilisent les données embarquées et SQLite. La voix Mandarin dépend d'une voix installée sur le téléphone. Les comptes, la synchronisation, la réinitialisation du mot de passe et le tuteur connecté exigent un serveur configuré et joignable ; `localhost` sur un téléphone désigne le téléphone lui-même. Les rappels ne sont pas configurés. Tester sur un appareil réel avant de partager, y compris démarrage hors ligne, reprise de progression et audio.

Les données de référence ont une licence et des limites de vérification décrites dans `docs/CURRICULUM_SOURCES.md` et `data/curriculum/hsk3-gushi-2025/LICENSE.md`; les droits sous-jacents doivent être examinés avant redistribution commerciale.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/), [project upload](https://docs.expo.dev/build-reference/project-upload/), [monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/).

Latest attempt: the project was linked and the build was submitted to EAS with the preview APK profile. Track build f0a5d9ba-1d14-48cc-96ae-18539010ca6c in the Expo dashboard. A build submission is not a completed APK. The final isolated prebuild succeeded, with INTERNET and VIBRATE present and legacy storage/overlay permissions marked for removal. See `PROJECT_PROGRESS.md` for the final outcome.
