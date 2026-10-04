# PL Handover 2 of 2: Phase 2 Tasks (DSS Wearables)

**Audience:** the AI coding assistant (**OpenAI Codex**) running on **PL's Mac**. Section 0.5 of `PL_1_SETUP_AND_CONTEXT.md` (Codex operating rules) applies to every step.
**Prerequisite:** every item in the Setup Checklist of `PL_1_SETUP_AND_CONTEXT.md` (section 12) is ✅. **If not, stop.**
**Goal:** replace the mock data behind Tarun's approved UI with real Firebase and real Bluetooth, working on **both iOS and Android**, then hand back a pull request.

---

## 0. Rules (repeated on purpose: obey them in every step)

1. **Kevin's repo (`../DSS-wearable-App`) is READ-ONLY.**
   - Allowed: reading, `git fetch`, `git log`, `git show`, `git diff`, `git branch -r`, `git ls-tree`, `git status`.
   - Forbidden: editing, checkout/switch/pull/merge/reset/stash/commit/push/tag, `npm`/`npx` commands, builds.
   - Read branch files with `git -C ../DSS-wearable-App show origin/feature/ble-connection:<path>`.
   - After every step, `git -C ../DSS-wearable-App status` must be clean. If not, **stop and tell PL.**
2. **All changes go into Tarun's repo (`DSS-iOS-UI`), on branch `phase-2` only.**
   - Never commit to `main`.
   - Push only `phase-2`, only to `origin`, only when PL asks.
   - Never force-push, rebase or amend pushed commits, or delete branches or tags.
3. **Never commit secrets or generated folders:** `google-services.json`, `GoogleService-Info.plist`, `.env`, `/ios`, `/android`. Run `git status` before every commit.
4. **Don't redesign the UI.** Swap data sources (containers, hooks, stores, services) only. Screens stay presentational. Any needed UI change: propose it and **stop for Tarun's approval**.
5. **Shared data compatibility.** Kevin's Android app still uses the same Firestore. You may **only add** optional fields or new collections. Never rename, remove or retype existing fields. Docs without the new fields must still work.
6. **Never change Firestore security rules or Firebase console settings** yourself. If rules block something, report it and stop; PL coordinates with Kevin/Jared.
7. **Packages:** `npx expo install <pkg>` only. After adding a native package, run `npx expo prebuild --clean` for the platform before building.
8. **Data honesty:**
   - No estimated or derived values. Distance, Floors and Calories stay "--" unless a device actually reports them.
   - Test data is always labelled "Test data" and never counts towards device stats.
   - Battery/model/firmware show "Not reported" when the device doesn't expose them.

## 1. How every step works

For **every** numbered step below:
1. Do only that step.
2. `npm run typecheck` must be clean.
3. Confirm Kevin's repo is clean and no secrets are staged.
4. Commit on `phase-2` with the message given (or a clear one if none is given).
5. Append a Progress Log entry in `claudephase2charter.md`:
   - date, step, what changed
   - files ported (**Kevin's path → our path**)
   - fixes made, open issues
6. Give PL a short **click list**: exactly what to tap and what should happen, and on which device (simulator, iPhone, Android emulator or phone).
7. **STOP** and wait for PL to say the step is approved.

The **⛔ STOP** markers below are mandatory stops, even if the step went perfectly.

## 2. Test matrix (where each kind of work is tested)

| Work | iOS | Android |
|---|---|---|
| Firebase / auth / Firestore | iOS Simulator (`npx expo run:ios`) | Emulator (`npx expo run:android`) if Android Studio is on this Mac; otherwise Tarun tests on Windows after PL pushes |
| Bluetooth | **Physical iPhone** (`npx expo run:ios --device`) | Physical Android phone over USB if available; otherwise Tarun |
| Background recording | Physical iPhone, locked screen | Physical Android phone |

Test BLE hardware: a standard BLE heart-rate chest strap, or nRF Connect advertising a Heart Rate service (0x180D).

---

## STEP A: Firebase (auth, profile, Firestore). No Bluetooth changes.

### A1. Re-verify config (no code changes)
- Confirm both config files are present, correctly named, from `wearable-app-f9d83`, gitignored and untracked (same checks as Setup step 7).
- Re-read Kevin's auth/Firestore code on `origin/feature/ble-connection`, using the **Android Wiring Map** in the charter's Progress Log (Task 0) to find the files.
- List the exact functions you'll port and their paths.
- No commit needed if nothing changed. ⛔ **STOP**: show PL the list.

### A2. Install Firebase packages
- `npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-google-signin/google-signin expo-dev-client expo-build-properties`
- Commit: "Phase 2 A2: install Firebase packages".

### A3. Configure `app.json` (merge; don't remove existing config)
- `expo.ios.bundleIdentifier` = **`com.galaxies.firebase`**
- `expo.ios.googleServicesFile` = `./GoogleService-Info.plist`
- `expo.android.package` = **`com.dsswearablecool.firebase`**
- `expo.android.googleServicesFile` = `./google-services.json`
- Add to `plugins`, keeping every existing plugin (splash screen, image picker, fonts, etc.):
  - `@react-native-firebase/app`
  - `@react-native-firebase/auth`
  - `["expo-build-properties", { "ios": { "useFrameworks": "static" } }]`
  - `["@react-native-google-signin/google-signin", { "iosUrlScheme": "<REVERSED_CLIENT_ID from GoogleService-Info.plist>" }]`
- Keep `supportsTablet: false`, the icon, the splash and `name: "DSS Wearables"`.
- `npx expo config --type public` must resolve.
- Commit: "Phase 2 A3: Firebase app.json config".

### A4. SHA-1 for Google sign-in on Android
- **If Java + the Android SDK are available on this Mac:** run `npx expo prebuild --platform android --clean`, then `cd android && ./gradlew signingReport`, and show PL the **debug** variant's SHA-1.
  - Alternative: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`.
- **If not available:** say so. Android Google sign-in will be tested by Tarun.
- In both cases, remind PL: **Tarun must also add his own Windows SHA-1** for his Android builds.
- **Don't commit** the `android/` folder.
- ⛔ **STOP and wait for PL to say "SHA-1 added".** PL adds it in Firebase Console → `wearable-app-f9d83` → Project settings → Your apps → Android app → Add fingerprint, re-downloads `google-services.json`, and replaces the file (exact name).

### A5. Port the auth service
Port Kevin's logic into `src/` (adapt it to `@/` imports and Tarun's structure: services in `src/lib/` or `features/auth/`). It must provide:
- **register:** create the auth user, create the `users/{uid}` profile (same field names and types as Kevin's), store avatar data the way Kevin does under `users/{uid}/private/…`, send the verification email, sign out
- **login:** blocks unverified email/password users (show the existing "Please verify your email" state)
- **Google sign-in and sign-up:** `GoogleSignin.configure` with the web client ID (the `client_type: 3` entry in `google-services.json`), as Kevin does
- **forgot password:** reset email
- **change email:** verification-based, as Kevin does
- **change password:** reset email, as Kevin does
- **logout**, and the auth state listener / session

Record every ported file (**Kevin's path → our path**). Commit: "Phase 2 A5: port auth service".

### A6. Fix Kevin's Google bugs (from `ANDROID_BUGS.md`): don't copy them
- Google sign-in **creates** `users/{uid}` if it's missing (fill the name from the Google profile, other fields empty).
- Google sign-up **never overwrites** an existing `users/{uid}`. Use a merge or existence check.
- Google users get a working avatar: the Google photo if available, otherwise initials. Never a permanent "?".

Log each fix under "Fixes for the Android team". Commit: "Phase 2 A6: fix Google profile bugs".

### A7. Profile and avatar on Firestore
- Profile read/write (`users/{uid}`: name, height, weight, stored in cm/kg, unchanged) and avatar save/load (Kevin's `private` sub-collection format).
- Replace the mock `accountService` / `ProfileProvider` data source. Screens unchanged.
- Commit: "Phase 2 A7: Firestore profile and avatar".

### A8. Alert thresholds on Firestore
- `users/{uid}/settings/alerts` = `{ enabled: boolean, hrMin: number, hrMax: number, updatedAt }`. This is a new doc, so it's allowed.
- Defaults when missing: enabled `true`, hrMin `50`, hrMax `120`.
- Keep the existing validation rules.
- The alert **history** (Notifications screen) stays local for now. Step B5 decides its final storage.
- Commit: "Phase 2 A8: alert thresholds in Firestore".

### A9. Swap containers and remove the JS SDK
- Point every auth/profile container and hook at the new services. **Screens and previews unchanged.** Previews keep using mocks.
- Remove the `firebase` JS SDK (`npm uninstall firebase`), `src/lib/firebase.ts`'s `.env` config, and `.env.example` if it only held Firebase keys.
- Make the **"Preview the dashboard"** bypass `__DEV__`-only. It must never appear in a release build.
- Bluetooth stays on the **mock** `BleProvider` in Step A.
- Commit: "Phase 2 A9: real auth wired, JS SDK removed".

### A10. Build and run
- iOS: `npx expo prebuild --platform ios --clean`, then `npx expo run:ios` (Simulator). Fix build errors (pods: `cd ios && pod install --repo-update`).
- Android (if available): `npx expo run:android` on the emulator.
- Commit any fixes: "Phase 2 A10: build fixes".

### A11. Step A test, then ⛔ STOP
Give PL this click list, for iOS Simulator and Android emulator if available:
1. Register a new account. In the Firebase Console, confirm the user (Authentication) and the `users/{uid}` doc (Firestore) with the right fields.
2. Log in before verifying → "Please verify your email". Verify via the email link → log in works.
3. Forgot password → reset email arrives.
4. Google sign-in with a **new** Google account → profile doc created, avatar shows the photo or initials.
5. Google sign-in with an **existing** account → profile **not** overwritten.
6. Profile edit: change name, height and weight → saved. Change the avatar → saved. Kill and reopen the app → still there.
7. Change email and change password flows.
8. Alert Thresholds: change and save → `users/{uid}/settings/alerts` updated. Reopen → values kept.
9. Log out → back to sign-in. Relaunch → stays signed out. Log in → stays signed in after relaunch.
10. **Shared data:** log in with the same account on Kevin's Android app (if anyone has a build) → same profile.

When PL approves Step A, remind PL to `git push -u origin phase-2` and tell Tarun, so Tarun can test Android on Windows (after adding his own SHA-1).

---

## STEP B: Bluetooth, data and alerts

### B0. Plan first: no code. ⛔ STOP for PL **and Tarun** approval
1. `git -C ../DSS-wearable-App fetch`. Report any new commits on `feature/ble-connection` or `main` since the Task 0 reading (`e65c84b`, 2026-10-02), and update the Wiring Map if the BLE code changed.
2. Write a **"Phase 2 Step B plan"** section into `claudephase2charter.md` covering:
   - **a. Architecture:** how Kevin's single-connection `BleService` / `BleContext` becomes **multi-device**:
     - a per-device connection map
     - per-device handshake, monitors and reconnect timers
     - multi-device auto-connect
     - how the existing `useBle()` consumers (Dashboard, Devices tab, Device Detail) get per-device state without screen changes
     - practical concurrent-connection limits on iOS and Android, and what the UI does at the limit
   - **b. iOS rules** (from the charter's "Phase 2: BLE on iOS"):
     - platform-neutral device key (no MAC on iOS; name + service UUID + iOS peripheral UUID)
     - Android-only code (GATT 133 handling, `requestMTU`, bonding) guarded by `Platform.OS === 'android'`
     - `Unauthorized` vs `PoweredOff`
     - device-initiated pairing
     - 0x180D-filtered + unfiltered scan passes
     - permission strings
   - **c. Readings data model, compatible with Kevin's app:**
     - keep writing Kevin-compatible documents to Kevin's existing readings collection, in his exact format, so his Android app still works
     - **also** write full-resolution data to a **new** collection, e.g. `users/{uid}/reading_batches/{autoId}` = `{ deviceId, platform, type: 'heart_rate'|'steps'|…, source: 'ble'|'test', startAt, endAt, samples: [{ t, v }] }`, flushed about every 60 s per device (or on disconnect or background)
     - justify against Firestore write limits/costs: one write per device per minute, not one per sample
     - offline behaviour (Firestore's offline cache queues writes)
     - show the final document shapes
   - **d. Connection event log:**
     - events: connect attempt, connected, disconnected (reason user/unexpected), failed, app background/foreground
     - each with timestamp + `deviceId`
     - persisted with AsyncStorage (bounded size; say how)
     - optional additive summary fields on `users/{uid}/devices/{deviceId}` (e.g. `lastRssi`, `platform`, `localName`, `serviceUUIDs`)
     - RSSI polling interval while connected
     - battery (0x180F) and Device Information (0x180A: model, firmware), with "Not reported" fallbacks
   - **e. Alert engine:**
     - pure `checkHeartRate(reading, thresholds) → AlertItem | null`
     - 60 s cooldown per alert type
     - respects the Preferences "Alert notifications" toggle and thresholds `enabled`
     - `expo-notifications` with permission requests (iOS, and Android 13+ `POST_NOTIFICATIONS`)
     - where alert history is stored (AsyncStorage or the new `users/{uid}/alerts`)
     - never alerts on test data unless in `__DEV__`
   - **f. Background recording** (test subjects at home):
     - **iOS:** the `react-native-ble-plx` config plugin with `isBackgroundEnabled: true` (adds the `bluetooth-central` background mode), plus `BleManager` state restoration (`restoreStateIdentifier` / `restoreStateFunction`). Note the iOS limits: background scans need a service UUID filter, scanning is slower, reconnects rely on pending connections.
     - **Android:** a foreground service with a persistent notification. Name the exact library and its Expo config plugin, the permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CONNECTED_DEVICE` on Android 14+, Bluetooth permissions) and battery-optimisation handling.
     - The expected battery impact, and how it's measured.
   - **g. Mock removal:** what gets replaced, what stays dev-only (Previews, test buttons, sample sleep via `testExtras`).
   - **h. Order of the B-steps** below, with any changes you recommend.
   - **i. Risks and open questions.**
3. Commit: "Phase 2 B0: Step B plan".

⛔ **STOP.** PL sends the plan to Tarun. **No Step B code until PL says "Step B plan approved by Tarun".**

### B1. Single-device BLE, real, on both platforms
- Port Kevin's `BleService` / `BleContext` (scan, connect with 3 attempts and backoff, handshake: discover → battery → heart-rate notify, auto-reconnect, paired devices in `users/{uid}/devices`, Bluetooth state banners) into `src/`.
- Apply all iOS rules from B0(b).
- Add the `react-native-ble-plx` config plugin. Copy Kevin's options for now (`isBackgroundEnabled: false` until B6) with the permission text. Add `NSBluetoothAlwaysUsageDescription`, plus photo library and camera usage strings in `ios.infoPlist`.
- Replace the mock `BleProvider` for real use. Keep a mock for Previews only.
- Paired devices: additive fields only (`platform`, `localName`, `serviceUUIDs`). Android-written MAC entries on iOS show "Reconnect by scanning".
- Commit: "Phase 2 B1: real BLE single device".
- ⛔ **STOP.** Click list on a **physical iPhone** with a heart-rate strap or nRF Connect:
  - Bluetooth off / on banners
  - permission denied → Settings button
  - scan (sorted, ❤ marker, auto-stop at 15 s)
  - connect (states) and Cancel
  - live BPM on the Dashboard card and Heart Rate page
  - disconnect
  - walk out of range → RECONNECTING → back
  - Forget
  - relaunch with auto-connect on and off

  Same on Android if possible.

### B2. Multiple simultaneous devices
- Implement the multi-device design from B0(a). Per-device state flows into the existing Devices tab ("Connected now" / "Previously connected"), Device Detail, the Dashboard device ring ("<n> devices connected") and its expanded rows. **No layout changes.**
- Commit: "Phase 2 B2: multi-device BLE".
- ⛔ **STOP.** Click list with 2+ devices: connect both, readings from each, disconnect one, the other keeps streaming, auto-connect both after relaunch, behaviour at the limit.

### B3. Readings pipeline (Firestore)
- Implement the B0(c) model:
  - Kevin-compatible writes
  - new full-resolution `reading_batches` (or the approved name)
  - every reading tagged with `deviceId` and `source`
  - the in-memory readings store fed by real data
- Test-data buttons (dev only) write `source: 'test'` and are excluded from device stats.
- Commit: "Phase 2 B3: readings pipeline".
- ⛔ **STOP.** Click list:
  - live readings → batches appear in the Firestore Console about every minute
  - Kevin-format docs still written
  - charts fill
  - airplane mode → readings continue locally → sync when back online
  - Kevin's Android app (if available) still shows heart rate

### B4. Connection event log, RSSI, battery, device info
- Implement B0(d): the persisted log, AppState background/foreground events, RSSI polling, battery and 0x180A reads with "Not reported" fallbacks.
- Feed the Devices tab stats and badges (Stable / Unstable / Not responding, thresholds in one constants file) and Device Detail session history from real events.
- Background/closed time must not count as gaps or drop-outs.
- Commit: "Phase 2 B4: connection log and device stats".
- ⛔ **STOP.** Click list:
  - stats update live
  - a forced drop-out (walk away) counts as unexpected
  - a user disconnect counts as user
  - kill and relaunch → history kept
  - a device without 0x180A shows "Not reported"

### B5. Alert engine and notifications
- `npx expo install expo-notifications`, then implement B0(e).
- Notifications screen history uses the approved storage.
- Commit: "Phase 2 B5: alert engine".
- ⛔ **STOP.** Click list:
  - set Max just under the live BPM → one notification, then none for 60 s
  - it appears in Notifications
  - Preferences toggle off → no notification
  - thresholds disabled → none
  - permission prompt on first use (iOS and Android 13+)

### B6. Background recording
- Implement B0(f) on both platforms (plugin options, iOS state restoration, Android foreground service + notification + permissions).
- Commit: "Phase 2 B6: background recording".
- ⛔ **STOP.** Click list on physical devices:
  - lock the phone for 30 minutes while wearing the device → readings continue (check `reading_batches` timestamps)
  - an alert fires while locked
  - walk out of range and back while backgrounded
  - force-quit behaviour documented per platform (iOS state restoration limits)
  - battery drain over 1 hour noted in the Progress Log

### B7. Clean-up
- Remove leftover mock data paths from real flows.
  - **Keep** Previews, dev-only test buttons and `testExtras` sample sleep (`__DEV__` only).
  - Sleep stays "No sleep data yet" in real use.
  - Distance/Floors/Calories stay "--".
- Search for any remaining `firebase` JS SDK import, any `.env` Firebase usage, or mock providers used outside Previews.
- `npm run typecheck` clean. No yellow-box warnings on device.
- Commit: "Phase 2 B7: clean-up".

---

## STEP C: Documentation and pull request

### C1. Docs (commit: "Phase 2 C1: docs")
- **`IOS_BUILD.md`:**
  - prerequisites (Xcode, CocoaPods, Node)
  - clone, `npm install`, config files in the root (never committed)
  - `npx expo prebuild --platform ios --clean`, `npx expo run:ios` / `--device`
  - Xcode signing (once), trusting the developer on the iPhone
  - common errors and fixes
  - **free Apple ID builds expire after 7 days, so rebuild before demos**
- **`ANDROID_BUILD.md`:** emulator/phone, `npx expo run:android`, SHA-1 per machine, common fixes.
- **`BUGS.md`:** columns `Screen | Bug | Steps | Status`, filled with anything found.
- **`FOR_ANDROID_TEAM.md`:**
  - the Google bug fixes
  - the alert engine
  - multi-device support
  - the new Firestore collections/fields and final document shapes
  - the background recording approach

  It's written so Kevin's team can review before Phase 3.
- Update the charter: Phase 2 marked done, the swap-points table updated, open items listed.
- In `AGENTS.md`, replace the "Phase 2 handover (PL, using Codex)" section with one line: `Phase 2 complete; see claudephase2charter.md Progress Log.` (`AGENTS.md` is also loaded by Tarun's Claude Code, so the handover instructions mustn't stay active after the merge.) Keep `PL_1` and `PL_2` in the repo as a record.

### C2. Final verification (report all ✅/❌)
- [ ] `npm run typecheck` clean
- [ ] `git ls-files` contains no `google-services.json`, `GoogleService-Info.plist`, `.env`, `ios/` or `android/`
- [ ] Kevin's repo: `git status` clean; no commits made there
- [ ] All work on `phase-2`; `main` untouched
- [ ] Every ported file recorded (Kevin's path → our path)
- [ ] Firestore: only additive changes; Kevin-format docs still written
- [ ] Every Step A and B click list passed on iOS (and on Android, or marked "Tarun to test")
- [ ] No UI layout changes without a recorded Tarun approval

### C3. Pull request (PL does this)
- PL pushes: `git push origin phase-2`.
- PL opens a PR **`phase-2` → `main`** on `TarunKrishnan6/DSS-iOS-UI`, titled "Phase 2: real Firebase + BLE", with:
  - a summary of what was built
  - the test matrix results
  - links to `FOR_ANDROID_TEAM.md` and `BUGS.md`
  - known limitations
- **Tarun reviews, tests Android on Windows, and merges.** Never merge it yourself.

---

## Out of scope: do not build
- **Daily Insight Summary** (Jira DWBS22-372): waiting on JJ.
- **Phase 3** (merging into Kevin's repo): separate, later, team-led.
- Any UI redesign, new screens, or fitness features.
- Firestore security rule changes or Firebase console changes.
