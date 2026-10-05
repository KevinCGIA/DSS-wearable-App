@AGENTS.md

# DSS Wearables — iOS UI: Phase 2 Charter (claudephase2charter.md)

## Context

- App: **DSS Wearable Device Companion App** (CSE3CAP capstone, Team BRIc)
- **This project is my iOS UI**: Expo SDK 57, React Native 0.86, TypeScript, `@/` alias → `src/`. Phase 1 used the Firebase JS SDK in preview mode; **Phase 2 switches to `@react-native-firebase`** (same as Android). It is the base design; we're improving and finishing it.
- The Android team's app is complete in a separate repo: https://github.com/KevinCGIA/DSS-wearable-App. It uses expo-router (`app/` folder), `@react-native-firebase` and `google-services.json`.
- **Target branch: `origin/feature/ble-connection`** (not yet merged into `main`). Read it with `git show` only, with no fetch or checkout. Before Phase 2, re-check whether it has been merged or changed.
- **Repo:** https://github.com/TarunKrishnan6/DSS-iOS-UI.git (private, `origin`). **Never push.** Tarun pushes himself. PL works on `fix/<name>` branches and opens pull requests into this repo; nobody pushes straight to `main` except Tarun.
- **Plan:** Phase 1 (UI) and Phase 2 (wiring real logic, ported from Kevin's repo) both happen **in this repo**. Merging into Kevin's repo is Phase 3, later, after PL has tested everything.
- I develop on Windows. In Phase 1, test with `npx expo start` (Android emulator, or Expo Go on an iPhone, since this project only uses Expo Go–compatible packages). From Phase 2 step 4, a development build is needed (no Expo Go).
- Read the versioned Expo docs (see AGENTS.md) before using any Expo API.

## Inputs to fill in

- `ANDROID_REPO_PATH` = `C:\Users\tarun\Desktop\DSSWEARABLE\DSS-wearable-App` (sibling of this ios folder, i.e. `..\DSS-wearable-App`). **Read-only: never edit, commit or run git commands that change anything in it.**

## Match the Android app (structure + wiring)

The Android app is already wired up. **My UI keeps its own visual design and copies the Android app's actions and data** (handlers, Firestore paths, connection states), so Phase 2 is still a 1:1 swap of containers. **Since 2026-10-04 the screen structure differs on purpose** (researcher/test-subject app, below).

**Who the app is for (2026-10-04):** researchers use it to test and demonstrate BLE wearables, and test subjects use it to record data at home. **Avoid fitness wording everywhere** ("Fitness", step goals, "achieved", calorie targets).

## App structure (final, both platforms; 2026-10-05)

**Team decision (2026-10-05): 4 tabs, Dashboard | Devices | Activity | Settings, is the app's final structure on BOTH iOS and Android.** No `*.ios.tsx` split. In Phase 3 it **replaces the Android UI** in Kevin's repo, keeping Kevin's logic (auth, Firestore, BLE, sensors). (Earlier versions had 3 tabs with a raised Dashboard button and pushed Heart Rate / Steps / Sleep pages; those are gone.)

**Bottom tabs (4, in this order; standard tab bar, no raised button; icon + label, active tab in accent):**

| Tab key | Label | Feather icon | Content |
|---|---|---|---|
| `dashboard` | Dashboard | `grid` | **Default tab after sign-in.** The old Home layout with expandable cards (below). |
| `devices` | Devices | `bluetooth` | Summary strip, Add device (scan/connect flow), Connected now and Previously connected cards with stats, Device Detail. **All device and connection information lives here.** |
| `activity` | Activity | `activity` | **Bio stats only**, for one source at a time (below). No device or connection information. |
| `settings` | Settings | `settings` | Profile row, Alert Thresholds, Notifications, Preferences, Development (`__DEV__`: Previews), Log Out. |

*Historical:* Kevin's current Android build still has the old 5 tabs (Home, Heart Rate, Fitness, Sleep, Settings + hidden `devices` route) until Phase 3 replaces them. Mapping: Home → **Dashboard**; Heart Rate + Fitness + Sleep → **Activity**; `devices` → **Devices tab**.

**Dashboard** (`features/dashboard/`): the old Home layout. Collapsed cards are unchanged; tapping a card expands it in place.

| Element | Shows | Empty / no-device state | Links (expanded) |
|---|---|---|---|
| Top bar | Time-of-day greeting + date; "?" help; avatar (photo/initials, green dot when a device is connected) | "?" avatar with no name | ? → Help sheet; avatar → **Profile** |
| Banner | "Welcome, {first name}!" + "Here is your daily summary" on the textured blue hero | "Welcome!" | — |
| Card 1: Heart Rate | Live BPM, Live / Last seen badge, resting range, waveform; expanded: Min/Avg/Max + 24 h chart + source | "--" BPM + "No readings yet…" | **Open in Activity ›** → Activity, Heart Rate section |
| Card 2 left: Device | Ring + name + status (+ battery), sync / retry; several devices: "<n> devices connected" | Grey ring, "No Device", "Tap to connect" | ring → **Devices tab** |
| Card 2 right: Today's Activity | Steps, Distance (km/mi), Floors; expanded: device rows, steps-per-hour mini chart | Steps 0; Distance and Floors "--" | **Devices ›** → Devices tab; **Open in Activity ›** → Steps section |
| Card 3: Sleep & Recovery | Last night; expanded: stages, bedtime → wake, 7-night trend | "No sleep data yet" | **Open in Activity ›** → Sleep section |
| Card 4: Active Calories | kcal only (no target, no "% achieved", no goal bar) | "--" + "Not reported by connected devices yet." | **Open in Activity ›** → Steps section |

- "Open in Activity ›" switches to the Activity tab, scrolls to that section and selects **that card's source** (the device of its latest reading; Test data for test readings and the dev sample night). `ActivityFocusProvider` holds the selection and the scroll request.
- Distance, Floors and Calories stay **"--"** in the real flow (no real source); previews show values.

**Activity** (`features/activity/`): bio stats only.
- Blue header "Activity". **Source chips** under it (horizontal scroll, name only): one per device with data in the last 7 days, most recent data first; readings without a `deviceId` show as "Unknown device"; `__DEV__` only, a **Test data** chip (test buttons and sample data). Default: the device with the newest reading, else (dev) Test data. The choice is kept while the app is open.
- **No** connection status, signal, battery, "Live · device" line, reconnect states or device actions (those are the Devices tab's).
- Sections for the selected source: **Heart Rate** (latest BPM + "Updated x ago", greyed after 10 min; resting range; 24 h line chart of 30-minute averages with gaps as breaks + Min/Avg/Max; resting heart rate Week/Month trend), **Steps** (today's total, 24 h steps per hour with Total, 7-day daily steps; no goal), **Sleep** (last night: duration, score, stages; Week/Month trends).
- A section this source doesn't report shows **"Not reported by this device."** Nothing is estimated; no distance, floors or calories. Resting heart-rate trends and sleep have no real source yet (sleep is dev sample data on the Test data chip only).
- Empty state: "No data yet. Connect a device in the Devices tab." `__DEV__` Development card at the bottom: Add Test Reading, Add 24h of Sample Data, Add Test Steps (all write to Test data).

**Profile and Settings are split (2026-10-04; part of the agreed structure for both platforms).** Kevin's current Android build still keeps everything on one Settings page until Phase 3.

**Profile** (stack route `profile`, header + ‹ back; opened from the Dashboard avatar and from Settings' Profile row):
1. Avatar + "Change Profile Picture" (image picker, saves straight away)
2. Name, Height, Weight (units from Preferences) + Save (unsaved-changes guard on ‹, hardware back and tab switch)
3. Account: New Email + Change Email (verify-before-update), Change Password (sends a reset email)

**Settings tab:**
1. Profile row: small avatar, name, email and chevron → Profile
2. Alert Thresholds, Notifications, Preferences
3. `__DEV__` only: Previews
4. Log Out (with confirm)

**Sub-screens (pushed on the hand-rolled stack, with a back button):** `profile`, `alert-thresholds`, `notifications`, `preferences`, `add-device`, `device-detail`, `previews`. Alert Thresholds is reached from Settings only.

**Navigation:** hand-rolled tabs + route stack in `RootNavigator.tsx` with the unsaved-changes guard. Android hardware back: pops the stack, then returns to Dashboard, then exits.

## Current state (audited)

**Design system — keep it, it's the base:**
- Tokens in `src/theme/`: colors (blue accent, ink neutrals, vital colours calm/peak/pulse used for meaning only), spacing (4-based), radius, elevation, typography (Barlow numerals, Manrope UI)
- Primitives in `src/components/ui/`: Button, Card, Pill, Screen, SegmentedControl, StageTrack, StatReadout, TabBar, TextField, BarChart
- Conventions: feature folders in `src/features/<name>/`, import each component from its own file (no barrels), no literal hex/px in screens

**Screens (as of 2026-10-05):**

| Screen | Where | Status |
|---|---|---|
| Auth | `features/auth/` | Built (Task 2) |
| Dashboard (tab, default) | `features/dashboard/` | Built; expandable cards link to Activity |
| Activity (tab) | `features/activity/` | **2026-10-05:** bio stats per source; replaces the Heart Rate, Steps and Sleep pages |
| Devices (tab) + Add device + Device Detail | `features/devices/` | Built (Part 2) |
| Settings (tab) | `features/settings/` | Built |
| Profile (pushed) | `features/profile/` | Built |
| Alert Thresholds / Notifications / Preferences (pushed) | `features/alerts`, `notifications`, `preferences` | Built (iOS only) |

Navigation: see "App structure" above.

## Rules

1. **Screens are presentational.** They take data and callbacks as props, with no Firebase, BLE, timers or business logic inside. Logic lives in a hook or container in the same feature folder (`useX.ts` / `XContainer.tsx`). In Phase 2, only the containers get swapped for the Android team's logic.
2. All fake data lives in `src/data/`. Its shapes must match the real data shapes listed below.
3. Use the existing tokens and primitives. Add a token rather than a literal value, and add a primitive rather than duplicating UI.
4. Every screen has a `*.preview.tsx` rendering each state (empty, loading, error, filled) with mock props, reachable from a dev-only Previews menu.
5. iOS-first: `Screen` handles safe areas, touch targets are at least 44pt, icon buttons get `accessibilityLabel`, and layouts must work at larger text sizes.
6. **(Phase 1 only)** Don't add native-only packages (BLE, `@react-native-firebase`, etc.); the app must keep running in Expo Go. **In Phase 2, native packages (`@react-native-firebase`, `react-native-ble-plx`, `expo-dev-client`, etc.) are expected**, and testing moves to development builds.
7. Minimal comments. Run `npm run typecheck` after every task and fix all errors. Commit after each task. Update the Progress Log.
8. **(Phase 1 only)** Firebase and the bundle ID were deferred during Phase 1. **In Phase 2, Firebase comes first**: see "Phase 2, Step A: Firebase" for the settled project, IDs and config files.

## Data shapes (mocks must match)

Defined in `src/data/types.ts`. They mirror Android's `feature/ble-connection` types so the Phase 2 swap is mechanical. They contain no native imports: `BluetoothState` uses the same string values as ble-plx's `State` enum.

```ts
// Android: Firebase Auth user + users/{uid} + users/{uid}/private/avatarData. Height and weight are stored as strings in Firestore; containers convert them.
type UserProfile = { uid: string; name: string; email: string; emailVerified: boolean; height: number | null; weight: number | null; avatarData: string | null };

// Android: services/ble/BleService.ts
type ConnectionStatus = 'disconnected' | 'connecting' | 'discovering' | 'connected' | 'reconnecting' | 'disconnecting';
type ConnectionState = { status: ConnectionStatus; deviceId: string | null; deviceName: string | null; attempt: number; batteryLevel: number | null; error: string | null };
type BluetoothState = 'Unknown' | 'Resetting' | 'Unsupported' | 'Unauthorized' | 'PoweredOff' | 'PoweredOn';
type ScannedDevice = { id: string; name: string; rssi: number; isHeartRateDevice: boolean };

// Android: services/devices/pairedDevices.ts (+ users/{uid}.autoConnectDevice)
type PairedDevice = { deviceId: string; name: string; addedAt: Date | null; lastConnectedAt: Date | null };

// Android: services/sensors/schema.ts, useLatestSensorReading.ts, useSensorHistory.ts
type SensorType = 'heart_rate' | 'steps';
type ReadingSource = 'ble' | 'manual';
type SensorReading = { id: string; type: SensorType; value: number; unit: string; timestamp: Date; deviceName: string | null; source: ReadingSource };
type LatestReadingState = { reading: SensorReading | null; loading: boolean; error: string | null };
type HistoryState = { readings: SensorReading[]; start: number; end: number; loading: boolean; error: string | null };
// steps.value is a running daily total that resets at midnight.

// iOS only, no Android backend yet (mock containers):
type SleepSummary = { totalMinutes: number; score: number; rating: string; start: string; end: string; stages: SleepStage[] };
type AlertThresholds = { hrMin: number; hrMax: number; enabled: boolean };
type AlertItem = { id: string; type: 'HR_HIGH' | 'HR_LOW'; value: number; message: string; timestamp: number };
type Preferences = { textScale: 'default' | 'large' | 'xlarge'; units: 'metric' | 'imperial'; notifications: boolean };
type DailyActivityExtras = { distanceKm: number | null; floors: number | null; activeCalories: number | null; calorieTarget: number };
```

Mock dev values (from the Android team): Galaxy Watch8, connected, 85% battery, 72 BPM, 6,842 steps. Preview only (no data source yet): 4.8 km, 12 floors, 486 / 600 kcal, sleep 7h 42m, score 86 "Optimal". No-device mocks are fully empty and consistent: disconnected, no readings, 0 steps, `null` distance/floors/calories, no sleep.

## PHASE 1 — FINISH THE UI

### Task 0: Map the Android wiring (read-only)
- [x] In `ANDROID_REPO_PATH`, read `package.json`, `app.json` (record `android.package` and which Firebase project their config points to, for later), `app/` (every route, layout and tab), and the auth/Firestore/BLE helper files
- [x] Write an **Android Wiring Map** in the Progress Log. For every screen and button, record:
  - the route/file
  - the handler or function it calls (with its file)
  - the data it reads (Firestore path or hook)
  - its empty/loading/error states
- [x] Note any Android screen or action not in the tables above (e.g. what the Heart Rate, Fitness and Sleep tabs actually show) and add it to my plan
- [x] Name my container callbacks and props after their handlers (e.g. if they call `handleLogout`, my prop is `onLogout`), so the Phase 2 swap is mechanical
- [x] **Stop and show me the wiring map before Task 1** (reviewed 2026-10-03, decisions recorded in the Progress Log)

### Task 1: Foundations
- [x] `git init` in `ios/`, check `.gitignore` covers `node_modules`, `.expo` and `.env`, and make an initial commit before changing anything (local only, no remote)
- [x] Add `src/data/types.ts` (the shapes above) and `src/data/mocks.ts` (no-device and connected mocks)
- [x] Replace the tabs with the 5 Android tabs (`home`, `heart-rate`, `fitness`, `sleep`, `settings`) in `TabBar` and `RootNavigator`. Monitoring → Heart Rate, Analytics → Sleep, and a new Fitness screen.
- [x] Add a hand-rolled `useState` route stack in `RootNavigator` for `devices`, `alert-thresholds`, `notifications`, `preferences` and `previews`, with a back button (plus the Android hardware back). **Don't add react-navigation or expo-router.**
- [x] Add primitives: `ListRow`, `Toggle`, `Stepper`, `EmptyState`, `ErrorBanner`, `Avatar`, `Header` (title + back)
- [x] Add the dev-only Previews menu (behind `__DEV__`, reachable from Settings)
- [x] Set `ios.supportsTablet` to false

### Task 2: Refactor the built screens to Rule 1
- [x] **Auth:** move the Firebase calls into `useAuthForm.ts`. `AuthScreen` becomes props-only.
  - Login: email, password, `onSignIn`, `onSignInWithGoogle`, "Please verify your email" state, **Forgot password?** (`onSendPasswordReset`, same reset-email logic as Change Password) with a reset-sent confirmation
  - Register (match Android): avatar (optional, `onChooseProfilePicture`), name, height (cm), weight (kg), email, password, **confirm password** ("Passwords do not match."), `onSignUp`, plus a **separate Google sign-up button** (`onSignUpWithGoogle`), then a "Verification email sent" state
- [x] **Home (UI change 2, reference layout):** rebuild to match the Home dashboard table:
  - Props: `now` (date derived from it), `profile: UserProfile | null`, `profileLoading`, `connection: ConnectionState`, `refreshing`, `heartRate: LatestReadingState`, `restingRange: { low; high } | null`, `steps: LatestReadingState`, `activity: DailyActivityExtras`, `sleep: SleepSummary | null`, `onRefresh`, `onOpenSettings`, `onOpenDevices`, `onOpenTab`. **No `onLogout`.**
  - `HomeContainer` + `useHomeData` own the data, the clock and the refresh timer. The simulated heart rate lives in `useLiveHeartRate.ts`, used only in the connected preview.
  - New primitives: `IconButton` (incl. spinning), `Sheet` (help), `ProgressBar`, `Waveform`, Avatar initials + status dot, Pill `good` tier, raised centre tab
  - Remove the old area tiles, the bell, the zone label and Log Out
  - Previews: no device, connecting, connected + syncing, connected with full mock data (+ failed)
  - Log Out moves to Settings with a confirm
- [x] **Sleep tab (from Analytics):** take `SleepSummary | null` and its series as props from a container. The default container returns no data, which gives the "No sleep data yet" state. Move the resting HR chart to the Heart Rate tab.

### Task 3: Build the missing and placeholder screens (in this order)
- [x] **Settings** (built as one page; **later split into Profile + Settings**, see the Profile/Settings section above). Props named after Android handlers: `onChooseProfilePicture`, `onSaveProfile`, `onChangeEmail(newEmail)`, `onChangePassword`, `onLogout`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onOpenDevices`. Loading, saving and validation states. Previews entry under `__DEV__` only.
- [x] **Devices** (Android route `devices`):
  - Connection card for all six states: connecting (attempt n), discovering ("Setting up device..."), reconnecting (attempt n), disconnecting, failed (`error` on disconnected), connected (battery + Disconnect). **Cancel** for pending states.
  - Bluetooth banners: PoweredOff / Unauthorized / Unsupported / Resetting. Scan error banner.
  - Scan / Stop Scanning (disabled while busy). Scan results sorted by RSSI with an HR-capable marker, signal bars + label, and "Current" / "Connect". Empty text for scanning and idle.
  - Auto-connect toggle and Paired devices (Connect / Forget with confirm) — the same components as Settings
  - Props: `onStartScan`, `onStopScan`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onBack`
- [x] **Fitness tab**: Steps Today vs 10,000 goal (progress bar, "Goal reached!", "Updated x ago"), 24h steps-per-hour bar chart with Total. States: loading, error, no data ("No step data yet. Connect your wearable to start tracking.").
- [x] **Heart Rate tab**: large BPM, Live badge, Updated/Last reading age, "from {device}", greyed when stale, no zones, 24h line chart with Min/Avg/Max (needs a `LineChart` primitive: Views, or `react-native-svg` via `npx expo install`, which is Expo Go–compatible and already in Android's deps), link to Alert Thresholds. States: loading, error, no data.
- [x] **Alert Thresholds** (iOS only, **no backend yet**): enable toggle, min/max HR steppers, validation (min < max, sensible range), Save
- [x] **Notifications** (iOS only, **no backend yet**): alerts grouped by day, with type icon, value and time, plus an empty state
- [x] **Preferences / Accessibility** (lowest priority, only if time allows): text size (scale factor in typography), units, notifications toggle

### Task 4: Polish and sign-off
- [x] Click through every flow: *(Phase 1 sign-off: deferred to Tarun's full phone click-through, using the list in the Task 4 log; bugs reported separately)*
  - Auth (all states) → Home (no device) → tap device → Devices → Home (connected)
  - Each Home element tap goes to the right tab or screen
  - Heart Rate → Alert Thresholds → Fitness → Sleep → Settings → Notifications → Preferences
  - Log Out from both Home and Settings
- [x] Compare side by side with the Android app: same tabs, same Home elements in the same order, Android's tap destinations (plus the iOS improvements) *(covered by the code-based Android comparison table in the Task 4 log; no visual side-by-side available)*
- [x] Check the largest text size, a small iPhone width (375) and a large one (430) *(X-Large app text checked via web screenshots; device widths and iOS Dynamic Type in Tarun's phone pass)*
- [x] Replace the default Expo app icon and splash with the DSS icon (the accent-blue chevron matching the Home design), and check the app name shows as "DSS Wearables" on the iPhone home screen.
  - Status: icons were generated on 2026-10-04 by `scripts/generate-logo.mjs` (`icon.png`, `splash-icon.png`, Android adaptive icons, favicon).
  - Still to do: wire the splash in `app.json` (needs OK, Rule 8), and verify both the icon and the name in a real build. Expo Go shows its own icon.
- [x] **Units gap 1: Register.** Read the saved Preferences units (`usePreferences()`; `PreferencesProvider` already wraps sign-in) and show Height (in) / Weight (lb) with the converted ranges. Convert back with `heightToCm` / `weightToKg` before `signUp`, so storage stays cm/kg like Android.
- [x] **Units gap 2: Home distance label.** Show "mi" instead of the hard-coded "km" when Imperial is set, converting the value (km → mi), in `DeviceActivityCard`'s distance row. Label and value only, no layout change. It matters for Phase 2 real distance, and for test data now (test steps already fill Distance in km).
- [x] No typecheck errors and no yellow-box warnings *(typecheck clean; dev web build of all preview states has no React warnings; on-device yellow boxes in Tarun's phone pass)*
- [x] Write a **UI Sign-off** section in the Progress Log listing every screen, its props type, and its container/hook
- [x] **Stop. Wait for me to say "start Phase 2".** *(stopped at Phase 1 sign-off)*

---

## PHASE 2 — WIRE REAL LOGIC (in this repo) (LOCKED until I say "start Phase 2")

**Both platforms (2026-10-05):** everything built in Phase 2 must work on **iOS and Android**. Test each Step A and Step B piece on **Android** (Tarun's phone over USB, or the emulator where Bluetooth isn't needed) **and iOS** (PL's Mac + iPhone) before calling it done. Log results for both in the Progress Log and `BUGS.md`.

**Where:** this repo (`https://github.com/TarunKrishnan6/DSS-iOS-UI.git`, private). **Kevin's repo stays read-only**; it's only a reference to copy logic from. **Never push.** Tarun pushes. PL tests from this repo on his Mac, works on `fix/<name>` branches, and opens pull requests into this repo or logs issues in `BUGS.md`. Nobody pushes straight to `main` except Tarun.

### Phase 2, Step 0: back up Phase 1
- Confirm "Phase 1 sign-off" is in the commit history and that any later commits are only UI changes or plan updates (list them for Tarun). Otherwise stop and ask.
- Confirm `git remote -v` shows `origin` = `https://github.com/TarunKrishnan6/DSS-iOS-UI.git`. Never push anywhere else.
- Confirm `google-services.json`, `GoogleService-Info.plist` and `.env` are in `.gitignore` and **not tracked** (`git ls-files` must not list them).
- Tag the latest commit `phase-1-signoff`, then push `main` and the tag to `origin`. **This is a one-time push permission.** After it, only Tarun pushes. If `git status` shows the branch has diverged from `origin/main`, stop and ask; never force-push.

### Phase 2, Step A: Firebase (FIRST, before BLE)

**Settled facts (no longer open questions):**

| | iOS | Android |
|---|---|---|
| Firebase project | `wearable-app-f9d83` | `wearable-app-f9d83` |
| Project number | `944450266341` | `944450266341` |
| App ID | `com.galaxies.firebase` (matches Kevin's `app.json` `ios.bundleIdentifier`) | `com.dsswearablecool.firebase` |
| Config file (project root, gitignored, never committed) | `GoogleService-Info.plist` (has `CLIENT_ID` + `REVERSED_CLIENT_ID`) | `google-services.json` |

Different IDs in the same Firebase project is intended. The old `dss-wearable-bric` project and `au.edu.latrobe.bric.dsswearables` are **not used**.

**Steps (commit after each):**
1. **Verify config:** `PROJECT_ID` / `GCM_SENDER_ID` in the plist must equal `project_id` / `project_number` in `google-services.json`. Stop if they don't.
2. **Install** with `npx expo install`: `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`, `@react-native-google-signin/google-signin`, `expo-dev-client`, `expo-build-properties`.
3. **`app.json`:** `ios.bundleIdentifier` = `com.galaxies.firebase`, `ios.googleServicesFile`, `android.package` = `com.dsswearablecool.firebase`, `android.googleServicesFile`, the config plugins, `expo-build-properties` with `ios.useFrameworks: "static"`, and the Google sign-in plugin with `iosUrlScheme` = `REVERSED_CLIENT_ID` from the plist. Keep `supportsTablet: false`, the icon and the splash.
4. **SHA-1 for Google sign-in on Android:** run `npx expo prebuild --platform android`, then `cd android` + `gradlew signingReport`. Show Tarun the debug SHA-1, then **stop and wait for "SHA-1 added"**. Tarun adds it in Firebase (Project settings → Your apps → Android app → Add fingerprint) and re-downloads `google-services.json`. Never commit the generated `android/` folder.
5. **Port Kevin's auth + Firestore logic** (read-only from `feature/ble-connection`) into `src/`, recording each source path in the Progress Log:
   - register (Firestore profile at `users/{uid}` + `private/avatarData`, verification email, sign out)
   - login with the email-verified check
   - Google sign-in and sign-up
   - forgot password, change email, change password, logout
   - profile read/write, avatar save
6. **Fix, don't copy, the Google bugs from `ANDROID_BUGS.md`:**
   - Google sign-in creates `users/{uid}` if it's missing
   - Google sign-up never overwrites an existing profile
   - avatar initials/photo work for Google users

   Log each fix for the Android team.
7. **Swap containers to the real logic** (screens unchanged). Alert thresholds read/write `users/{uid}/settings/alerts`. Preferences stay on-device.
8. **Remove the `firebase` JS SDK** and the `.env` Firebase config. Keep Previews (dev only). Make the "Preview the dashboard" login bypass `__DEV__`-only.
9. **No BLE changes in Step A.** Bluetooth stays on mocks.
10. **Test on the Android emulator** (`npx expo run:android`) and give Tarun a click list:
    - register (account + `users/{uid}` visible in the Firebase console)
    - verify email, login, unverified login blocked
    - Google sign-in (new + existing user)
    - forgot password, change email, change password
    - profile edit + avatar persisting after restart
    - alert thresholds saving to Firestore
    - logout
11. **iOS check (PL, Mac):** after Tarun pushes, PL builds with `npx expo run:ios`. Then test shared data: register on iOS, log in on Android with the same account, and confirm the account and `users/{uid}` data are shared.

### Phase 2, Step B: BLE and the rest

**Shared data compatibility rule (applies to every Step B write):**
- iOS and Android write to the **same Firestore project** (`wearable-app-f9d83`).
- **Only ADD optional fields** (e.g. `deviceId`/`source` on readings, `platform`/`localName`/`serviceUUIDs`/`lastRssi`/`lastBattery` on paired devices). **Never rename, remove or change the type** of fields Android writes or reads in `users/{uid}`, `users/{uid}/private/avatarData`, `users/{uid}/sensor_readings/{type}/readings/*` and `users/{uid}/devices/*`.
- **Docs without the new fields must still work:** a missing `deviceId` means "unknown device" (counted under All devices, never in a device's stats); a missing `platform` means "android"; a missing `source` means `ble`.
- **Before any Step B code:** write the final reading and device document shapes (field, type, optional?, who writes it) into the Progress Log and get Tarun's OK.
- The connection event log (6b) goes in a **new** subcollection (e.g. `users/{uid}/devices/{key}/events`), so Android's existing docs are untouched.

The numbered list below is the general wiring plan. Firebase items in it are covered by Step A, so do the BLE, sensors, alert engine and connection log parts **after Step A is tested**.

1. **Re-check Kevin's repo first (read-only, `git show`/`git log` only, no fetch or checkout).** Look at `origin/feature/ble-connection` and `main`: has the BLE branch been merged, rebased or changed since Task 0 (`e65c84b`, 2026-10-02)? If so, update the Android Wiring Map and the data shapes before wiring anything.
2. **Port Kevin's logic into `src/`**, adapted to my folder structure and `@/` alias (e.g. `src/lib/` and `src/features/<name>/`). Copy and adapt:
   - auth helpers (email verification, Google sign-in)
   - the Firestore profile at `users/{uid}`, including `private/avatarData`
   - BLE scanning, connection and reconnect (`services/ble/*`)
   - sensor readings (`services/sensors/*`)
   - paired devices (`services/devices/pairedDevices.ts`)

   **Record the source file of every ported piece in the Progress Log** (Kevin's path → my path), so the Phase 3 merge is traceable.
3. **Firebase client:** switch from the `firebase` JS SDK to `@react-native-firebase` (`app`, `auth`, `firestore`, same as Android), so Phase 3 has no client conflict. Once the switch works, remove the JS SDK, `src/lib/firebase.ts`'s `.env` config and `.env.example`.
4. **Add `expo-dev-client`.** From this point the app needs a development build, because Expo Go can't run BLE or `@react-native-firebase`.
5. **Replace each container's mocks with the real logic** (`useDashboardData`, `useActivityData`, `useDevicesData`, `useAuthForm`/`authService`, the Settings/Profile containers). **Screens stay presentational and unchanged.** Activity swap points: `useActivityData` reads `useSensorHistory` (7 days, heart rate + steps) and splits it by source in `buildActivity`; B3 makes that store Firestore-backed, and a real sleep or resting heart-rate source plugs into its `sleepFor` / `restingTrendsFor` (both return null today, except the dev sample night on Test data).
6. **Alert engine** (Android has none):
   - A pure function `checkHeartRate(reading, thresholds)` → `AlertItem | null`, compared against `hrMin`/`hrMax`
   - A 60 s cooldown per alert type
   - Thresholds stored at `users/{uid}/settings/alerts`
   - Local notifications via `expo-notifications`, including the iOS permission request
   - Alerts saved for the Notifications screen

   Log this in the Progress Log as **a gap to tell the Android team** (they can reuse the same engine). The engine must respect the Preferences "Alert notifications" toggle.

   **6b. Connection event log (for Phase 2.5):** while wiring BLE, add a store that records:
   - connect attempt, connected, disconnected (reason: `user` | `unexpected`), failed
   - app background/foreground events
   - each with a timestamp and `deviceId`, persisted with `AsyncStorage`
   - plus RSSI, and battery/model/firmware where the device exposes `0x180F` / `0x180A`

   The Devices tab (2026-10-05) built this log **in memory with mock data**: `src/lib/devices/connectionLog.ts` (events), `deviceStats.ts` (sessions, success rate, drop-outs, gaps), `healthThresholds.ts` (badge thresholds). **Step B: real BLE writes to this same log** via `logConnectionEvent` (attempt, connected with `connectMs`, failed, disconnected `user`/`unexpected`) and the `AppState` background/foreground listener moves into the real provider. Drop the mock seeding (`data/deviceHistory.ts`, `seedConnectionLog`, `seedReadings`).

   **6c. Open item, don't build yet:** Daily Insight Summary (Jira DWBS22-372, JJ). No code exists on any branch. Waiting on JJ for what it should show.
7. **iOS compatibility:**
   - Guard Android-only APIs (`PermissionsAndroid`, `requestMTU`, etc.) with `Platform.OS` checks.
   - Add the `ios` block in `app.json`: `NSBluetoothAlwaysUsageDescription`, photo library and camera permission strings.
   - Add the `expo-build-properties` plugin with `ios.useFrameworks: "static"`.
8. **Test on Android first, from Tarun's Windows PC.** Run `npx expo run:android` on a **physical Android phone over USB** (the emulator has no Bluetooth). Fix everything there before PL's iOS test.
9. **Write `IOS_BUILD.md` for PL:**
   - Clone `https://github.com/TarunKrishnan6/DSS-iOS-UI.git`, then `npm install`
   - Put `GoogleService-Info.plist` in the project root (never committed)
   - Run `npx expo prebuild --platform ios --clean`, then `npx expo run:ios --device`
   - Open the generated `.xcworkspace` in Xcode once to set signing with his Apple ID
   - Common errors and fixes
   - **Dev builds signed with a free Apple ID expire after 7 days, so rebuild within 7 days of any demo**

   Also create an empty **`BUGS.md`** with columns `Screen | Bug | Steps | Status`.

10. **MULTIPLE SIMULTANEOUS DEVICES** (researchers test several wearables at once; Dashboard filter + Devices tab depend on it).
   - **Today:** Kevin's `BleService` holds **one** connection (`connection`, `connectionToken`, `disconnectSubscription`, `heartRateSubscription` are single fields; `connect()` cancels the previous device).
   - **Changes (port, then extend; record as an iOS/shared change for Kevin):**
     - **Per-device connection map:** `Map<deviceId, DeviceSession>`, each with its own `ConnectionState`, cancel token, disconnect subscription, HR subscription, battery and RSSI. `connect(device)` no longer cancels other devices. `disconnect(deviceId)` / `cancel(deviceId)` act on one device.
     - **Per-device reconnect and monitoring:** the 3-attempt handshake and the 3-attempt unexpected-drop reconnect run per device, so one device dropping doesn't touch the others. Stop scanning while any handshake runs (Android connects less reliably while scanning).
     - **Readings tagged by `deviceId`:** `addSensorReading` already writes `deviceId`/`deviceName`. Keep `deviceId` on the UI `SensorReading` (added in Part 1) so the Dashboard filter and per-device stats work. Throttle the 60 s save **per device**.
     - **Auto-connect for several devices:** reconnect every paired device with auto-connect on (not only `pairedDevices[0]`), staggered a few seconds apart.
     - **`useBle()` shape:** `connections: Record<deviceId, ConnectionState>` (keep a derived single `connection` for any screen that still needs one).
     - **Already in the mock** (`features/devices/BleProvider.tsx`, 2026-10-05): this exact `useBle()` shape, per-device connect/cancel/disconnect, per-device streams tagged by `deviceId`, and `disconnect(deviceId?)`. The real port keeps the API so the Devices tab, Device Detail and Dashboard stay unchanged. Multi-device auto-connect is still to do in the real provider.
   - **Limits on simultaneous connections:**
     - **iOS:** CoreBluetooth has no documented hard limit. In practice about 8–10 BLE peripherals before connections get unreliable (varies by iPhone model and by how chatty each device is).
     - **Android:** usually about 7 concurrent GATT connections (Bluetooth controller limit; some phones allow more, older ones fewer). Error 133 becomes more common near the limit.
     - **Firestore free tier:** 1 heart-rate write per minute per device ≈ 1,440 writes per day per device. The 20k writes/day free tier is about 13 device-days, so cap or batch for long multi-device sessions.
     - Plan for **up to 4 devices** in testing, and show a warning in Devices above that.
11. **BACKGROUND RECORDING** (test subjects record at home; **replaces the old "foreground only for the demo" decision**).
   - **iOS:**
     - `bluetooth-central` background mode: `react-native-ble-plx` plugin `isBackgroundEnabled: true`, which adds `UIBackgroundModes: ["bluetooth-central"]` to Info.plist.
     - **State restoration:** create `BleManager` with `restoreStateIdentifier` + `restoreStateFunction`, so iOS can relaunch the app in the background for BLE events after it was terminated **by the system**. It does **not** apply if the user force-quits the app; then recording stops until it's opened.
     - **Background limits:** HR notifications from already-connected devices keep arriving (the app is woken briefly to handle each). Scans **must filter by service UUID** (an unfiltered scan returns nothing in the background), results are coalesced and slower, and `allowDuplicates` is ignored.
     - **Reconnecting in the background:** issue `connectToDevice` with **no timeout**. iOS keeps the request pending and completes it when the device comes back in range, which is the iOS way to reconnect after a drop.
     - Write readings to a local queue first; Firestore (offline persistence) syncs when it can.
   - **Android:**
     - A **foreground service with a persistent notification** ("Recording from 2 devices") keeps BLE alive in the background. Expo has no built-in service, so use a native module with a config plugin (e.g. Notifee's foreground service or `react-native-background-actions`), decided in Step B.
     - Android 14+ needs foreground service type `connectedDevice` + `FOREGROUND_SERVICE_CONNECTED_DEVICE`, and `POST_NOTIFICATIONS` on Android 13+.
     - Ask the user to exempt the app from battery optimisation for overnight recording.
   - **UI:** a "Recording in background" indicator on the Dashboard strip and Devices tab, and a one-time explanation before the first at-home session.
   - **Battery impact:** continuous HR notifications (~1/s per device) keep the radio and CPU waking. Expect noticeably higher drain (measure in testing; rough guide: several % per hour per device). Keep the 60 s Firestore throttle, and tell test subjects to charge overnight while recording.
   - Background/closed time must never count as gaps or drop-outs in device stats; use the connection event log's background/foreground events.

Always: never touch or commit `google-services.json` / `GoogleService-Info.plist`, and never commit the generated `ios/` or `android/` native folders.

### Phase 2: BLE on iOS (from `feature/ble-connection`, Task 0 reading)

**1. Library and config plugin.**
- Android uses **`react-native-ble-plx` `^3.5.1`** through one shared `BleService` (`services/ble/BleService.ts`) and a React context `BleProvider`/`useBle()` (`services/ble/BleContext.tsx`). Charts use `react-native-svg 15.15.4`.
- Android's `app.json` plugin entry:
  ```json
  ["react-native-ble-plx", {
    "isBackgroundEnabled": false,
    "neverForLocation": true,
    "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to your wearable device over Bluetooth"
  }]
  ```
- What each option does on iOS:
  - `bluetoothAlwaysPermission` writes `NSBluetoothAlwaysUsageDescription` (and the legacy peripheral string) into Info.plist.
  - `isBackgroundEnabled: false` means no `bluetooth-central` background mode. **iOS sets it to `true`** for background recording (item 5, Step B item 11).
  - `neverForLocation` only affects Android.
- Install with `npx expo install react-native-ble-plx`, matching Android's version, and copy the same plugin entry.

**2. No Expo Go for BLE.**
- BLE (and `@react-native-firebase`) needs native code, so from Phase 2 testing needs a **development build**.
- On iOS that means PL's Mac building to a **physical iPhone**. The iOS Simulator has no Bluetooth.
- On Android it means a physical phone over USB (the emulator has no Bluetooth either).

**3. Device IDs differ: UUIDs on iOS, MAC addresses on Android.**
- **How Android stores devices:**
  - Paired devices live at `users/{uid}/devices/{deviceId}` as `{ deviceId, name, addedAt, lastConnectedAt }`, with the doc id = `deviceId`.
  - Auto-connect reconnects to `pairedDevices[0]` by `deviceId`.
  - On Android, `deviceId` is the watch's **MAC address**.
- **Why that breaks on iOS:**
  - On iOS, ble-plx returns a **CoreBluetooth peripheral UUID**. It's random per phone and can change after a reset or reinstall.
  - Because Firestore is shared, an account used on both platforms will contain Android MAC entries.
  - `connectToDevice(MAC)` on iOS fails with `InvalidIdentifiers`. Android treats that error as non-retryable, so it fails fast.
- **Plan (additive, Android keeps working):**
  - Add optional fields to the paired-device doc: `platform: 'ios' | 'android'`, `localName`, `serviceUUIDs` (e.g. Heart Rate `0x180D`).
  - **iOS Connect / auto-connect for a paired device:**
    1. If `platform === 'ios'`, try the stored UUID directly (`manager.devices([id])`, then `connectToDevice`).
    2. Otherwise, or if that fails, run a short scan (≤ 15 s, Android's `SCAN_TIMEOUT_MS`) and match by **name** (+ Heart Rate service UUID when advertised).
    3. After connecting, `savePairedDevice` saves the iOS UUID as a separate doc with `platform: 'ios'`.
  - The paired list on iOS shows iOS entries plus Android entries labelled "Reconnect by scanning".
  - Agree these extra fields with Kevin before writing them.

**4. Permissions.**
- Set `NSBluetoothAlwaysUsageDescription` (via the plugin and explicitly in `ios.infoPlist`).
- Android's `services/ble/permissions.ts` already returns `true` when `Platform.OS !== 'android'`. Keep that guard, and keep `requestMTU` Android-only, as Android already does.
- **iOS difference: when the Bluetooth prompt appears.**
  - Creating `BleManager` shows the iOS Bluetooth prompt.
  - `BleProvider` calls `watchBluetoothState()` on mount when `hasBlePermissions()` is true, which is always on iOS. So the prompt would appear right after login.
  - On iOS, defer `watchBluetoothState()` until the user opens Devices/starts a scan, or a paired iOS device exists for auto-connect.

**5. Background recording (replaces "foreground only for the demo", 2026-10-04).**
- Test subjects record at home, so BLE must keep working in the background. See **Step B item 11** for the full plan: iOS `bluetooth-central` + state restoration, Android foreground service, battery impact.
- Plugin change: `isBackgroundEnabled: true` (adds `UIBackgroundModes: bluetooth-central`).
- **iOS limits to design around:**
  - Background scans need a service UUID filter.
  - Reconnects use a pending `connectToDevice` with no timeout.
  - A user force-quit stops recording until the app is opened again; state restoration only covers termination by the system.
**6. Connection states and reconnect logic → my Devices screen.**
- Android's logic (`BleService.ts` + `constants.ts`):
  - `connect()` runs up to **3 handshake attempts** (`MAX_CONNECT_ATTEMPTS`), each with a **10 s** connect timeout. Backoff is **1 s, 2 s**. It stops early on non-retryable errors (Bluetooth off/unauthorized/unsupported, invalid IDs).
  - Handshake: connect → discover services → read battery (`0x180F/0x2A19`) → monitor heart rate (`0x180D/0x2A37`, saved at most every **60 s**).
  - An unexpected drop → status `reconnecting` with up to **3** attempts.
  - `disconnect()` bumps a token that cancels any in-flight handshake or reconnect (this is also **Cancel**).
  - Scans stop on their own after **15 s**.
- Props map 1:1 to `useBle()`:
  - Data: `connection`, `bluetoothState`, `isScanning`, `devices`, `scanError`, `pairedDevices`, `autoConnect`
  - Callbacks: `onStartScan` → `startScan`, `onStopScan` → `stopScan`, `onConnect` → `connect`, `onDisconnect` → `disconnect`, `onForgetDevice` → `forgetDevice`, `onSetAutoConnect` → `setAutoConnect`

| `connection.status` | Devices screen card | Button | Home device label (`deviceViewFrom`) |
|---|---|---|---|
| `connecting` | "Connecting (attempt n)…" | Cancel → `onDisconnect` | CONNECTING · "Attempt n of 3" |
| `discovering` | "Setting up device…" | Cancel | SYNCING |
| `connected` | "● Connected" + battery | Disconnect | CONNECTED · battery% (SYNCING while refreshing) |
| `reconnecting` | "Connection lost, reconnecting (attempt n)…" | Cancel | RECONNECTING · "Attempt n of 3" |
| `disconnecting` | "Disconnecting…" | none | DISCONNECTING |
| `disconnected` + `error` | "No device connected" + red error | Scan / Connect | FAILED · "Tap to retry" |
| `disconnected` | "No device connected" | Scan / Connect | No Device · "Tap to connect" |

- **iOS behaviour differences:**
  - There's no MTU request.
  - CoreBluetooth connects never time out on their own, so rely on ble-plx's `timeout` option. Android's 10 s works.
  - The "cancel half-open GATT before retry" step targets Android status 133. It's harmless on iOS.
  - Encrypted characteristics trigger the iOS system pairing dialog at first read, at the same point as Android.
  - `bluetoothState` starts as `Unknown` and reports `Unauthorized` through the state listener rather than a permission call.
- **Hardware risk:** the Galaxy Watch8 (Wear OS) doesn't officially pair with iPhones, and Android's own code notes it doesn't advertise the Heart Rate service until a watch app starts it. Have a **standard BLE heart-rate strap (e.g. Polar H10) or a heart-rate broadcast app** ready as a fallback for the iOS demo.

**7. iOS-specific BLE rules (added 2026-10-04).**
1. **Don't port Android-only workarounds to iOS.** These run only when `Platform.OS === 'android'`:
   - the GATT error 133 handling (the "cancel half-open link before retry" step and any extra retry delay added for it)
   - `requestMTU` (iOS negotiates MTU automatically)
   - any explicit Android bonding call (`feature/ble-connection` has none today; bonding happens on the encrypted read)

   The shared retry loop (3 attempts, 1 s/2 s backoff) stays on both platforms.
2. **Bluetooth state on iOS: two separate states, never the scan list.**
   - `Unauthorized` (permission denied) → the Devices **"Permission denied"** state, with a button that opens the app's iOS Settings page (`Linking.openSettings()`).
   - `PoweredOff` → the Devices **"Bluetooth off"** state (turn it on in Control Centre; no Settings button needed).
   - In **both**, hide the scan list and the Scan button entirely. Today's `DevicesScreen` shows a warning banner above an empty scan card, so Phase 2 adds the "Open Settings" button and hides the scan section for these states (small UI change, not built yet).
   - `Unknown` / `Resetting` stay as "not ready yet" with Scan disabled.
3. **Pairing/bonding on iOS is started by the device, not the app.** iOS shows the system pairing dialog when the app first reads or subscribes to an encrypted characteristic (for us, the battery read or HR notify in the handshake). There's no API to start pairing, so the plan **must not rely on an explicit pair call on iOS**. "Paired" in our UI means "saved in `users/{uid}/devices`", not OS-level bonding. If the user cancels the system dialog, the read fails → the attempt fails → normal retry/FAILED flow.
4. **No MAC addresses on iOS → platform-neutral device key.**
   - iOS never exposes MAC addresses.
   - Any Android code or Firestore data keyed by MAC (today the doc id in `users/{uid}/devices/{deviceId}`) needs a **platform-neutral key**: device **name + service UUID** (e.g. `Galaxy Watch8|180d`). Each phone also stores its own platform id: the iOS peripheral UUID for that iPhone, and the MAC for that Android phone.
   - Matching a saved device on a new phone goes by the neutral key, then the platform id is saved for next time. This extends item 3's plan and needs Kevin's agreement before the schema changes.
5. **Scan filter: include the Heart Rate service (0x180D) where possible.**
   - iOS only returns some service UUIDs to a scan that filters for them (UUIDs moved to the advertisement "overflow area"). An unfiltered scan can also show less detail for some devices.
   - So iOS scans with a `[0x180D]` filter first.
   - **Caveat from Android's code:** Android deliberately scans *unfiltered* (`startDeviceScan(null, …)`), because the Galaxy Watch only advertises 0x180D once a watch app starts it. A filter-only scan would hide it.
   - So on iOS, run the 0x180D-filtered pass, **then an unfiltered pass** within the same 15 s scan window, and merge the results (de-duplicated by id). Heart-rate devices still get the ❤ marker.

**8. Test checklist for PL** (physical iPhone, dev build; log results in `BUGS.md`):
- [ ] First Devices visit: Bluetooth permission prompt appears (not at login). Deny it → "Bluetooth permission was denied" banner. Allow it in iOS Settings → scanning works.
- [ ] Bluetooth off in Control Centre → "Bluetooth is turned off" banner. Back on → banner clears.
- [ ] **Scan:** devices appear sorted by signal, with the heart-rate marker. Auto-stops after 15 s. Stop Scanning works.
- [ ] **Connect:** connecting → setting up → connected, with battery shown. Cancel during connecting returns to no device.
- [ ] **Live heart rate:** the Dashboard Heart Rate card shows "Live" and the source device, the BPM updates, the waveform pulses and the 24 h chart fills over time. The Activity tab (that device's chip) matches.
- [ ] **Disconnect** from the Devices tab → the Dashboard strip shows "No device connected".
- [ ] **Out of range:** walk away until it drops → RECONNECTING (attempt n) → reconnects when back in range, or FAILED after 3 attempts.
- [ ] **Forget device** (confirm) → removed from Paired devices. If it was connected, it disconnects.
- [ ] **App restart with Auto-connect on** → reconnects to the last iOS device without scanning. With Auto-connect off, it doesn't.
- [ ] **Alert notification:** set Max to just under your current heart rate → a local notification fires once (60 s cooldown) and appears on the Notifications screen. Notification permission prompt appears the first time.
- [ ] **Two devices at once:** connect two devices → both chips on the Dashboard strip, the filter appears, and each device's readings show under its own filter. Drop one (out of range) → only that one reconnects; the other keeps streaming.
- [ ] **Background, iPhone locked 10 min:** with a device streaming, lock the phone for 10 minutes → readings keep arriving (no gap in the 24 h chart). The app shows "Recording in background" while backgrounded.
- [ ] **Background out of range:** while locked, walk away until the device drops, then come back → it reconnects without opening the app (pending connect), and recording resumes.
- [ ] **System termination:** start recording, background the app, open several heavy apps until iOS evicts it → BLE events relaunch it (state restoration) and recording continues.
- [ ] **Force-quit:** swipe the app away → recording stops (expected). On reopening, the Devices tab shows the gap as "app closed", not as a drop-out.
- [ ] **Overnight battery:** record 1–2 devices overnight while charging and while not charging. Note the battery % drop per hour in `BUGS.md`.
- [ ] **Android (Tarun's phone):** the persistent "Recording…" notification shows while backgrounded, readings continue with the screen off, and stopping recording removes the notification.

---

## PHASE 2.5 — DEVICE STATS: WHAT'S LEFT AFTER THE DEVICES TAB (after real BLE is wired and tested)

**Mostly absorbed into the Devices tab (UI change, 2026-10-04):** per-device cards, the health badge (Stable / Unstable / Not responding), reliability, data quality, session history and Device Detail are built in **Part 2** on mock data, driven by an in-memory connection event log. **The separate Profile Overview is dropped**; Profile stays the edit screen.

Keep for Phase 2.5 (not covered by Part 2):
- **Wire the connection event log to real BLE** (Step B 6b) and **persist it**: `AsyncStorage` first, later Firestore under `users/{uid}/devices/{key}/sessions`, so stats survive restarts and follow the account.
- **Device Information service (`0x180A`):** model, manufacturer and firmware on Device Detail, plus battery (`0x180F`). Show **"Not reported"** when a device doesn't expose them, never placeholders.
- **Real RSSI:** read it periodically while connected (`readRSSI`) instead of the scan-time value.
- **Tune the badge thresholds** (one constants file) after real multi-device and background testing.
- **All-time history:** devices tested (including forgotten ones), total connected time per device, overall connection success rate.
- **Realism rules (unchanged):** background/closed time never counts as gaps or drop-outs; readings with source "Test data" never count towards device stats.
---

## PHASE 3 — MERGE INTO KEVIN'S REPO (later; team decision made 2026-10-05)

- **Decided (2026-10-05):** this UI **replaces the Android UI** on both platforms. No `*.ios.tsx` routes. Kevin's screens in `app/(auth)/*` are replaced by this structure, and his logic (`services/ble`, `services/sensors`, `services/devices`, auth/Firestore helpers) stays and is wired into the containers.
- **Placeholder `ios/` folder:** Kevin's repo has one (only `.gitkeep`, plus a CODEOWNERS entry for `/ios/`). Move its contents to `docs/ios/` before any iOS prebuild there, because prebuild generates `ios/`.
- **Bundle ID:** Kevin's `app.json` already has `ios.bundleIdentifier` = `com.galaxies.firebase`, which matches. Keep it.
- **Imports:** re-align to Kevin's repo, which has no `@/` alias. Either add an alias there or rewrite imports.
- **Place and mount my code:** under `src/ios/` (or as agreed), mounted via `app/` routes.
- **Pull request:** open one into Kevin's `main` for both teams to review and test. Use the Progress Log's "ported from" notes to check nothing diverged.

## Progress Log
<!-- Claude Code: append updates here after each task -->

### 2026-10-03 — Task 0: Android Wiring Map

**Sources read (read-only, no fetch/checkout):** `main` @ `9b61eb8` and the unmerged remote branch **`origin/feature/ble-connection` @ `e65c84b`** (Kevin, 2026-10-02), read via `git show`. The BLE branch is the newest Android work and adds the real Heart Rate, Fitness and Devices screens plus all BLE/sensor services. **This map targets the BLE branch** wherever it differs from `main`. `feature/ios-auth` is empty (same as the initial commit).

#### Project facts (for Phase 2)

| Item | Value |
|---|---|
| Expo / RN / React / TS | `expo ~57.0.21`, `react-native 0.86.3`, `react 19.2.3`, `typescript ~6.0.3` (same as mine) |
| Navigation | **expo-router** (`main: expo-router/entry`), `typedRoutes` + `reactCompiler` on |
| Firebase client | **`@react-native-firebase/{app,auth,firestore}` v26** (modular API: `getAuth()`, `getFirestore()`). My JS SDK `firebase` must be dropped in Phase 2. |
| Google sign-in | `@react-native-google-signin/google-signin` v16, `webClientId 944450266341-4b3v…apps.googleusercontent.com` hardcoded in `login.tsx` and `register.tsx` |
| BLE | `react-native-ble-plx ^3.5.1` (BLE branch), plugin `neverForLocation`, `bluetoothAlwaysPermission` string set (also covers iOS) |
| Charts | `react-native-svg 15.15.4` (BLE branch) |
| Images | `expo-image-picker`, `expo-image-manipulator`, `expo-file-system/legacy` |
| `android.package` | `com.dsswearablecool.firebase` |
| `ios.bundleIdentifier` (theirs) | `com.galaxies.firebase` (placeholder, doesn't match the Android package) |
| Firebase project | `google-services.json` is gitignored and not on disk. From the Google `webClientId`, the **project number is `944450266341`**. The project ID is unknown, so ask Kevin/Jared. |
| `expo-build-properties` | `ios.useFrameworks: "static"` already set |
| `@/` alias | **None.** `tsconfig.json` only extends `expo/tsconfig.base`, and imports are relative (`../../services/...`) |
| Code layout | `app/` routes, `components/`, `services/{ble,devices,sensors}/`. No `src/`. |
| CODEOWNERS | `/android/` Jared+Kevin, `/ios/` Tarun+Praneet |

#### Routes and navigation

```
app/_layout.tsx        Stack + auth gate (onAuthStateChanged)
├─ index.tsx           Landing: "Welcome to DSS Wearable" + [Log In] [Register]
├─ login.tsx
├─ register.tsx
└─ (auth)/_layout.tsx  Tabs (Ionicons), wrapped in <BleProvider>
   ├─ home             icon home
   ├─ heart-rate       icon heart
   ├─ fitness          icon fitness
   ├─ sleep            icon moon
   ├─ settings         icon settings
   └─ devices          href:null (pushed from Home + Settings, has "‹ Back")
```

- **Auth gate** (`app/_layout.tsx`): `handleAuthStateChanged(user)` sets the user. When a user exists and isn't in `(auth)`, it does `router.replace('/(auth)/home')`. With no user inside `(auth)`, it does `router.replace('/')`. While initialising it shows a full-screen `ActivityIndicator`. **Sign-out anywhere returns to Landing through this gate**, so no screen navigates on logout.
- `BleProvider` unmounts on logout. Its cleanup does `stopScan()` + `disconnect()`.

#### Screen by screen

**Landing — `app/index.tsx`**
| Element | Handler | Data | States |
|---|---|---|---|
| Title "Welcome to DSS Wearable" | — | — | — |
| Log In button | `router.push("/login")` | — | — |
| Register button | `router.push("/register")` | — | — |

**Login — `app/login.tsx`**
| Element | Handler | Calls | States |
|---|---|---|---|
| Email, Password fields | local state | — | — |
| Sign In | `signIn` | `signInWithEmailAndPassword`. If `!user.emailVerified`, then `signOut` + alert *"Please verify your email before signing in."* | `loading` spinner. Error: `alert("Sign in failed: " + message)`. Success: alert "Signed in successfully!" and the gate routes to Home. |
| Google image button | `signInWithGoogle` | `GoogleSignin.hasPlayServices()` → `GoogleSignin.signIn()` → `GoogleAuthProvider.credential(idToken)` → `signInWithCredential` | same spinner/alerts. **Doesn't create a `users/{uid}` doc.** |
| *(no forgot-password link)* | — | — | — |

**Register — `app/register.tsx`**
| Element | Handler | Calls / writes | States |
|---|---|---|---|
| Avatar image (tap) | `chooseProfilePicture` | `ImagePicker.requestMediaLibraryPermissionsAsync` → `launchImageLibraryAsync({allowsEditing, aspect 1:1})`, which only keeps the local URI | Denied: alert "Please allow access to your photos." |
| Name / Height (cm) / Weight (kg) (all optional), Email, Password, Confirm Password | local state | — | — |
| Sign Up | `signUp` | Checks password match → `createUserWithEmailAndPassword` → `setDoc(users/{uid}, {name, height, weight})` → if avatar: resize 300×300 JPEG q0.5 → base64 → `setDoc(users/{uid}/private/avatarData, {imageData: "data:image/jpeg;base64,…"})` → `sendEmailVerification` → `signOut` | Mismatch: alert "Passwords do not match." Success: alert *"Account created! Please check your email to verify your account."* Error: alert "Registration failed: …". `loading` spinner. |
| Google sign-up image button | `signUpWithGoogle` | Google flow as above → `setDoc(users/{uid}, {name: firstName, height, weight, profilePictureUrl: user.photoURL})` | alerts as above |

**Home — `app/(auth)/home.tsx`** (BLE branch version)
| # | Element | Handler / action | Data | States |
|---|---|---|---|---|
| 1 | Header "Welcome!" | — | static. **Doesn't show the name.** | — |
| 2 | Avatar (top right) | `router.push("/(auth)/settings")`, **the Settings tab** (Profile is inline there) | `loadProfilePicture()` → `getDoc(users/{uid}/private/avatarData).imageData` | loading: small spinner. Empty: grey circle with "?". Error: `console.log` only. |
| 3 | Heart Rate card | **not tappable** | `<HeartRateDisplay variant="compact">` → `useLatestSensorReading("heart_rate")` | see HeartRateDisplay below |
| 4 | Device circle | `router.push("/(auth)/devices")` | `useBle().connection` | `connection.deviceName ?? "No Device"`. Status line: connected = "● Connected", disconnected = "Tap to connect", any other status = "Connecting...". Battery "🔋 n%" only when connected and `batteryLevel !== null`. |
| 5 | Activity | **not tappable** | Steps: `<StepsDisplay variant="compact">` (live). **Distance "4.8 km" and Floors "12" are hardcoded.** | steps loading = spinner, error = "--" |
| 6 | Sleep card | **not tappable** | **hardcoded** "7h 42m", "86/100" | — |
| 7 | Active Calories | **not tappable** | **hardcoded** "486 kcal" | — |
| 8 | Log Out button | `logout` → `signOut(getAuth())` | — | **No confirm dialog.** Error: alert "Logout failed: …" |

**Heart Rate tab — `app/(auth)/heart-rate.tsx`** (`main` is a placeholder)
| Element | Handler | Data | States |
|---|---|---|---|
| Large HR card | — | `<HeartRateDisplay variant="large">` | see below |
| 24h trend chart | — | `<SensorTrendChart type="heart_rate">` → `useSensorHistory("heart_rate", 24)`. Line chart, 30-min average buckets with gaps for no data, x-ticks every 6h, summary **Min / Avg / Max** | loading spinner. Error: "Couldn't load your history." Empty: *"No heart rate readings in the last 24 hours."* |
| `__DEV__` "Add Test Reading" | `addTestReading` → `addSensorReading(uid,"heart_rate",{value 60–99, source "manual"})` | — | alert on error |
| `__DEV__` "Add 24h of Sample Data" | `addSampleData` → `addSampleDay(uid)` | — | alert on error |
| *(no Alert Thresholds link, no zone, no connection status)* | | | |

**`HeartRateDisplay`** (`components/HeartRateDisplay.tsx`): loading = spinner. Error = *"Couldn't load your latest reading."* Empty = **"--" BPM + "No readings yet. Connect your wearable to start tracking."** Filled = rounded BPM, plus a "● Live" badge if the reading is ≤ 2 min old, plus "Updated {age}" (or **greyed "Last reading {age}" if > 10 min**). The large variant adds "from {deviceName}". It refreshes the age every 30 s (`useNow`).

**Fitness tab — `app/(auth)/fitness.tsx`** (`main` is a placeholder)
| Element | Handler | Data | States |
|---|---|---|---|
| Steps card | — | `<StepsDisplay variant="large">`: **Steps Today** (running daily total, 0 if the latest reading is from before midnight), "of 10,000 step goal", progress bar (`DAILY_STEP_GOAL = 10000`) | loading / error. Empty: *"No step data yet. Connect your wearable to start tracking."* Goal met: "🎉 Goal reached!". Otherwise: "Updated {age}". |
| Steps chart | — | `<SensorTrendChart type="steps">`: **steps per hour, last 24h**, bar chart, summary **Total** | Empty: *"No step data in the last 24 hours."* |
| `__DEV__` "Add Test Steps" / "Add 24h of Sample Data" | `addTestSteps`, `addSampleData` | — | — |
| *(no distance, floors or calories on this tab)* | | | |

**Sleep tab — `app/(auth)/sleep.tsx`:** placeholder text "Sleep" on both branches. **No sleep data source exists.**

**Devices — `app/(auth)/devices.tsx`** (BLE branch, hidden tab route). This is my "Pair Device" screen.
| Element | Handler | Data | States |
|---|---|---|---|
| "‹ Back" + title "Devices" | `router.back()` | — | — |
| ConnectionCard | Disconnect/Cancel → `disconnect` | `connection` | disconnected: "No device connected" + `connection.error` in red (the **failed** state). connecting: "Connecting (attempt n)...". reconnecting: "Connection lost, reconnecting (attempt n)...". discovering: "Setting up device...". connected: "● Connected" + battery, with a **Disconnect** button. disconnecting: "Disconnecting..." with no button. Pending states show **Cancel**. |
| Bluetooth warning banner | — | `describeBluetoothState(bluetoothState)` when not `PoweredOn`/`Unknown` | Off: "Bluetooth is turned off. Turn it on to find your device." Unauthorized: "Bluetooth permission was denied. Allow it in your phone's settings." Also Unsupported and Resetting. |
| Scan error banner | — | `scanError` (only if no BT problem) | — |
| "Nearby devices" + spinner | — | `isScanning` | — |
| Scan / Stop Scanning button | `startScan` / `stopScan` | — | disabled while a connection is pending. Scan auto-stops after 15 s (`SCAN_TIMEOUT_MS`). |
| Device rows (sorted by strongest RSSI) | `connect(device)` | `devices: ScannedDevice[]` | Row: "❤️" prefix if `isHeartRateDevice`, name, "{Strong ≥-60 / Good ≥-80 / Weak} signal · {rssi} dBm", action "Connect" or "Current". Disabled while busy. |
| Empty list | — | — | scanning: "Looking for devices...". Idle: *"Make sure your watch has Bluetooth on and is nearby, then tap Scan."* |
| On leave | `stopScan` (effect cleanup) | — | — |

Connect = up to 3 handshake attempts with backoff (1 s, 2 s). An unexpected drop auto-reconnects up to 3 times. Battery is read via GATT 0x180F. HR is via GATT 0x180D notifications, saved to Firestore at most once a minute.

**Settings tab — `app/(auth)/settings.tsx`** (a single scroll page with no sub-screens)
| Section | Element | Handler | Calls / data | States |
|---|---|---|---|---|
| — | Title "Settings" | — | — | full-screen spinner while `loadProfile` runs. Load error: Alert "Failed to load profile: …" |
| — | Avatar (100pt) or "?" | — | `users/{uid}/private/avatarData.imageData` | — |
| — | "Change Profile Picture" | `chooseProfilePicture` | picker → resize/base64 → `setDoc(users/{uid}/private/avatarData)` | denied: Alert "Permission Required". Success: Alert "Profile picture updated successfully!" Error: Alert. |
| Profile | Name, Height (cm), Weight (kg) inputs | local state | loaded from `getDoc(users/{uid})` | — |
| Profile | "Save Changes" | `saveProfile` | `updateDoc(users/{uid}, {name, height, weight})` | Alert success/error |
| Devices *(BLE branch, `components/DeviceSettingsSection.tsx`)* | Current device card | Disconnect/Cancel → `disconnect` | `connection` | "None" / name + "● Connected · 🔋 n%" / "Connecting..." / "Disconnecting..." |
| Devices | **Auto-connect** switch ("Reconnect to your last device when the app opens") | `toggleAutoConnect` → `setAutoConnect(enabled)` | `users/{uid}.autoConnectDevice` (default true) | Alert on save error |
| Devices | "Pair a New Device" | `router.push("/(auth)/devices")` | — | — |
| Devices | **Paired devices** list (`components/PairedDeviceList.tsx`) | Connect → `connect({id,name})`. Forget → confirm Alert *"Remove {name}? You'll need to scan for it again to reconnect."* → `forgetDevice(deviceId)` | `users/{uid}/devices/*` ordered by `lastConnectedAt desc` | Empty: *"No paired devices yet. Devices you connect to will appear here."* Row status: "● Connected" / "Connecting..." / "Last connected {age}" / "Not connected" |
| Account & Security | "New Email" input + "Change Email" | `changeEmail` | `verifyBeforeUpdateEmail(user, newEmail)` | empty: Alert "Please enter your new email address." Success: Alert *"Verification Email Sent"*. Error: Alert. |
| Account & Security | "Change Password" | `changePassword` | `sendPasswordResetEmail(auth, user.email)` | Success: Alert *"Password Reset Email Sent"*. Error: Alert. |
| Account | "Log Out" (red) | `logout` → **confirm Alert "Log Out / Are you sure you want to log out?"** [Cancel] [Log Out destructive] → `signOut` | — | Error: Alert "Logout failed: …" |

#### Firestore layout (as used by Android)

```
users/{uid}                         { name: string, height: string, weight: string,
                                      profilePictureUrl?: string (Google only),
                                      autoConnectDevice?: boolean }
users/{uid}/private/avatarData      { imageData: "data:image/jpeg;base64,…" }  (300×300)
users/{uid}/devices/{deviceId}      { deviceId, name, addedAt, lastConnectedAt }
users/{uid}/sensor_readings/{type}/readings/{id}
                                    { value, unit, timestamp, deviceId, deviceName,
                                      source: "ble"|"manual" }   type ∈ heart_rate | steps
```
`steps.value` is a **running daily total** that resets at midnight. `email` and `emailVerified` come from Firebase Auth, not Firestore. **There is nothing for sleep, distance, floors, calories, alert thresholds, alert history or preferences.**

#### Real data shapes vs my CLAUDE.md shapes

| Mine | Android's real shape | Proposed change |
|---|---|---|
| `DeviceStatus {id,name,connected,battery}` | `ConnectionState {status: 'disconnected'\|'connecting'\|'discovering'\|'connected'\|'reconnecting'\|'disconnecting', deviceId, deviceName, attempt, batteryLevel: number\|null, error: string\|null}` | Replace with `ConnectionState` (needed for the connecting/failed/reconnecting UI) |
| `ScannedDevice {id, name: string\|null, rssi}` | `{id, name: string, rssi, isHeartRateDevice: boolean}`. Unnamed devices are filtered out. | Match Android's |
| *(none)* | `PairedDevice {deviceId, name, addedAt: Date\|null, lastConnectedAt: Date\|null}` + `autoConnect: boolean` | Add |
| *(none)* | `SensorReading {id, type, value, unit, timestamp: Date, deviceName, source}` | Add. HR/steps cards need `timestamp` for Live/stale. |
| `UserProfile.height/weight?: number` | stored as **strings** | Keep `number` in the UI and convert in the container (Android bug 4) |
| `UserProfile.avatarData` | `private/avatarData.imageData` (data URI), or `profilePictureUrl` for Google | Keep `avatarData?: string` (URI) |
| `HealthSnapshot` (all numbers) | Doesn't exist. Only HR and steps are real. | Make `heartRate`, `steps` come from `SensorReading \| null`. Keep the rest as mock until Android adds sources. |
| `BleState` | `bluetoothState: State` (ble-plx enum) | Add `BluetoothState = 'unknown'\|'poweredOn'\|'poweredOff'\|'unauthorized'\|'unsupported'\|'resetting'` (no native import) |

#### Container prop names (named after Android handlers)

| Screen | My props → Android handler (file) |
|---|---|
| Landing/Auth | `onSignIn` → `signIn` (login.tsx). `onSignInWithGoogle` → `signInWithGoogle` (login.tsx). `onSignUp` → `signUp` (register.tsx). `onSignUpWithGoogle` → `signUpWithGoogle` (register.tsx). `onChooseProfilePicture` → `chooseProfilePicture` (register.tsx). `onSendPasswordReset` → *(no Android handler, uses `sendPasswordResetEmail` like `changePassword`)* |
| Home | `onLogout` → `logout` (home.tsx). `onOpenSettings` → `router.push('/(auth)/settings')`. `onOpenDevices` → `router.push('/(auth)/devices')`. `onOpenTab(tab)` → *(iOS-only, see Q1)*. Data: `profile` (`loadProfilePicture`), `connection` (`useBle().connection`), `heartRate`/`steps` (`useLatestSensorReading`). |
| Devices | `onStartScan` → `startScan`. `onStopScan` → `stopScan`. `onConnect(device)` → `connect`. `onDisconnect` → `disconnect`. `onForgetDevice(deviceId)` → `forgetDevice`. `onSetAutoConnect(enabled)` → `setAutoConnect` (all `services/ble/BleContext.tsx`). `onBack` → `router.back()`. |
| Settings / Profile | `onChooseProfilePicture` → `chooseProfilePicture`. `onSaveProfile` → `saveProfile`. `onChangeEmail(newEmail)` → `changeEmail`. `onChangePassword` → `changePassword`. `onLogout` → `logout` (all settings.tsx) |
| Heart Rate / Fitness | data via `useLatestSensorReading(type)` / `useSensorHistory(type, 24)`. Dev: `onAddTestReading` → `addTestReading`, `onAddTestSteps` → `addTestSteps`, `onAddSampleData` → `addSampleData` |

#### Differences from my plan (add to plan)

1. **Landing screen** (`index.tsx`, Log In / Register) comes before login. My Auth uses a segmented toggle, which is functionally equivalent. Keep the toggle but match the actions.
2. **Register collects more**: avatar (optional), name, height, weight (optional), email, password, **confirm password** ("Passwords do not match."). It also has a **Google sign-up** button separate from Google sign-in.
3. **Avatar tap goes to the Settings tab**, not a Profile sub-screen. In Android, Profile edit is inline in Settings.
4. **Home cards aren't tappable** in Android, except the avatar and device. My plan adds HR → Heart Rate, Activity → Fitness, Sleep → Sleep, Calories → Fitness.
5. **Home Log Out has no confirm** in Android. Settings Log Out does.
6. **Device states are richer**: connecting (attempt n), discovering ("Setting up device..."), reconnecting (attempt n), disconnecting, failed (error text), plus a **Cancel** for pending connects. The Home badge shows "Connecting..." for any pending state.
7. **Devices screen also needs**: Bluetooth unauthorized/unsupported/resetting banners, scan auto-stop at 15 s, a "❤️" HR-capable marker, text signal labels, "Current" on the connected row, and buttons disabled while busy.
8. **Settings → Devices section**: current device + Disconnect, **Auto-connect toggle**, "Pair a New Device", **Paired devices list with Connect / Forget (confirm)** and an empty state.
9. **Change Email** takes a new-email input and uses verify-before-update ("Verification Email Sent"). **Change Password** emails a reset link to the current address (no in-app password form).
10. **Heart Rate tab** = large live HR (Live badge, "Updated x ago", greyed when > 10 min, "from {device}") + **24h line trend with Min/Avg/Max**. Android has no zone pill, Alert Thresholds or resting-HR trend. Those are iOS additions.
11. **Fitness tab** = **Steps Today with 10,000 goal progress bar** + **24h steps-per-hour bar chart with Total**. Android has no distance, floors, calories or weekly chart there.
12. **Sleep tab**: Android placeholder, no data. My Sleep UI is ahead, all mock.
13. **Alerts, Notifications, Preferences, Alert Thresholds, Forgot password on login**: **no Android equivalent at all.** My containers stay mock in Phase 2 until someone writes the logic.
14. **`__DEV__` tools** on HR/Fitness ("Add Test Reading/Steps", "Add 24h of Sample Data"). Could map to buttons in my Previews menu.

#### Android bugs / issues to report to the team

1. **Inconsistent Home values**: steps come live from sensors (0 with no data) but distance 4.8 km, floors 12, sleep 7h 42m / 86 and 486 kcal are hardcoded. So a fresh account shows 0 steps next to 4.8 km and 12 floors.
2. **Google users have no avatar**: `signUpWithGoogle` stores `profilePictureUrl` on `users/{uid}`, but Home and Settings only read `private/avatarData`, so Google users always see "?".
3. **Google sign-up overwrites the profile**: `setDoc(users/{uid}, …)` without `merge` replaces an existing user's name/height/weight with the (empty) register form values every time they tap "Sign up with Google". It also wipes `autoConnectDevice`.
4. **Google sign-in (Login) never creates `users/{uid}`**, so `saveProfile`'s `updateDoc` then fails with "not-found" for that user.
5. **Height/weight are saved as strings**, with no numeric validation.
6. **Home Log Out has no confirmation**, unlike Settings.
7. **Home header ignores the user's name** ("Welcome!" always).
8. `webClientId` is duplicated in two files and there's no `iosClientId`. iOS Google sign-in will need the iOS client ID and URL scheme.
9. `ios.bundleIdentifier` (`com.galaxies.firebase`) doesn't match `android.package` (`com.dsswearablecool.firebase`). Settle it in the Phase 2 final step.
10. Errors use `alert()` / `console.log`, and Home's avatar load fails silently.

#### Open questions before Task 1

- **Q1:** Home taps. Should I match Android exactly (only avatar → Settings and device → Devices are tappable, with no confirm on Home Log Out), or keep my plan's extra card taps and Home confirm as iOS improvements and report them to Android?
- **Q2:** Avatar destination. Should it go to the Settings tab (Android) or a Settings → Profile sub-screen (my plan)?
- **Q3:** Should I treat `feature/ble-connection` as the target (it isn't merged into `main` yet)?
- **Q4:** Should I update the CLAUDE.md data shapes to Android's (`ConnectionState`, `ScannedDevice` with `isHeartRateDevice`, `PairedDevice`, `SensorReading`)?
- **Q5:** Rename "Pair Device" to **Devices** (to match the route) and fold in auto-connect + paired devices?
- **Q6:** The `ios/` folder isn't a git repo, but Rule 7 says to commit after each task. Should I `git init` here at the start of Task 1?

### 2026-10-03 — Decisions after wiring-map review

| Q | Decision |
|---|---|
| Q1 Home taps | Keep Android's structure (avatar → Settings tab, device → Devices) **and** the iOS extras (HR card → Heart Rate, Activity → Fitness, Sleep → Sleep, Log Out confirm) |
| Q2 Avatar / Profile | Avatar → Settings tab. **No Profile sub-screen.** Settings is one page like Android. |
| Q3 Target branch | `origin/feature/ble-connection`, read-only. Re-check merge status before Phase 2. |
| Q4 Data shapes | Replaced with Android's real shapes (see Data shapes). All mocks use them. |
| Q5 Devices | "Pair Device" renamed to **Devices**, with all six connection states + Cancel, scan results, auto-connect and paired devices |
| Q6 Git | `git init` in `ios/` at the start of Task 1, local only |

**Scope changes:** Heart Rate and Fitness match Android (plus a zone pill and Alert Thresholds link on HR). No distance, floors or calories anywhere in the real flow. Sleep defaults to "No sleep data yet" (the full design is preview only). Register matches Android's fields + Google sign-up. Login keeps Forgot password. Preferences is lowest priority.

**No backend yet (UI-only, mock containers; Jira DWBS22-367 / use case diagram):** Alert Thresholds, Notifications, Preferences, Sleep data, Forgot password on Login (it does reuse Android's `sendPasswordResetEmail`).

**Suggestions for the Android team (iOS UI improvements, not bugs):**
1. Make the Home cards tappable: Heart Rate → Heart Rate tab, Activity → Fitness tab, Sleep → Sleep tab.
2. Add a Log Out confirm on Home, as Settings already does.
3. Show the user's name in the Home greeting ("Good evening, Alex"), falling back to "Welcome!".
4. Add "Forgot password?" on Login, reusing `sendPasswordResetEmail` from `changePassword`.
5. Hide Home's hardcoded distance, floors, sleep and calories until real data sources exist.
6. Add Alert Thresholds / Notifications (Jira DWBS22-367). iOS has the UI ready for a shared alert engine.

Android bugs: see `ANDROID_BUGS.md`.

### 2026-10-03 — Task 1: Foundations (done)

- **Git:** `git init -b main` in `ios/` (local only, **no remote**). `.gitignore` already covered `node_modules/`, `.expo/` and `.env`. Initial commit `f907116` was made before any Task 1 change.
- **Data:** `src/data/types.ts` (Android shapes + iOS-only shapes) and `src/data/mocks.ts`:
  - Profiles: `mockProfile`, `mockProfileNoName`
  - Connection: `disconnectedConnection`, `connectedConnection`, `failedConnection`, `connectionIn(status, attempt)` for all six states, `bluetoothStates`
  - Devices: `mockScannedDevices`, `mockPairedDevices`
  - Latest reading: `emptyLatest`, `loadingLatest`, `errorLatest`, `heartRateLatest()`, `stepsLatest()`
  - History: `emptyHistory()`, `loadingHistory()`, `errorHistory()`, `heartRateHistory()` (24h, 15-min), `stepsHistory()` (hourly running totals ending at 6,842)
  - iOS-only: `mockSleep` (7h 42m / 86), `mockAlertThresholds`, `mockAlerts`, `defaultPreferences`
  - Bundles: `noDeviceMock` and `connectedMock`
  - Mocks are deterministic and contain no distance, floors or calories.
  - `src/data/sleep.ts` is still imported by `SleepScreen` and `HomeScreen`. It gets removed in Task 2.
- **Tabs:** `TabBar` now has `home`, `heart-rate`, `fitness`, `sleep`, `settings` (Feather `home`, `heart`, `activity`, `moon`, `settings`) with tab accessibility roles. Route types are in `src/navigation/routes.ts`.
  - `git mv`: `features/analytics/AnalyticsScreen` → `features/sleep/SleepScreen` (content unchanged until Task 2), and `features/monitoring/MonitoringScreen` → `features/heart-rate/HeartRateScreen` (placeholder).
  - New placeholder: `features/fitness/FitnessScreen`.
- **Stack:** `RootNavigator` keeps the tabs mounted and overlays the top `StackRoute` (`devices`, `alert-thresholds`, `notifications`, `preferences`, `previews`).
  - `Navigation = { openTab, push, back }`
  - Android hardware back pops the stack, then returns to Home.
  - Placeholder sub-screens are in `features/{devices,alerts,notifications,preferences}`. `PlaceholderScreen` now takes an optional `onBack` and uses `Header` + `EmptyState`.
  - Home's old area tiles are temporarily mapped (devices → Devices, monitoring → Heart Rate, analytics → Sleep, account → Settings) until the Task 2 rebuild.
- **Primitives:** `Header`, `ListRow`, `Toggle` (themed RN `Switch`), `Stepper` (VoiceOver adjustable), `EmptyState`, `ErrorBanner` (error/warning/info), `Avatar` ("?" fallback, loading, 44pt hit area).
  - New tokens: `colors.warning`, `colors.warningSurface`, and `layout.minTouch/rowHeight/iconBadge/avatar/avatarLarge`.
- **Previews:** `features/previews/` (`PreviewsScreen`, `registry.ts`, `types.ts`). It's reachable from Settings → Development → Previews, which only renders when `__DEV__`. The first entry is `components/ui/primitives.preview.tsx`. Each screen's preview is added to the registry as it is built.
- **Settings (interim):** props-only list (Pair a New Device, Alert Thresholds, Notifications, Preferences, Log Out, dev Previews). It gets replaced by the full Android-matching page in Task 3.
- `app.json`: `ios.supportsTablet: false`. Nothing else changed (bundle ID and Firebase untouched).
- **Checks:** `npm run typecheck` is clean, and `npx expo export` bundles for iOS and Android. Not yet clicked through on a device or emulator.
- Note: RN 0.86 removed `StyleSheet.absoluteFillObject`, so use explicit `position: 'absolute'` insets.

### 2026-10-04 — UI change 1 (remove zones) + UI change 2 (Home redesign)

**UI change 1: remove HR zones.** There was no separate brief for this, so I applied it as "no heart-rate zones anywhere". The zone pill is gone from the Heart Rate tab spec and Task 3, and from the Android-team suggestion list. The old Home zone label ("Resting / Fat burn / Cardio zone") is gone with the redesign. No zone code remains.

**UI change 2: Home rebuilt to the reference screenshot** (the Home table above replaces the old Task 2 Home spec):
- **Files in `features/home/`:**
  - Screen and cards: `HomeScreen` (props-only, `HomeScreenProps`), `HeartRateCard`, `DeviceActivityCard`, `SleepRecoveryCard`, `ActiveCaloriesCard`, `HelpSheet` (static)
  - Logic and data: `homeModel.ts` (pure: `restingRangeFrom` middle 60% of 24h readings, `stepsTodayFrom` per Android's midnight rule, `deviceViewFrom` mapping the six connection states + refreshing to CONNECTED/SYNCING/CONNECTING/RECONNECTING/DISCONNECTING/FAILED/No Device), `useHomeData.ts` (mock data, `useNow(30s)` clock, 1.2s refresh timer; the Phase 2 swap point), `HomeContainer.tsx`
  - Preview only: `useLiveHeartRate.ts`, `home.preview.tsx` (No device, Connecting, Syncing, Connected (live BPM), Failed)
- **New primitives:** `IconButton` (filled/outlined, Feather icon or glyph, `spinning`), `CardTitle` (icon badge + title + right slot, Feather or Ionicons), `ProgressBar`, `Waveform` (pulses when `active`, respects Reduce Motion), `Sheet` (bottom modal).
  - `Avatar` gained initials + `statusDot`, and `Pill` gained a `good` tier.
  - The tab bar has a raised centre Fitness button. `tabBarBaseHeight` now includes the lift, so all tab content clears it.
- **New tokens:** `colors.good/goodSurface/online/scrim` (palette `calmSurface`, `calmText`), `layout.statusDot/tabFab/tabFabLift/deviceRing/deviceRingBorder/progressHeight/stageBarHeight/waveformHeight/sheetHandle`, `elevation.fab`.
- **Data:** `DailyActivityExtras` type, plus `noActivityExtras` (all `null`, target 600) and `mockActivityExtras` (4.8 km, 12 floors, 486 kcal). `mockSleep.rating` is now "Optimal". Real flow: Distance/Floors "--", calories "--" with an empty bar, Sleep "No sleep data yet".
- **Shared helpers:** `src/lib/time.ts` (`formatAge`, `isSameDay`, `formatDuration`, `formatShortDate`, `LIVE_WITHIN_MS`, `STALE_AFTER_MS` copied from Android) and `src/lib/useNow.ts`.
- **iOS change vs Android, Log Out moved off Home:** Home has no Log Out and no bell. Log Out is now only in Settings, via `SettingsContainer`, with Android's exact confirm dialog ("Log Out" / "Are you sure you want to log out?" / Cancel / Log Out). This replaces suggestion 2 above. **Suggestion for the Android team:** drop Home's unconfirmed Log Out button and keep the Settings one.
- **iOS change vs Android, Home layout:** Android shows battery as "🔋 85%" under the device circle. iOS shows it inline as "CONNECTED · 85%".
- The old Home area tiles, `AreaKey` and Home's use of `src/data/sleep.ts` are removed. (`SleepScreen` still uses `sleep.ts` until the Task 2 Sleep refactor.)
- **Checks:** `npm run typecheck` is clean, and `npx expo export` bundles for iOS and Android. Not yet clicked through on a device.

### 2026-10-04 — Home header on a blue bar
- The Home header ("Welcome, {name}!", "Here is your daily summary", **?** help button) now sits on a solid `colors.accent` bar (the same blue as the Fitness tab button, "BPM", Live pill dot and progress bars). It uses `radius.xl` and `elevation.hero`, white title and 82%-white subtitle.
- `IconButton` gained an `onAccent` variant (translucent white fill, white outline, white glyph) for buttons on blue.
- New tokens: `colors.textOnAccentMuted`, `colors.onAccentSurface`, `colors.onAccentBorder`.
- Follow-up: the **?** help button moved off the blue bar into the top bar (order: ? · refresh · avatar), styled like refresh. The blue bar now holds only the greeting and subtitle. The `onAccent` IconButton variant stays available for future buttons on blue.
- Follow-up: the top bar now reads "{Good morning|afternoon|evening|night} · {date}" (`greetingFor` in `lib/time.ts`). The refresh/sync button moved from the top bar into card 2's device column. It shows only when connected (sync) or failed (retry), with the hint beside it, and is a separate control from the ring (which opens Devices) so VoiceOver can reach both. The top bar right is now **?** · avatar.
- Follow-up: the blue is no longer a rounded bar. It's now a **full-width blue background** for the top of Home. `Screen` gained `hero` / `heroBackground` props: the hero scrolls with the page, the status-bar area stays blue (light status bar), pull-down overscroll shows blue, and the content overlaps the hero by `spacing.huge` so the Heart Rate card sits on the blue edge. The greeting, date, title and subtitle are white/82%-white, and **?** uses `IconButton` `onAccent`. New token `layout.heroOverscroll`.
- Follow-up: **every page now has the blue top.** New primitive `HeroHeader` (white title, optional subtitle, white back button for sub-screens) goes in `Screen`'s `hero`.
  - Applied to Settings, Sleep (title + blurb moved into the hero) and `PlaceholderScreen`. That covers Heart Rate, Fitness, Devices, Alert Thresholds, Notifications and Preferences, which now scroll.
  - New `Screen` prop `heroOverlap` (default off): only Home overlaps cards onto the blue edge. Other pages start below it, so text never sits on the edge.
  - Not applied to Auth (pre-login) or the dev Previews tool.
  - **Rule for new screens:** use `Screen hero={<HeroHeader … />}` instead of a title Text or `Header`.

### 2026-10-04 — Task 2: Auth + Sleep refactors (done; Home approved and untouched)

**Auth** (`features/auth/`):
- **Files:**
  - `AuthScreen.tsx`: props-only (`AuthScreenProps`), no Firebase. Blue hero (brand mark, title, blurb) + one white card with the Log in/Register switch and the form, or a confirmation card.
  - `useAuthForm.ts`: all state and validation. Handlers named after Android's: `onSignIn`/`signIn`, `onSignInWithGoogle`, `onSignUp`, `onSignUpWithGoogle`, `onSendPasswordReset`, `onChooseProfilePicture`.
  - `AuthContainer.tsx` and `auth.preview.tsx` (9 states).
  - `authService.ts`: the only auth file importing `firebase/auth` (plus the existing `useAuthSession`).
- **Login:**
  - Email and password.
  - Unverified accounts get Android's "Please verify your email before signing in." as an inline warning banner, not `alert()`.
  - "Forgot password?" sends the same reset email as Android's `changePassword` and shows a "Password reset email sent" card. With no email typed, it shows a field error.
  - "Sign in with Google" button.
- **Register:** Android's fields. Optional avatar (large `Avatar` with initials), optional name, height (cm) and weight (kg) side by side (validated 50–250 / 20–300, decimals allowed), email, password (≥ 6), confirm password ("Passwords do not match."). "Sign up" then shows a "Verification email sent" card with "Back to log in" (email kept). Separate "Sign up with Google".
- **Two auth services behind one interface:**
  - **Firebase** (JS SDK, only if keys exist): sign-in checks `emailVerified` and signs out if not. Sign-up sends verification, then signs out. Height, weight and avatar are not stored until Phase 2 (Android's Firestore helpers).
  - **Preview** (current, no keys): simulates delays. Any email containing "unverified" triggers the verify-email state. Sign in / Google enters the app with a name from the email.
  - Google returns `auth/google-unavailable` with the Firebase JS SDK (needs Android's native Google Sign-In in Phase 2).
- **Avatar picker:** a Phase 1 stub showing an info banner. Adding a real picker needs `expo-image-picker` (Expo Go–compatible, and Android uses it). Not added yet; awaiting your OK.
- **Primitive changes:** `Button` gained an `ionicon` prop (Google logo). Auth types (`AuthFormValues`, `Notice`, `AuthConfirmation`, `AuthBusy`) live in `authErrors.ts`.

**Sleep** (`features/sleep/`):
- `SleepScreen.tsx` is props-only (`sleep: SleepSummary | null`, `trends: SleepTrends | null`, `loading`, `error`, `onRetry?`), with a blue hero "Sleep" and white cards:
  - **Last night:** rating pill, duration + score, window, stage composition bar and stage tracks
  - **Week/Month switch:** Avg score and Avg sleep cards, Sleep score chart card, Hours asleep chart card
  - **States:** empty "No sleep data yet" card, loading card, error banner with Retry
- `useSleepData.ts` returns no data, since there's no source (Android's Sleep tab is a placeholder). `SleepContainer.tsx` feeds the screen. `sleep.preview.tsx` has Empty, Loading, Error and Filled. `sleepStages.ts` holds stage labels and colours.
- **Resting HR chart removed from Sleep.** Its series is now `mockRestingHrTrends` in `mocks.ts`, for the Heart Rate tab in Task 3.
- `src/data/sleep.ts` deleted. Its series moved to `mockSleepTrends` (+ `TrendPoint`, `SleepTrends`, `RestingHrTrends` types).

**Checks:** `npm run typecheck` is clean, `npx expo export` bundles for iOS and Android, and `git diff` shows no change to `features/home`, `Screen` or `HeroHeader`. Not yet clicked through on a device.

### 2026-10-04 — DSS Wearables logo
- **New logo** (from Tarun's reference): a rounded blue chevron (gradient `blue500` → `blue400`) on a light-blue `blue50` rounded square.
- **Generator:** `scripts/generate-logo.mjs` draws it mathematically with anti-aliased edges and writes every asset. Run `node scripts/generate-logo.mjs`. It uses `pngjs` (already in `node_modules` via Expo, not a direct dependency).
- **Assets written:**
  - `icon.png`: iOS app icon, 1024, opaque, full-bleed
  - `logo.png`: in-app, 512, rounded corners
  - `splash-icon.png`: mark only, transparent
  - `favicon.png`
  - `android-icon-foreground/background/monochrome.png`: mark inside the adaptive-icon safe zone
- **New primitive `Logo`** (`assets/logo.png`, default 44pt, labelled for VoiceOver). The login page now uses it in place of the old activity-icon box. Home is unchanged (it has no logo).
- **Not wired:** `app.json` has no splash image configured (`expo-splash-screen` has no options), so `splash-icon.png` is ready but unused. Wiring it needs an `app.json` change, which Rule 8 limits to `supportsTablet`. Awaiting OK.

### 2026-10-04 — Plan change: Phase 2 happens in DSS-iOS-UI
- Phase 2 (wiring real logic) now happens **in this repo**, not in a copy of Kevin's repo. Kevin's repo stays read-only, as a reference to port logic from (with source paths logged). Merging into Kevin's repo is the new **Phase 3**, blocked on the team decision "iOS-only UI vs replace the Android UI".
- `origin` was checked and is already `https://github.com/TarunKrishnan6/DSS-iOS-UI.git`, so it's unchanged. Rule: never push; Tarun pushes. PL uses `fix/<name>` branches + pull requests, or `BUGS.md`.
- Added the "Phase 2: BLE on iOS" plan (from the Task 0 reading of `feature/ble-connection`), the Phase 2 Final step (Firebase, incl. the Google `REVERSED_CLIENT_ID` URL scheme), and Phase 3. Task 4 gained the app icon / splash / name check.
- Phase 1 decisions and all earlier log entries are unchanged.

### 2026-10-04 — Task 3, screen 1: Settings (done, awaiting review)
- **`SettingsScreen`** (props-only, `SettingsScreenProps`) is one page with a blue hero ("Settings" + account email) and white cards under section labels:
  - **Profile:** large avatar + "Change Profile Picture", Name, Height/Weight, Save Changes (saving spinner, range validation, success/error banner)
  - **Devices:** current device + Disconnect/Cancel, Auto-connect toggle, Pair a New Device → Devices, Paired devices with Connect / Forget (+ empty state)
  - **Account & Security:** New Email + Change Email (verify-before-update), Change Password (reset email to the account address)
  - **Alerts & Preferences:** rows to the sub-screens
  - **Log Out** (confirm)
  - **Previews** (`__DEV__` only)
- **`useSettingsData.ts`** owns all logic: profile load/save, validation via the new `src/lib/measures.ts` (shared with Auth), account actions, and Android's two confirm dialogs (Forget Device, Log Out). Props use Android's names: `onChooseProfilePicture`, `onSaveProfile`, `onChangeEmail`, `onChangePassword`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onOpenDevices`, `onLogout`.
- **`accountService.ts`:** a Firebase JS SDK version (`verifyBeforeUpdateEmail`, `sendPasswordResetEmail`, `updateProfile`) plus a preview mock. The preview keeps the edited profile for the session. Phase 2 moves profile data to `users/{uid}` via Android's helpers.
- **`features/devices/BleProvider.tsx`:** a mock with **exactly Android's `useBle()` API**. It's mounted around the logged-in app (like Android's `(auth)/_layout`).
  - Simulates Android's 3 attempts + 1 s/2 s backoff, connecting → discovering → connected (85% battery), disconnecting, cancel via token, and the 15 s scan.
  - **Any device named "Polar…" always fails** (FAILED state for testing).
  - Starts with the two mock paired devices, disconnected.
  - **Phase 2:** swap this file for the ported `services/ble/BleContext.tsx`.
- **Reusable device components** (for the Devices screen next): `CurrentDevice.tsx`, `PairedDeviceList.tsx`.
- **Primitive changes:** `Button` gained size `sm` and variant `destructive`, and text-style buttons now dim when disabled. `ErrorBanner` gained tone `success`.
- **Not done, needs OK:**
  1. Home still reads mock "no device" data, so connecting from Settings doesn't change Home yet. Pointing `useHomeData` at `useBle()` / the saved profile changes Home's data, not its UI.
  2. Photo picker (expo-image-picker).
- **Checks:** typecheck clean, iOS + Android bundles build, `features/home` unchanged.

### 2026-10-04 — Textured blue banner (all hero pages)
- New primitive **`HeroBackdrop`**: a diagonal gradient (`colors.heroGradient`, blue500 → blue600), three faint white concentric rings top-right (`colors.heroRing`, echoing the logo's guide circles) and a soft white glow lower-left (`colors.heroGlow`). Sizes come from `layout.heroBackdrop/heroRingCenterY/heroRingInset`.
- **`Screen` hero mode reworked:**
  - The backdrop is **fixed** behind the page, and the hero content (transparent) scrolls over it.
  - The grey body is an absolutely positioned "sheet" that slides up over the texture. It starts below the overlap on Home, so the cards still straddle the edge.
  - A status-bar strip renders the same backdrop, so there's no seam when content scrolls under the clock.
  - The unused `heroBackground` prop was removed. Applies to every page using `hero`: Home, Auth, Heart Rate, Fitness, Sleep, Settings and the sub-screens.
- **Checked** with a headless-Edge screenshot of the web export (sign-in page). Typecheck clean, iOS + Android bundles build. Home's screen code is unchanged; only the shared banner background changed, as requested.

### 2026-10-04 — Task 3, screen 2: Devices (done, awaiting review)
- **`DevicesScreen`** (props-only, `DevicesScreenProps`; Android `app/(auth)/devices.tsx`). Blue hero "Devices" with back, then:
  - **`ConnectionCard`:** a ring (grey idle / blue connected / spinner pending / red failed) and Android's exact texts. "Connecting (attempt n)…", "Connection lost, reconnecting (attempt n)…", "Setting up device…", "● Connected" + battery, "Disconnecting…", "No device connected" + red error. **Cancel** while pending, **Disconnect** when connected.
  - **Bluetooth banners:** a warning banner for PoweredOff / Unauthorized / Unsupported / Resetting (Android's `describeBluetoothState` wording), and a scan error banner when there's no Bluetooth problem.
  - **Nearby devices:** Scan for Devices / Stop Scanning (disabled while busy or on a Bluetooth problem), a spinner while scanning, and rows sorted by RSSI. Each row has a heart marker for heart-rate devices, `SignalBars` + "Strong/Good/Weak signal · −54 dBm", and "Connect" / "Current". Empty text for scanning and idle.
  - **Paired devices:** the Auto-connect toggle + the shared `PairedDeviceList` (Connect / Forget with confirm).
- **`DevicesContainer`** reads `useBle()` and stops scanning on leave (as Android does). Prop names map 1:1 to `useBle()`: `onStartScan/onStopScan/onConnect/onDisconnect/onForgetDevice/onSetAutoConnect/onBack`.
- **`devices.preview.tsx`** has 12 states: Idle, Scanning, Results, Connecting, Setting up, Connected, Reconnecting, Disconnecting, Failed, Bluetooth off, Permission denied, No paired.
- **Shared code:** `devices/bluetoothText.ts` (Bluetooth messages, signal strength, `isBusy`, `confirmForget`, now also used by Settings). New primitive `SignalBars`.
- The mock BLE is always `PoweredOn`, so the Bluetooth banners are only visible in Previews until Phase 2.
- **Checks:** typecheck clean, iOS + Android bundles build, `features/home` unchanged.

### 2026-10-04 — Task 3, screen 3: Fitness (done, awaiting review; Devices approved)
- **`FitnessScreen`** (props-only, `FitnessScreenProps`; Android `app/(auth)/fitness.tsx`). Blue hero "Fitness", then:
  - **Steps Today card** (Android `StepsDisplay` large): big number, "of 10,000 step goal", progress bar (green when reached), and a % pill. Then "No step data yet. Connect your wearable to start tracking." / "Goal reached!" (icon, no emoji) / "Updated x ago". States: loading, error.
  - **Steps per Hour card** (Android `SensorTrendChart` steps): Total, 24 hourly bars, 6-hour time ticks. Empty "No step data in the last 24 hours.", loading, error.
  - **`__DEV__` Development card:** "Add Test Steps" / "Add 24h of Sample Data", same as Android's dev buttons, in memory.
- **`useFitnessData.ts`:** mock, starts empty (no device). Dev actions update both the latest reading and the history. `FitnessContainer` feeds the screen.
- **Ported:** `src/lib/trends.ts` ← Android `services/sensors/trends.ts` (`averageByBucket`, `stepsByBucket`, same maths) + chart helpers (`niceCeil`, `sixHourTicks`, `formatHour`) adapted from `components/SensorTrendChart.tsx`. `DAILY_STEP_GOAL = 10000` ← `components/StepsDisplay.tsx`.
- **New primitive** `TimeBarChart` (hourly bars, axis max/0, gridlines, ticks; one accessibility summary). New token `layout.chartHeight`.
- **Mock fix:** `heartRateHistory`/`stepsHistory` readings now sit strictly inside the 24 h window. A reading at exactly "now" fell outside the last bucket and was dropped from totals.
- **Preview** `fitness.preview.tsx`: No data, Loading, Error, Filled, Goal reached. Checked visually via a temporary web-export screenshot (entry file restored afterwards).
- **Known:** at night the mock still puts the full "today" total into the hours after midnight (one tall bar). Real data won't.
- **Checks:** typecheck clean, iOS + Android bundles build, `features/home` unchanged.

### 2026-10-04 — Task 3, screen 4: Heart Rate (done, awaiting review; Fitness approved)
- **`HeartRateScreen`** (props-only, `HeartRateScreenProps`; Android `app/(auth)/heart-rate.tsx`). Blue hero "Heart Rate", then:
  - **Live card** (Android `HeartRateDisplay` large): hero BPM + "BPM", "Live" pill (≤ 2 min) or "Last seen x ago", "Updated x ago" or greyed "Last reading x ago" (> 10 min), "from {device}", and a waveform that pulses when live. Empty: "--" + Android's "No readings yet…". Loading, error. **No zones** (UI change 1).
  - **Last 24 hours card** (Android `SensorTrendChart` heart_rate): Min / Avg / Max over 30-minute averages (`averageByBucket`) + line chart with gaps for missing data. Empty: "No heart rate readings in the last 24 hours."
  - **Resting heart rate card** (iOS extra, moved from Sleep in Task 2): Week/Month bars. Only shown when `restingTrends` is set, which is `null` in the real flow (no source).
  - **Alert Thresholds** row → `alert-thresholds`.
  - **`__DEV__` Development card:** "Add Test Reading" / "Add 24h of Sample Data" (Android's dev buttons), in memory.
- **`useHeartRateData.ts`:** mock, starts empty. Dev actions update the latest reading + history; sample data stamps the newest reading as live. `HeartRateContainer` passes `onOpenAlertThresholds`.
- **New primitive `TimeLineChart`:** a line drawn with rotated Views (no `react-native-svg`), y-range padded to tens, 6-hour ticks, gaps on null buckets, one accessibility summary.
- **Preview** `heartRate.preview.tsx`: No data, Loading, Error, Live (BPM ticking via `useLiveHeartRate`, + resting trends), Stale (42 min old). Checked visually via a temporary web-export screenshot (entry restored).
- **Checks:** typecheck clean, iOS + Android bundles build, `features/home` unchanged.

### 2026-10-04 — Heart Rate approved (tested on phone) + fix, shared readings, image picker
1. **Bug fix: test data was labelled as the watch.** Readings now always carry `source` (`'ble' | 'manual'`, as on Android). "Add Test Reading" / "Add Test Steps" store `deviceName: 'Test data'`, and "Add 24h of Sample Data" stores `'Sample data'` (Android's names), all `source: 'manual'`. Display goes through `src/lib/sensors/sourceLabel.ts`: any `manual` reading shows **"from Test data"**; only `ble` readings show the device name.
2. **Shared readings store (mock, Android interface):**
   - `src/lib/sensors/readings.ts` ← Android `services/sensors/readings.ts`: same functions (`subscribeToLatestReading`, `subscribeToReadingsSince`, `addSensorReading`, `addSampleDay`) and arguments (`uid`, `type`, …), in memory instead of Firestore. **Phase 2 swaps only this file.**
   - `src/lib/sensors/useSensorReadings.ts` ← Android `useLatestSensorReading.ts` + `useSensorHistory.ts`: same hooks and states (`SENSOR_UID` placeholder until `getAuth().currentUser`). `useSensorHistory` keeps a reading stamped exactly at the window end inside the last bucket; Android's `windowEnd = max(end, latest)` drops it (minor, Android has the same edge).
   - **Heart Rate tab, Fitness tab and Home's heart rate card** (via `useHomeData` only; Home layout untouched) all read the same store, so test readings show on Home and the Heart Rate tab together. Home's resting range now comes from the store's 24 h heart-rate history.
   - Home's steps, connection and profile are still mocks (not requested).
   - Sample data is now Android's random `addSampleDay` (adds both heart rate and steps), replacing the deterministic mock for the real flow. Previews still use `mocks.ts`.
3. **`expo-image-picker ~57.0.20`** (`npx expo install`; included in Expo Go). `src/lib/pickImage.ts` uses Android's permission request + options (`mediaTypes: ['images']`, `allowsEditing`, `aspect [1,1]`, `quality 1`).
   - **Register:** the chosen photo shows in the avatar. If denied: "Please allow access to your photos." (Android).
   - **Settings:** it saves straight away like Android → avatar updates, "Profile picture updated successfully!". If denied: an error banner.
   - **Phase 2:**
     - Resize to 300×300 JPEG → base64 → `users/{uid}/private/avatarData`.
     - **The iOS permission strings go in the Phase 2 `app.json` `ios` block:** `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription`, via the `expo-image-picker` plugin (`photosPermission`, `cameraPermission`). No `app.json` change now (Rule 8).
- **Checks:** typecheck clean, iOS + Android bundles build. Only `features/home/useHomeData.ts` changed in Home.

### 2026-10-04 — Share steps with Home
- Home's "Today's Activity → Steps" now reads `useLatestSensorReading('steps')` from the shared store (same as Fitness), via `useHomeData` only. Home's existing `stepsTodayFrom` applies Android's midnight rule, so Home and Fitness always show the same count. Distance/Floors stay "--". Device status and profile on Home stay placeholders until they're wired to `useBle()`/profile. Home layout untouched.

### 2026-10-04 — Task 3, screen 5: Alert Thresholds (done, awaiting review) — **iOS only, no backend yet**
- **`AlertThresholdsScreen`** (props-only, `AlertThresholdsScreenProps`). Blue hero with back, then:
  - "Heart rate alerts" toggle
  - "Your range" card: a range bar over 30–220 BPM (amber below / green band / red above) + Minimum and Maximum steppers (5 BPM steps, VoiceOver adjustable). It dims and locks when alerts are off. Validation error banner.
  - Info card explaining when alerts fire (below min / above max, at most once a minute per type, shown in Notifications)
  - Success/error notice, and a Save button (disabled until changed or while invalid; reads "✓ Saved" when clean)
- **Validation (`src/lib/alerts/thresholds.ts`):** minimum 30–100, maximum 80–220, maximum ≥ minimum + 10.
- **`useAlertThresholds.ts`:** loads/saves through `src/lib/alerts/thresholds.ts`. That's an in-memory stand-in for **`users/{uid}/settings/alerts`** with `subscribeToAlertThresholds` / `saveAlertThresholds`, so Phase 2 swaps only that file and the alert engine reads the same values. Defaults: `mockAlertThresholds` (on, 50–120). **Back with unsaved changes asks "Discard changes?"** (Android's hardware back still goes straight back; minor).
- **Preview** `alertThresholds.preview.tsx`: Saved, Loading, Load error, Edited, Invalid, Saving/saved, Off. Visual check via temporary web screenshot (entry restored).
- **Gap for the Android team** (same as the Phase 2 alert-engine note): Android has no thresholds or alerts. This screen and its store are ready to share.
- **Checks:** typecheck clean, iOS + Android bundles build, Home and `app.json` untouched.

### 2026-10-04 — Guard hardware back on unsaved changes (Steps on Home + Alert Thresholds approved)
- **New `src/navigation/unsavedChanges.tsx`:** a reusable guard.
  - The navigator wraps the active tab and the top stacked screen each in a `GuardScope` (`tab:<key>` / `stack:<index>:<route>`).
  - A container calls **`useUnsavedChangesGuard(dirty, message)`**. While dirty, **every way of leaving that screen** shows "Discard changes?" with **Keep editing / Discard**: ‹ back (`navigation.back`), **Android hardware back**, and switching tabs (`navigation.openTab`, incl. hardware back from a tab to Home).
  - Scopes mean a dirty screen underneath (e.g. Settings) doesn't prompt when you leave a clean sub-screen on top of it.
- **Using it:** Alert Thresholds (its own dialog removed; now shared), and the **Settings profile form** (name/height/weight differ from the saved profile: "Your profile changes haven't been saved."). Preferences will use it when built.
- **Not guarded (by design):** Log Out, and pushing a sub-screen on top (the tab stays mounted, so edits survive).

### 2026-10-04 — Task 3, screen 6: Notifications (done, awaiting review) — **iOS only, no backend yet**
- **`NotificationsScreen`** (props-only, `NotificationsScreenProps`). Blue hero with back + a white trash `IconButton` ("Clear all alerts", shown only when there are alerts).
  - Alerts are **grouped by day** (Today / Yesterday / "Wed, Sep 30"). Each row has a type icon (red ↑ high, amber ↓ low), "High/Low heart rate", the message, the value in BPM (coloured by type) and the time.
  - **Empty state:** "No alerts yet" + **Set alert thresholds** → `alert-thresholds`. Loading, error + Retry.
  - `__DEV__` "Add Test Alert".
- **`src/lib/alerts/alertHistory.ts`:** an in-memory stand-in for the Phase 2 alert history (e.g. `users/{uid}/alerts`) with `subscribeToAlerts` / `addAlert` / `clearAlerts`. **The Phase 2 alert engine writes here; this screen only reads.** It starts empty in the real flow.
- **`useNotifications.ts`:** subscribes, "Clear all" confirm dialog. The dev "Add Test Alert" uses the **saved thresholds** from `lib/alerts/thresholds.ts` (e.g. above 130 if Max was saved as 130), simulating what the engine will write.
- **Preview** `notifications.preview.tsx`: Empty, Loading, Error, Filled (4 alerts over 3 days). Visual check via temporary web screenshot (entry restored).
- **Checks:** typecheck clean, iOS + Android bundles build, Home and `app.json` untouched.

### 2026-10-04 — UI change: Profile split out of Settings (**iOS difference from Android**)
- **Overrides decision Q2** (avatar → Settings tab, Settings as one page). Android keeps profile, account and app settings on one Settings page, and its Home avatar opens that tab. iOS now has a separate **Profile** screen. **Suggestion for the Android team:** the same split keeps Settings short.
- **Profile** (`features/profile/`, stack route `profile`, blue hero "Profile" + email + ‹):
  - "Personal details" card: avatar + Change Profile Picture (image picker, saves straight away), Name, Height/Weight, Save Changes. Save is disabled until something changes, shows "✓ Saved" when clean, and validates as before. **Unsaved-changes guard** on ‹, hardware back and tab switch.
  - "Account" card: New Email + Change Email, Change Password.
- **Settings tab:** a Profile row at the top (small avatar, name, email, chevron → Profile), Devices, Alerts & Preferences, Development (`__DEV__`), Log Out (confirm). The profile form, account card and their guard were removed.
- **Home:** the avatar now pushes `profile`. Only the callback was renamed (`onOpenSettings` → `onOpenProfile`) along with its VoiceOver label ("Open profile"). No layout change.
- **Code moved, not rewritten:**
  - `accountService.ts` was `git mv`'d to `features/profile/`.
  - The profile, picture and account logic moved from `useSettingsData` into `useProfileData.ts` (same handlers and Android names).
  - New `ProfileProvider` (mounted next to `BleProvider`) holds the one loaded profile, so the Settings row and the Profile screen stay in sync after a save or photo change.
  - `useSettingsData` now only covers devices + logout.
- **Previews:** new **Profile** (Default, Loading, Load error, Unsaved changes, Saving, Errors, Account notices). Settings preview updated (Default, Profile loading, Connected, Connecting, Failed/no devices).
- Home's avatar/greeting still use the session display name (Home profile stays a placeholder), so a photo or name changed in Profile doesn't show on Home yet.
- **Checks:** typecheck clean, iOS + Android bundles build.
- Follow-up: removed the made-up `tarun@example.com` from the mock profile (`mockProfile.email` is now `''`). In preview mode, Profile shows no email under the header, the password hint says "your account email", the Settings Profile row shows just the name, and Change Password says "Password reset email sent." without an address. A real signed-in account still shows its own email. (Form-input examples in the Auth and primitives previews are unchanged.)

### 2026-10-04 — Task 3, screen 7: Preferences (done, awaiting review; Profile split approved) — **iOS only**
- **`PreferencesScreen`** (props-only). Blue hero with back, then:
  - **Text size:** Default / Large / X-Large, with a live sample of the chosen size before saving
  - **Units:** Metric / Imperial, with a hint of what changes
  - **Alert notifications** toggle
  - Save (disabled until changed, "✓ Saved" when clean, "Preferences saved."). **Unsaved-changes guard** on ‹, hardware back and tab switch.
- **Text size is real, app-wide:**
  - `theme/typography.ts` gained `TEXT_SCALES` (1 / 1.15 / 1.3), `scaledType()` and `applyTextScale()`, which rescales the shared `type` tokens in place.
  - `PreferencesProvider` (in `App.tsx`, around sign-in and the app) applies the scale on load and save, and `RootNavigator` subscribes so the whole tree re-renders with the new sizes. There's no remount, so navigation state is kept.
  - It multiplies on top of iOS Dynamic Type.
  - Checked visually: Home at X-Large via temporary web screenshot (entry restored).
- **Units:**
  - **Applied to Profile:** height in inches / weight in pounds, with labels, validation ranges and form values converted. Storage stays metric (cm/kg), so the data shape matches Android. Conversions are in `lib/measures.ts` (`heightFor/weightFor/heightToCm/weightToKg/heightRangeFor/weightRangeFor/unitLabels`).
  - **Not yet applied:** Register (still cm/kg) and Home distance (shows "--" anyway; changing its "km" label touches Home's card).
- **Notifications toggle:** saved now. **The Phase 2 alert engine must check it** before scheduling an `expo-notifications` local notification. Alerts are still recorded in Notifications either way.
- **Storage:** `lib/preferences/preferencesStore.ts` on `AsyncStorage` (device-local, survives app restarts; Expo Go compatible).
- **Previews:** Preferences (Default, Edited, Saving/saved), and Profile gained "Imperial".
- **Task 3 complete.** Next is Task 4 (polish and sign-off), after approval.
- **Checks:** typecheck clean, iOS + Android bundles build, Home and `app.json` untouched.

### 2026-10-04 — Test data fills Home's Activity and Sleep & Recovery
- **Report:** Home's Distance, Floors and Sleep & Recovery stayed empty after adding test data, and Steps showed 0.
- **Steps 0 is correct for the sample data.** Android's `addSampleDay` only walks 7am–10pm and resets at midnight, so before 7am "today" is 0 on both Home and Fitness. "Add Test Steps" adds today's steps immediately.
- **New `src/lib/sensors/testExtras.ts`** (iOS, Phase 1, test data only):
  - `testActivityFrom(stepsReading, now)`: when today's steps come from the dev buttons (`source: 'manual'`), Distance (steps × 0.762 m), Floors (1 per 700 steps) and Active Calories (0.045 kcal/step, target 600) are derived from **those same steps**. That keeps them consistent and avoids Android's "0 steps next to 4.8 km" (ANDROID_BUGS #5). Real `ble` readings keep "--" (no Android source).
  - `addSampleSleep()` / `useSampleSleep()`: "Add 24h of Sample Data" (on Heart Rate or Fitness) also adds a sample night (`mockSleep`, 7h 42m, 86 "Optimal") + week/month trends. Home's Sleep & Recovery card and the **Sleep tab** show it. Otherwise both stay "No sleep data yet".
- **Changed:** only `useHomeData` / `useSleepData` / the two dev-action hooks. Home and Sleep layouts are untouched. Phase 2: remove `testExtras` once real sources exist.

### 2026-10-04 — Task 3 complete (approved)
- Every Task 3 screen is approved after phone testing: Settings → Profile/Settings split, Devices, Fitness, Heart Rate, Alert Thresholds, Notifications, Preferences.
- Two units gaps were moved into Task 4's checklist: Register cm/kg vs Imperial, and the Home distance "km" label.

### 2026-10-04 — Home device status and profile wired to the shared providers
- **Gap from earlier tasks:** Home's device card and profile were left as placeholders "until the Devices screen". Devices and the Profile split are done now, so Home is wired (data hook only, layout untouched).
- **`useHomeData`** now reads:
  - **`useBle().connection`**: same simulated Bluetooth as Devices/Settings. Galaxy Watch8 · CONNECTED · 85%, CONNECTING (attempt n), SYNCING, FAILED · Tap to retry, plus the green dot on the avatar.
  - **`useProfile()`**: the photo and name from Profile show on Home's avatar and greeting. It falls back to the sign-in name while loading.
- **Sync button:**
  - Connected: brief SYNCING spin, as before.
  - FAILED: retries the most recent paired device (like Android's auto-connect).
- **Not added:** the simulated watch doesn't generate heart-rate readings while connected (Android saves one every 60 s from a real watch). The Heart Rate card still uses the test buttons until Phase 2.
- Follow-up (Home tweak, requested): removed the "Tap to sync" / "Syncing…" text beside the sync button (the status line already shows CONNECTED / SYNCING; "Tap to retry" stays for FAILED), and centred the "TODAY'S ACTIVITY" heading over its column.

### 2026-10-04 — Task 4: polish and UI Sign-off (awaiting phone click-through + approval)

**Polish done:**
- **Register follows the units preference:** Height (in) / Weight (lb), converted ranges ("Enter a height in inches between 20 and 98"), saved as cm/kg. `validateAuthInput(mode, values, units)`; the `PreferencesProvider` already wraps sign-in.
- **Home distance follows units:** label "km" or "mi" with the value converted (`distanceFor`). Home gets a `units` prop from `useHomeData`, no layout change. New Home preview "Imperial", Auth preview "Register imperial".
- **Warnings check:** a dev web build mounted every preview state of every screen (73 states) and captured the console. **No React warnings** (keys, props, unmounted updates).
  - Fixed: "props.pointerEvents is deprecated", moved to `style.pointerEvents` in `Screen` and `HeroBackdrop`.
  - Web-only, not applicable on device: password field not in a `<form>`, `useNativeDriver` unsupported, `shadow*` → `boxShadow`.
- **Still open in Task 4:**
  - Tarun's phone click-through (all screens/states) + yellow-box check on device
  - Android side-by-side
  - Sizes at 375 / 430 widths (web screenshots can't verify reliably: the headless viewport clips; needs a small device/emulator or PL's simulator)
  - Splash wiring (`app.json`, needs OK)
  - App name check in a real build

**Android comparison (vs `feature/ble-connection`). HISTORICAL:** this compares against Kevin's old 5-tab UI. Since 2026-10-05 the 3-tab structure is the agreed UI for both platforms, so these "iOS diff" rows describe what Phase 3 changes on Android.

| Area | Android | iOS | Same? |
|---|---|---|---|
| Tabs | Home, Heart Rate, Fitness, Sleep, Settings (Ionicons) | Same 5 in the same order (Feather); Fitness is a raised centre button | ✓ structure |
| Home order | Header → avatar → Heart Rate → Device + Activity → Sleep → Calories → Log Out | Same order, minus Log Out (moved to Settings), plus Help "?" | ✓ (iOS diffs logged) |
| Avatar tap | Settings tab | **Profile screen** (iOS split) | iOS diff |
| Device tap | Devices | Devices | ✓ |
| HR / Activity / Sleep / Calories taps | not tappable | → Heart Rate / Fitness / Sleep / Fitness | iOS improvement |
| Heart Rate tab | live BPM, Live/Updated/stale, from device, 24 h line Min/Avg/Max, dev buttons | same + Alert Thresholds link + resting trend (data only) | ✓ + extras |
| Fitness tab | Steps Today vs 10,000, 24 h steps/hour + Total, dev buttons | same | ✓ |
| Sleep tab | placeholder | full design, empty by default | iOS ahead |
| Devices | 6 states + Cancel, BT banners, scan list, paired + auto-connect | same wording and logic | ✓ |
| Settings | one page (profile, devices, email/password, log out) | Settings (Profile row, devices, alerts, prefs, log out) + separate Profile | iOS diff |
| Auth | Landing → Login / Register routes, alerts | one screen with segmented switch, inline banners, same fields + Forgot password | ✓ actions |
| Alerts / Notifications / Preferences | none | iOS only, local stores | iOS only |

**UI Sign-off: every screen**

| Screen | File | Props type | Container | Hook / data source | Preview states |
|---|---|---|---|---|---|
| Auth | `features/auth/AuthScreen.tsx` | `AuthScreenProps` | `AuthContainer` | `useAuthForm` → `authService` (Firebase JS / preview), `useAuthSession` | 10 |
| Home | `features/home/HomeScreen.tsx` | `HomeScreenProps` | `HomeContainer` | `useHomeData` → `useBle`, `useProfile`, readings store (heart rate, steps), `usePreferences` (units), `testExtras` (sample sleep only); distance/floors/calories always `noActivityExtras` ("--") | 7 |
| Heart Rate | `features/heart-rate/HeartRateScreen.tsx` | `HeartRateScreenProps` | `HeartRateContainer` | `useHeartRateData` → readings store | 5 |
| Fitness | `features/fitness/FitnessScreen.tsx` | `FitnessScreenProps` | `FitnessContainer` | `useFitnessData` → readings store | 5 |
| Sleep | `features/sleep/SleepScreen.tsx` | `SleepScreenProps` | `SleepContainer` | `useSleepData` → `testExtras` (no source) | 4 |
| Settings | `features/settings/SettingsScreen.tsx` | `SettingsScreenProps` | `SettingsContainer` | `useSettingsData` → `useBle`, `useProfile` | 5 |
| Profile | `features/profile/ProfileScreen.tsx` | `ProfileScreenProps` | `ProfileContainer` | `useProfileData` → `ProfileProvider` / `accountService`, `usePreferences` | 8 |
| Devices | `features/devices/DevicesScreen.tsx` | `DevicesScreenProps` | `DevicesContainer` | `useBle` (`BleProvider`) | 12 |
| Alert Thresholds | `features/alerts/AlertThresholdsScreen.tsx` | `AlertThresholdsScreenProps` | `AlertThresholdsContainer` | `useAlertThresholds` → `lib/alerts/thresholds` | 7 |
| Notifications | `features/notifications/NotificationsScreen.tsx` | `NotificationsScreenProps` | `NotificationsContainer` | `useNotifications` → `lib/alerts/alertHistory` | 4 |
| Preferences | `features/preferences/PreferencesScreen.tsx` | `PreferencesScreenProps` | `PreferencesContainer` | `usePreferencesForm` → `PreferencesProvider` (`AsyncStorage`) | 3 |
| Previews (dev) | `features/previews/PreviewsScreen.tsx` | inline | — | `registry.ts` | — |

**Phase 2 swap points (screens stay unchanged):**

| Swap point | Replace with |
|---|---|
| `features/devices/BleProvider.tsx` | Android's `services/ble/BleContext.tsx` + `BleService.ts` |
| `lib/sensors/readings.ts` (+ hooks keep their names) | Android's `services/sensors/readings.ts` (Firestore) |
| `features/auth/authService.ts` | `@react-native-firebase` auth + Google Sign-In |
| `features/profile/accountService.ts` / `ProfileProvider` | `users/{uid}` + `private/avatarData` |
| `lib/alerts/thresholds.ts` / `alertHistory.ts` | new Firestore paths + alert engine |
| `lib/sensors/testExtras.ts` (sample sleep only) | delete once a real sleep source exists |
| `lib/preferences` | keep (device-local) |
- Follow-up (Home tweak, requested): the Heart Rate card's **Live / Last seen** badge is now a small rounded square instead of a pill. `Pill` gained `shape: 'pill' | 'square'` (square = `radius.sm / 2`); only Home's HR badge uses it.
- Follow-up: a **square Heart Rate card** was tried (`a54aa6d`) and **reverted at Tarun's request**. The card is back to the rectangular design. The square Live/Last seen badge (`c50a433`) stays.

### 2026-10-04 — Phase 1 sign-off
- **No estimated activity values (restores the original decision):**
  - Home's Distance, Floors and Active Calories are **"--" in the real flow** again. `useHomeData` always passes `noActivityExtras`, and the step-based estimate (`testActivityFrom`) was removed from `lib/sensors/testExtras.ts`, which now only holds the sample night for Sleep.
  - The units label logic stays (`distanceFor` + km/mi), so it works as soon as real distance data exists in Phase 2.
  - Previews still show filled values (`mockActivityExtras`). The Fitness tab never showed estimated distance or calories, so it's unchanged.
- **Splash and icon wired (`app.json`, approved):**
  - `expo-splash-screen` plugin with `image: ./assets/splash-icon.png`, `imageWidth: 200`, `resizeMode: contain`, `backgroundColor: #EAF3FF` (the logo's light blue).
  - The Android adaptive-icon `backgroundColor` now matches (`#EAF3FF`). `icon.png` was already the generated DSS logo, and `name` is already "DSS Wearables".
  - **Bundle ID and Firebase untouched.** `npx expo config` resolves cleanly. The splash, icon and home-screen name only show in a real build (Expo Go shows its own).
- **Task 4 closed out:**
  - The Android side-by-side is covered by the code-based Android comparison table.
  - The full phone click-through, device widths, Dynamic Type and on-device yellow boxes are deferred to Tarun's later phone pass (bugs reported separately).
  - The UI Sign-off Home row was updated (7 preview states; activity always "--").
- **Phase 1 is signed off. Phase 2 is locked until "start Phase 2".**
- **Firebase config files:** `google-services.json` and `GoogleService-Info.plist` were found in the project root (added outside this session, 4 Oct ~23:13). They were briefly swept into the sign-off commit, then removed before any push: untracked, history amended, and **both are now in `.gitignore`**. The files are left on disk untouched and unused (Firebase stays deferred to the Phase 2 final step).

### 2026-10-04 — UI change: researcher / test-subject app (**iOS differences from Android**)
- **Why:** the app is used by researchers to test and demonstrate BLE wearables, and by test subjects recording at home, not as a fitness app. Plan moved into `claudephase2charter.md` (CLAUDE.md imports it).
- **iOS differences from Android** (suggest to Kevin/Jared where useful):
  1. **3 tabs instead of 5:** Devices | **Dashboard** (raised centre, default on sign-in) | Settings. Android's Home, Heart Rate, Fitness and Sleep tabs are combined into the Dashboard. Heart Rate, Steps and Sleep become pushed detail pages with ‹.
  2. **No fitness wording:** "Fitness" becomes **"Steps"**, there's **no 10,000 step goal bar**, and no calorie target or "% achieved" (Android has the 10,000 goal in `StepsDisplay`).
  3. **Dashboard** has a connected-devices strip (chip per device) and a device filter (All devices / one device, when more than one is connected). Readings keep their source device (`deviceId`).
  4. **Devices is a tab** (Android: hidden `devices` route). Part 2 adds per-device cards, health/data stats and Device Detail. Settings loses its Devices section in Part 2.
  5. **Multiple simultaneous devices** and **background recording** are planned for Phase 2 Step B (Android's `BleService` is single-device and foreground-only today), with PL background tests. They replace the "foreground only for the demo" decision.
  6. **Phase 2.5 mostly absorbed** into the Devices tab; the Profile Overview is dropped.
- **Plan file note:** the first screens-list edit of the charter (Windows line endings) appended instead of replacing and duplicated the file's tail. It was caught immediately and repaired from the intact first part, verified as one copy of every section with the log intact, and the file was staged in git as a safety copy.

### 2026-10-05 — Part 1: Dashboard replaces Home, Heart Rate, Fitness and Sleep tabs (**iOS difference from Android**; awaiting review)
- **Tabs:** `devices` | `dashboard` (raised centre, **default on sign-in**, `DEFAULT_TAB`) | `settings`. Hardware back from a tab returns to Dashboard. Heart Rate, Steps and Sleep are now **pushed detail pages** (`heart-rate`, `steps`, `sleep` stack routes) with ‹.
- **Renames (`git mv`, history kept):**
  - `features/home/` → `features/dashboard/` (`DashboardScreen`/`DashboardContainer`/`useDashboardData`/`dashboardModel`/`dashboard.preview`)
  - `features/fitness/` → `features/steps/` (`StepsScreen`/`StepsContainer`/`useStepsData`/`steps.preview`)
  - Removed the old Home `DeviceActivityCard` (device ring + sync) and `ActiveCaloriesCard` (calorie target / "% achieved").
- **Dashboard** (Home's header kept as is):
  - **`DevicesStrip`:** a chip per connected/connecting device (status dot, name, `SignalBars`). The empty state is "No device connected" + **Add device**. A chip opens the Devices tab.
  - **`DeviceFilterBar`:** "All devices" or one device, **only when 2+ devices are connected**.
  - **Cards:** Heart Rate (live card + source device + 24 h line chart with Min/Avg/Max; reuses `averageByBucket`/`TimeLineChart`), **Steps** (`StepsCard`: today + "Updated x ago" + source + 24 h per-hour chart with Total; **no goal**), Sleep & Recovery, **`MetricsCard`** (Distance · Floors · Calories, always "--" in the real flow with "Not reported by connected devices yet."; km/mi from Preferences).
- **Device filter:**
  - `DeviceFilterProvider` (in `RootNavigator`) is shared by the Dashboard and its detail pages. They show "· Galaxy Watch8" / "· All devices" in their header.
  - `lib/sensors/filterReadings.ts` (`filterHistory`, `filterLatest`) does the filtering. "All devices" includes test data; a single device excludes it (test data has no device).
  - The filter resets to All when fewer than 2 devices are connected.
- **Readings keep their source device:** `SensorReading.deviceId` added (Android's Firestore doc already stores it; the UI type had dropped it). The mock store and mocks set it; test/sample data is `null`.
- **Bug found and fixed while checking the two-device preview:** with "All devices", the steps-per-hour chart mixed two devices' running totals, so hourly differences were wrong (6,050 instead of 12,100). New `stepsByBucketAcrossDevices` (in `lib/trends.ts`) buckets each device on its own and sums them. It's used by the Steps card and the Steps page. **Note for Phase 2 / Kevin:** any multi-device steps total needs the same per-device bucketing.
- **No fitness wording:**
  - "Fitness" → "Steps", and the 10,000 goal, % pill and "Goal reached!" are gone.
  - `DailyActivityExtras.calorieTarget` was removed.
  - The Sleep "Target 8h" pill → "Dark = 7.5 h or more".
  - The Help sheet pairing steps now point at the Devices tab.
  - The only remaining matches are code comments naming Android's original files (kept for Phase 3 traceability).
- **Devices** is a tab (`bottomInset`, ‹ optional) with the existing screen until Part 2. Settings' "Pair a New Device" opens the Devices tab.
- **Previews:**
  - **Dashboard:** No device, One device live, **Two devices + filter (interactive)**, Stale data, Imperial.
  - **Steps:** No data, Loading, Error, Filled.
  - **Heart Rate** and **Sleep** previews updated for the pushed page.
  - Checked visually via temporary web screenshots (entry restored).
- **Known Part 1 limits (fixed in Part 2):**
  - **Single connection:** the mock BLE still connects one device, so in the real flow the strip shows at most one chip and the filter only appears in Previews.
  - **Chip tap:** a chip opens the Devices tab, not that device's card yet.
- **Checks:** typecheck clean, iOS + Android bundles build.

### 2026-10-05 — Dashboard back to the old Home layout (requested after Part 1)
- **Restored from the Phase 1 sign-off (`1611d27`), as approved then:** the Heart Rate card (no chart in the card), the device ring + sync beside Today's Activity, Sleep & Recovery and Active Calories, in the old order. `DeviceActivityCard`, `HeartRateCard` and the old model (now `dashboardModel.ts`: `deviceViewFrom`, `restingRangeFrom`, `stepsTodayFrom`) were restored as files. `DashboardScreen`/`useDashboardData`/`dashboard.preview` are the old Home ones renamed.
- **Active Calories without fitness wording** (Tarun's choice): no "Target: 600", no "% achieved", no goal bar. Just kcal, or "--" + "Not reported by connected devices yet."
- **Taps:** Heart Rate → Heart Rate detail; Today's Activity and Calories → **Steps** detail (was Fitness tab); Sleep → Sleep detail; device ring → **Devices tab**; avatar → Profile.
- **Removed from Part 1:** the connected-devices strip, the device filter bar, the chart inside the Heart Rate card, the Steps card and the Distance/Floors/Calories card. Multi-device info goes to the Devices tab in Part 2. The fixes from Part 1 are kept: readings carry `deviceId`, and `stepsByBucketAcrossDevices` is used by the Steps detail page.
- **Kept:** the 3 tabs, the pushed Heart Rate / Steps / Sleep detail pages, no fitness wording, and `DeviceFilterProvider` (always "All devices" for now).
- **Previews:** Dashboard is back to No device, Connecting, Syncing, Connected (live), Imperial, Failed.

### 2026-10-05 — Plan: new structure for both platforms + data compatibility
- **Team decision:** the 3-tab structure (Devices | Dashboard | Settings) is **the app's structure on both iOS and Android**, not an iOS difference. No `*.ios.tsx` split. Phase 3 replaces the Android UI in Kevin's repo with this one, keeping Kevin's logic. The old 5-tab Android comparison table is marked **historical**, and earlier "iOS difference" notes about the structure now describe what Phase 3 changes on Android.
- **Phase 2 on both platforms:** every Step A and Step B piece is tested on Android and iOS.
- **Shared data compatibility rule** (Phase 2 Step B): only add optional fields; never rename, remove or retype Android's fields; docs without the new fields must still work (missing `deviceId` = unknown device). The final reading/device doc shapes go in the Progress Log before Step B code.

### 2026-10-05 — Expandable Dashboard cards
- **New primitives:**
  - `ExpandableCard`: `header(state)` render prop + expanded `children`. It uses `LayoutAnimation` (built into RN, no new package), keeps its own state per card (several can be open), starts collapsed (`initiallyExpanded` for previews), and gives the header button role + `accessibilityState.expanded`. `pressableHeader={false}` lets a card wire its own toggle area.
  - `ExpandChevron`: rotates 180° when expanded.
  - `CardLink`: "Open … ›" text link with a 44pt target.
  - `TimeBarChart` gained `height`, plus a new token `layout.miniChartHeight`.
- **Collapsed cards look as approved**, plus a small chevron (Heart Rate and Sleep: after the pill; Calories: in the header; Device card: next to "TODAY'S ACTIVITY"). Tapping a card now expands it; navigation moved into the expanded area.
- **Expanded content:**
  1. **Heart Rate:** Min/Avg/Max + 24 h line chart (or "No heart rate readings in the last 24 hours."), last reading time + source ("from Test data"), **Open Heart Rate ›**.
  2. **Device & Today's Activity:**
     - Only the activity side toggles; the ring keeps its tap → Devices tab, and the sync button stays.
     - Expanded: a row per connected device (name, signal bars + dBm, battery or "Battery not reported", status, last sync) or "No device connected" + **Add device ›**; today's steps-per-hour mini chart (per-device bucketing) + "Steps updated x ago"; **Devices ›** and **Steps ›**.
  3. **Sleep & Recovery:** bedtime → wake, Deep/REM/Light/Awake durations, a 7-night hours mini chart, **Open Sleep ›** (or "No sleep data yet.").
  4. **Active Calories:** source line ("Reported by connected device" / "Not reported by connected devices yet") + **Open Steps ›**.
- **Multi-device ring:** with 2+ devices the ring shows "<n> devices connected", the worst pending status, and "Weakest: <name> · <dBm>" (`ringViewFrom`). One device looks as before.
- **Data:**
  - Same hooks as the detail pages (`useSensorHistory` heart rate + steps, `useSampleSleep` trends).
  - Device rows come from `connectionsOf(ble)` (`features/devices/connections.ts`): the single connection now, every device's state once the provider holds several (Part 2).
  - `ConnectionState.rssi?` was added as an optional in-app field.
  - Distance/floors/calories keep the "--" rule.
- **Previews:** Dashboard adds Expanded: no device / one device / three devices (reconnecting + weak signal). Checked via temporary web screenshots at 375 wide and at X-Large text (entry restored). The Sleep stage durations now sit next to their labels so narrow screens can't cut them off.

### 2026-10-05 — Devices tab with connected and previous device stats
- **Structure:** the Devices tab is now the researcher's device overview. The old scan/connect screen moved to a pushed **Add device** page (`AddDeviceScreen`/`AddDeviceContainer`, back ‹), unchanged: all six states, Cancel, Bluetooth banners, Paired devices + Auto-connect. **Device Detail** is a new pushed page (`device-detail` route; the navigator holds the selected device id).
- **Devices tab (`DevicesScreen`, presentational):** blue header; summary strip (connected now, devices tested, readings today, overall success rate); Bluetooth/error banners; **Add device**; **Connected now** cards (name, status, bars + dBm, battery or "Battery not reported", current BPM, 24 h avg BPM, steps today, readings this session, session time, last reading, badge, Disconnect/Cancel + Forget); **Previously connected** cards, most recent first ("Last connected <ago>", last known signal + battery, sessions, connected time, readings, avg BPM, success rate, drop-outs, last session with how it ended, badge, Connect + Forget); empty state "No devices tested yet" + Add device; loading and error states. Tapping a card's info area opens Device Detail.
- **Device Detail:** status + badge with a one-line explanation, signal/battery, actions; Right now (when connected); Totals; Reliability (success rate, avg time to connect, drop-outs, reconnect attempts); Data quality (readings/min, gaps over 30 s, last reading, readings today); full session history (start, duration, readings, avg BPM, Ended by you / Dropped out / Ongoing). Dev builds add **Testing tools**: Simulate drop-out, Pause/Resume readings.
- **Data (all in memory, mock):**
  - `lib/devices/connectionLog.ts`: event log (connect attempt, connected + `connectMs`, disconnected `user`/`unexpected`, failed, app background/foreground), each with timestamp + `deviceId` (null for app events). This is Step B 6b's store; real BLE writes the same events.
  - `lib/devices/deviceStats.ts`: sessions, connected time, success rate (connected ÷ (connected + failed)), drop-outs (unexpected disconnects), reconnect attempts, readings/min, gaps > 30 s while connected. Only that device's `source: 'ble'` readings count; test data never does; time in background/closed never counts as a gap or drop-out.
  - `lib/devices/healthThresholds.ts`: every badge threshold in one file (Not responding: no reading for 60 s while connected, or success < 50%, or last session had no readings; Unstable: success < 80%, > 1 drop-out/h or > 6 gaps/h).
  - `data/deviceHistory.ts`: seeded history for Galaxy Watch8 (stable), Polar H10 (unstable) and Mi Smart Band 8 (not responding), all older than 24 h, readings every 15 s.
  - **Mock `BleProvider` is now multi-device** (Step B item 10 shape): `connections: Record<deviceId, ConnectionState>` + derived `connection`, per-device handshake/cancel token/disconnect, event logging, `AppState` background/foreground logging, simulated readings per connected device (HR every 5 s, steps every 30 s, tagged with `deviceId`, source `ble`), `pairedDevices` with optional `lastRssi`/`lastBattery`, and dev-only `simulateDropOut` / `setReadingsPaused`. Polar H10 still always fails to connect (mock), so FAILED can be tested.
  - **Compatibility rule:** `PairedDevice.lastRssi?`/`lastBattery?` are optional additions; the event log is planned as a new subcollection.
- **Settings:** the Devices section is gone (Profile row, Alert Thresholds, Notifications, Preferences, Previews in dev, Log Out). `CurrentDevice.tsx` was deleted (no longer used).
- **Previews:** Devices (no devices, one connected, three connected Stable/Unstable/Not responding, two connected + three previous, previous only, Bluetooth off, loading, error); Device detail (connected with long history, previous Unstable, Not responding, Bluetooth off, not found); Add device (the 12 old states). Previews use `devicesFixture.ts`, which runs the same model (`buildDevicesModel`) as the real tab. Checked via temporary web screenshots at 390 wide (entry restored).
- **Known limits:** the log and stats reset when the app restarts (persistence is Phase 2.5). Because the seeded history is real-looking readings, the Dashboard's Heart Rate card can show the Galaxy Watch8's last reading from ~1 day ago until a device connects.


### 2026-10-05 — Phase 2 handover to PL
- Starting main commit: `f93454fd9ff40a9c5b3a5bcc4ed264b21a73a8dd` (Devices tab with connected and previous device stats).
- Setup step 1: Xcode 27.0 (27A266a), CocoaPods 1.17.0, Node v22.18.0, npm 10.9.3, Git 2.54.0 (Apple Git-157), Java 21.0.2. Android SDK and Android Studio absent from standard locations; Android testing not ready.
- Setup step 2: both Git repos exist under `/Users/praneetlondhe/DSSWEARABLE`; commands run in `DSS-iOS-UI`. Session workspace remains the parent; PL asked to proceed with checks. Commands individually submitted for approval.
- Setup step 3: origins verified as TarunKrishnan6/DSS-iOS-UI and KevinCGIA/DSS-wearable-App on GitHub.
- Setup step 4: approved fetch completed in Kevin's repo; working tree clean. BLE tip `e65c84b239fb4ece5dacb098e96354de11aedbd5`, 2026-10-02T22:56:14+10:00, "Add sensor readings, health displays, trend charts and device management". Two BLE commits remain outside origin/main; branch not merged. No working files modified there.
- Setup step 5: main pulled with --ff-only; already up to date. Phase 1 sign-off (`1611d27`), expandable Dashboard (`d62054c`), and Devices tab (`f93454f`) verified.
- Setup step 6: created `phase-2`; both PL handover documents already present in root. Appended handover instructions to AGENTS.md, preserving Expo notes. CLAUDE.md untouched. Documentation commit pending review; Firebase and app checks still pending. No Phase 2 implementation started.
- Setup stopped during step 6 validation: `npm run typecheck` exited 127 (`tsc: command not found`). Dependencies are not ready. No handover commit made; Firebase checks and setup steps 7–11 remain pending. Next fix requires an approved dependency installation before retrying typecheck. No push performed.

### 2026-10-05 — Setup dependency installation and typecheck recovery
- PL authorised installing the relevant dependencies. Approved `npm install` completed in DSS-iOS-UI: 566 packages added. No new Phase 2 packages requested.
- `npm run typecheck` now passes (exit 0), resolving the missing-tsc blocker.
- npm reported 29 dependency vulnerabilities (8 moderate, 21 high); no audit fixes or dependency upgrades applied.
- Handover commit, Firebase configuration verification, Expo config resolution and baseline runtime verification remain pending. No Phase 2 implementation started.

### 2026-10-05 — Firebase setup configuration verified
- Both root configuration files exist with exact required filenames and parse successfully.
- GoogleService-Info.plist: PROJECT_ID wearable-app-f9d83, GCM_SENDER_ID 944450266341, BUNDLE_ID com.galaxies.firebase; nonempty REVERSED_CLIENT_ID present.
- google-services.json: project_id wearable-app-f9d83, project_number 944450266341; Android client package com.dsswearablecool.firebase present.
- Both files are gitignored and untracked. Configuration files unchanged; API keys not printed. Local configuration validation only; live Firebase connectivity and authentication not tested.


### 2026-10-05 — Phase 2 A1: config re-verification and auth port map
- PL explicitly confirmed all setup checks manually verified and authorised starting Phase 2. This records PL's verification; it does not claim Codex ran the remaining setup checks.
- Rechecked both exact Firebase filenames, project wearable-app-f9d83 / number 944450266341, iOS com.galaxies.firebase, Android com.dsswearablecool.firebase, nonempty REVERSED_CLIENT_ID, gitignored and untracked. No API keys printed or config files changed.
- Read Kevin's auth/profile code from local origin/feature/ble-connection (e65c84b) using git show. No fetch needed for A1. No implementation ported yet; planned sources and destinations follow.

| Kevin source and exact function | Planned destination | Behaviour to adapt |
|---|---|---|
| app/login.tsx: signIn | src/features/auth/authService.ts | Email/password sign-in; sign out and reject unverified users |
| app/login.tsx: signInWithGoogle; module-level GoogleSignin.configure | src/features/auth/authService.ts | Google credential flow; shared config from supplied client IDs; Play Services check only on Android |
| app/register.tsx: signUp | src/features/auth/authService.ts, with profile/avatar helpers in src/features/profile/accountService.ts | Create auth user, users/{uid}, optional private/avatarData, send verification, sign out |
| app/register.tsx: signUpWithGoogle | src/features/auth/authService.ts, with profile helpers in src/features/profile/accountService.ts | Google auth and ensure profile exists without overwriting existing fields |
| app/register.tsx: chooseProfilePicture; app/(auth)/settings.tsx: chooseProfilePicture | src/lib/pickImage.ts and src/features/profile/accountService.ts | Keep existing picker; adapt 300x300 JPEG/base64 persistence under users/{uid}/private/avatarData.imageData |
| app/(auth)/settings.tsx: loadProfile, saveProfile | src/features/profile/accountService.ts and ProfileProvider.tsx | Read/write name, height, weight; preserve Kevin's string field types and metric storage |
| app/(auth)/home.tsx: loadProfilePicture; avatar read within settings.tsx: loadProfile | src/features/profile/accountService.ts and ProfileProvider.tsx | Shared avatar read with Google photo/initials fallback |
| app/(auth)/settings.tsx: changeEmail | src/features/profile/accountService.ts | verifyBeforeUpdateEmail |
| app/(auth)/settings.tsx: changePassword | src/features/profile/accountService.ts; reset-email behaviour reused in src/features/auth/authService.ts | sendPasswordResetEmail; Kevin has no separate forgot-password function |
| app/(auth)/settings.tsx: logout; app/(auth)/home.tsx: logout | src/features/auth/authService.ts | signOut; retain Tarun's existing confirmation UI |
| app/_layout.tsx: handleAuthStateChanged and onAuthStateChanged subscription effect | src/features/auth/useAuthSession.ts | Native auth session and subscription cleanup; retain Tarun's navigator |

- Fixes planned, not implemented: missing Google sign-in profile, destructive Google sign-up writes, and Google avatar fallback (ANDROID_BUGS 1-3). Keep existing Firestore field types despite the older bug note proposing numeric height/weight. App IDs are settled; old bug 9 is superseded.
- Avatar processing uses image-manipulator/file-system in Kevin's code; determine SDK-compatible helper dependencies during the relevant implementation step. Alert thresholds are new work in A8, not a Kevin port. No BLE or UI changes in A1.
- Click list: no device taps needed for this read-only planning step. PL reviews the function map and approves A1 before A2. Runtime auth testing comes after native builds.
- Validation: npm run typecheck passed. A1 contains documentation only; included pending handover documents and AGENTS instructions in the documentation commit. No push. Mandatory A1 STOP: awaiting PL approval before A2.

### 2026-10-05 — Phase 2 A2: install Firebase packages
- PL approved A2 and requested opening localhost. Installed through the exact A2 npx expo install command: @react-native-firebase/app, auth and firestore ^26.4.0; @react-native-google-signin/google-signin ^16.1.5; expo-dev-client ~57.0.19; expo-build-properties ~57.0.22. package.json and package-lock.json updated.
- Expo automatically appended four config plugins. Removed only those newly added entries to keep app.json configuration in A3; app.json matches the prior commit. No application code, UI, BLE or Firebase service wiring changed. No files ported from Kevin in A2.
- Validation: npm run typecheck passed. Web preview started with npx --no-install expo start --web --offline --port 8081; opened http://localhost:8081 in the browser. Web bundled successfully (611 modules). Initial attempt combining --offline and --localhost was rejected; --offline alone worked. Existing web shadow-style deprecation warning remains.
- npm reported 33 dependency vulnerabilities (8 moderate, 25 high); no audit fix or forced upgrades applied.
- No native build/prebuild performed in this package-only step. Native Firebase/auth runtime tests remain pending A3 configuration and A10 development builds; run platform prebuild --clean before building. The current web preview still uses the existing mock/preview flows.
- Click list (Mac browser): at localhost:8081 choose Preview the dashboard; confirm Devices, Dashboard and Settings tabs open. No real Firebase login is expected yet. Device auth tests are deferred to native builds.
- A2 STOP: await PL approval before A3. No push; local preview left running.

### 2026-10-05 — Phase 2 A3: Firebase app.json config
- Read the exact Expo SDK 57 reference at https://docs.expo.dev/versions/v57.0.0/ and inspected installed Google Sign-In/Firebase Auth plugin code before editing configuration.
- Set ios.bundleIdentifier to com.galaxies.firebase and ios.googleServicesFile to ./GoogleService-Info.plist; set android.package to com.dsswearablecool.firebase and android.googleServicesFile to ./google-services.json.
- Appended @react-native-firebase/app, @react-native-firebase/auth, expo-build-properties with ios.useFrameworks static, and the Google Sign-In plugin with iosUrlScheme copied from the plist's REVERSED_CLIENT_ID. No API keys embedded.
- Preserved all existing settings and plugins, including name DSS Wearables, supportsTablet false, icon/adaptive icons, font and splash configuration. No screens, BLE or service code changed. Files ported: none.
- Validation: npm run typecheck passed; EXPO_OFFLINE=1 npx --no-install expo config --type public resolved successfully. Compared configuration with HEAD to verify only the required A3 additions and identifier replacement. Native build/auth runtime verification remains deferred to A10/A11.
- Click list: no device taps validate native configuration at this step. On Mac, review app.json for the two platform IDs and retained icon/splash settings; real sign-in tests require the later iOS Simulator / Android development builds.
- A3 STOP: await PL approval before A4 (Android debug SHA-1). No Firebase console changes, native prebuild, or push performed.


### 2026-10-05 — Phase 2 A5: port auth service (A4 deferred by PL)
- PL explicitly requested skipping A4 and starting A5. No SHA-1 was generated or added; Android Google sign-in remains pending each build machine's SHA-1. Tarun still needs his Windows debug SHA-1 registered by the team. No Firebase console/security-rule changes performed.
- Added nativeAuthService.ts as the native SDK adapter and nativeAuthFlow.ts for the auth/session lifecycle. Provides email registration/login, Google sign-in/sign-up, reset email, verification-based email change, password reset for the current user, logout and an auth subscription with cleanup. Existing containers/hooks continue to use their current service until the explicit A9 swap; screens/previews and mock BLE are unchanged.
- Registration creates users/{uid} with name, height and weight (measurements remain metric strings, empty values remain empty strings), optionally saves private/avatarData.imageData, sends verification and signs out. Display name is also set in Auth for the session greeting. Failed profile/avatar writes sign out; unverified email/password users cannot enter the app. Auth callbacks are held until the operation completes, avoiding premature navigation during registration/Google profile setup.
- Added public Google web/iOS OAuth client IDs in googleClientConfig.ts, extracted from the Android client_type 3 entry and plist CLIENT_ID. No API keys or full Firebase configuration embedded. Google configure runs once on first use; Play Services check is Android-only; cancellation/missing tokens do not exchange credentials.
- Installed expo-image-manipulator ~57.0.20 via npx expo install for Kevin-compatible 300x300 JPEG (quality 0.5) avatar data. Uses SDK 57 contextual manipulation/saveAsync(base64: true), avoiding Kevin's deprecated manipulateAsync and an unnecessary legacy filesystem dependency. Read https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/index.md and installed SDK type/source declarations before implementation. Avatar writes merge imageData and release native image resources.

**Ported source map (Kevin origin/feature/ble-connection @ e65c84b → this repo):**
| Kevin source | Destination | Adaptation |
|---|---|---|
| app/login.tsx: signIn, signInWithGoogle | src/features/auth/nativeAuthFlow.ts; nativeAuthService.ts | Modular native Auth calls, verification/session guard, platform-aware Google login |
| app/register.tsx: signUp, signUpWithGoogle | src/features/auth/nativeAuthFlow.ts; nativeAuthService.ts; src/features/profile/nativeProfileWrites.ts | Registration, safe create-if-missing profile, verification and sign-out |
| app/login.tsx and app/register.tsx: GoogleSignin.configure | src/features/auth/googleClientConfig.ts; nativeAuthService.ts | Single public web/iOS client config |
| app/register.tsx: avatar block; app/(auth)/settings.tsx: chooseProfilePicture serialization | src/features/profile/nativeProfileWrites.ts: saveNativeAvatar | Same Firestore path/data URI and image dimensions/quality, current Expo API |
| app/(auth)/settings.tsx: changeEmail, changePassword, logout; app/(auth)/home.tsx: logout | src/features/auth/nativeAuthFlow.ts; nativeAuthService.ts | Verification email, reset email (also Forgot password), sign-out; UI confirmations stay in existing containers |
| app/_layout.tsx: handleAuthStateChanged and subscription effect | src/features/auth/nativeAuthFlow.ts: subscribe; nativeAuthService.ts: observeAuth | Subscription cleanup and verified-session gating; navigator unchanged |

**Fixes for the Android team (introduced safely while porting):**
- Both Google buttons call ensureNativeProfile; missing users/{uid} is created. A Firestore transaction creates only absent profiles, preserving existing name/measurements/autoConnectDevice and any additional fields, including concurrent creation. This deliberately avoids reproducing ANDROID_BUGS 1-2. Google avatar read/photo/initials fallback is still A6/A7 work.
- Email registration no longer leaks a transient authenticated session before profile/avatar/verification completion. A failed Google profile setup attempts sign-out and suppresses its session even if cleanup fails.

**Validation and limitations:**
- npm run test:auth: 15 passing focused tests, using mocked native SDKs (registration ordering/field types, failures, unverified/restored sessions, Google readiness/cancellation/platform guard, profile preservation, avatar format/resource cleanup, reset/change-email/logout and subscriptions). Node prints a harmless module-format warning for the stripped TypeScript test import.
- npm run typecheck and git diff --check pass; Kevin's repo is clean. No live Auth/Firestore calls made, no native prebuild/build performed. Installed SDK types compile; actual iOS/Android integration remains unverified until A9/A10/A11. Before native builds, regenerate the platform with prebuild --clean as required.
- Registration spans Auth and Firestore (not one transaction); a failure after account creation can leave the Auth account/profile partially created. The service reports the error and signs out rather than claiming success; no automatic account deletion. Profile creation transactions require network access. Native UI error/cancellation presentation is integrated in A9.
- npm audit still reports 33 vulnerabilities (8 moderate, 25 high); no automatic audit upgrades.
- Click list now (Mac web preview): Preview the dashboard → Devices → Dashboard → Settings should remain the existing mock flow. This does not exercise the native service yet. After A9/A10 on iOS Simulator (Android emulator/Tarun phone once SHA-1 is configured): Register with avatar → verification-sent; login unverified → blocked; verify then login → Dashboard; Forgot password/Change Password → reset email; Change Email → verification at new address; Log Out → sign-in. These native clicks are pending, not claimed passed.
- STOP after A5: await PL approval before A6. No push.

### 2026-10-05 — Phase 2 A7: Firestore profile and avatar (A6 skipped by PL)
- PL explicitly requested skipping the standalone A6 step and beginning A7. There is no A6 commit or A6 approval checkpoint. The safe Google profile creation work was already implemented and tested in A5; A7 adds the Google/custom-avatar read fallback required by real profiles. A4 SHA-1 remains deferred, so Android Google sign-in remains unverified.
- Native iOS/Android builds now resolve `accountService.native.ts` to the Firestore-backed service. Web continues to resolve the existing `accountService.ts`, preserving the browser preview until the JS Firebase removal and final container swap in A9. Screens, navigation, presentation and mock BLE are unchanged.
- Profile reads use `users/{uid}` and `users/{uid}/private/avatarData` in parallel. Auth remains authoritative for UID, email and verification. Name falls back through Firestore, Auth display name, the supplied session name and the email prefix. Avatar priority is custom `private/avatarData.imageData`, then Kevin's existing `users/{uid}.profilePictureUrl`, then the Auth Google photo, then the existing initials UI.
- Height and weight accept Kevin-compatible stored strings and tolerate older numeric documents, returning `null` for missing/malformed/non-positive values. Saves merge only `name`, `height` and `weight` into `users/{uid}`, retain metric storage as strings, and preserve all other shared fields such as `autoConnectDevice` and `profilePictureUrl`. No existing Firestore field is renamed, removed or retyped.
- Avatar saves reuse A5's 300x300 JPEG/base64 helper and merge `imageData` at Kevin's existing private document. The service returns the durable data URI after the write, so the UI does not retain a temporary picker URI. ProfileProvider cancels stale loads and rejects updates/results if the signed-in account changes during an operation.
- Firestore errors, including permission errors, propagate to the existing inline profile error UI. No security rules or Firebase console settings changed.

**Ported source map (Kevin `origin/feature/ble-connection` @ `e65c84b` → this repo):**

| Kevin source | Destination | Adaptation |
|---|---|---|
| `app/(auth)/settings.tsx`: `loadProfile` | `src/features/profile/nativeAccountFlow.ts`; `nativeAccountService.ts`; `accountService.native.ts` | Reads the same user/private docs, converts measurements for UI, adds safe Google photo/name fallbacks |
| `app/(auth)/settings.tsx`: `saveProfile` | `src/features/profile/nativeAccountFlow.ts`; `nativeAccountService.ts` | `setDoc(..., { merge: true })` keeps Kevin's string field types and preserves optional/additive fields |
| `app/(auth)/settings.tsx`: `chooseProfilePicture` | `src/features/profile/nativeProfileWrites.ts`; `useProfileData.ts` | Same private avatar document; returns durable data URI after successful save |
| `app/(auth)/settings.tsx`: `changeEmail`, `changePassword` | `src/features/profile/nativeAccountService.ts` → A5 `nativeAuthService` | Reuses verified-email and reset-email native Auth paths |
| `app/(auth)/home.tsx`: `loadProfilePicture` | `src/features/profile/nativeAccountFlow.ts`; `ProfileProvider.tsx` | One shared provider supplies Dashboard, Settings and Profile; custom/Google/initials fallback |

**Validation and open items:**
- `npm run test:profile`: 12 passing focused tests covering paths, merge preservation, string/number parsing, missing/malformed docs, avatar precedence, durable avatar state, auth requirements, account-switch races and permission errors.
- `npm run test:auth`: all 15 A5 regression tests pass. `npm run typecheck` and `git diff --check` pass. Offline Expo exports pass for web (577 modules), iOS (984 modules) and Android (982 modules), confirming platform-specific service resolution and bundling. Node's test-only module-format warning remains harmless.
- No live Firestore request, native prebuild or simulator/device test was performed. A7 native runtime testing depends on A9's native auth/session container swap and A10 builds. The browser preview remains mock by design. A release/native "Preview the dashboard" bypass can lack a native Firebase user before A9; use the browser preview for this intermediate step.
- Click list now (Mac browser at localhost): `Preview the dashboard` → Settings → Profile; change name/height/weight and avatar and confirm the preview success states still work, then Dashboard and Settings reflect the change for the session. This validates unchanged UI only. After A9/A10 on iOS Simulator: sign in → Profile → edit/save metric or imperial values → reopen Profile and restart app → values persist; change avatar → Dashboard/Settings/Profile show it and it persists; a Google account without a custom avatar shows its Google photo or initials. Android equivalent remains Tarun-to-test after SHA-1 setup.
- STOP after A7: await PL approval before A8. No push.

### 2026-10-05 — Phase 2 A8: alert thresholds in Firestore
- Native iOS/Android builds now resolve `src/lib/alerts/thresholds.native.ts`, which subscribes to and saves `users/{uid}/settings/alerts`. Web keeps the existing in-memory threshold store for browser previews. Screens, navigation, validation UI, previews and mock BLE are unchanged.
- The new additive document contains `{ enabled: boolean, hrMin: number, hrMax: number, updatedAt }`. Saves use `setDoc(..., { merge: true })` and a Firestore server timestamp, so unknown/future fields in the same document are preserved. Missing documents and missing/malformed fields resolve to the required defaults: enabled `true`, minimum `50`, maximum `120`. A missing document is not written until the user saves.
- The threshold hook now obtains the current native Auth UID instead of using the sensor preview UID. Subscriptions and writes reject signed-out/wrong-account access and suppress stale results if the account changes during a listener callback or pending write. Firestore permission/read/write errors reach the screen's existing load/save error states; no security rules or Firebase console settings changed.
- Shared validation moved to `thresholdsCore.ts` so native and preview stores use the same 30–100 minimum range, 80–220 maximum range and 10 BPM minimum gap. Non-finite values are now rejected rather than passing JavaScript range comparisons.
- This is a new Firestore document with no Kevin Android equivalent, so no Kevin source file was ported. Compatibility impact is additive only: no existing field, type, document or collection was renamed, removed or modified. This remains a gap for the Android team to reuse in Phase 3.

**Validation and open items:**
- `npm run test:alerts`: 9 passing tests covering the exact document path, required defaults, partial/malformed documents, validation, live subscription/error forwarding, owner isolation, exact write shape, merge mode, server timestamp, account-switch races and permission/write failures.
- `npm run test:auth`: 15 passing; `npm run test:profile`: 12 passing; `npm run typecheck` and `git diff --check` pass. Offline Expo exports pass for web (578 modules), iOS (986 modules) and Android (984 modules), confirming preview/native store resolution.
- The first alert-test run exposed two test-harness-only issues (extensionless stripped-TypeScript import resolution and cross-VM object identity); the harness was corrected and the complete suite rerun successfully. No application defect was masked.
- No live Firestore request, native prebuild, simulator/device run or security-rule test was performed. A8 runtime testing depends on A9's native auth/session swap and A10 builds. If existing shared rules deny `users/{uid}/settings/alerts`, stop and coordinate with Kevin/Jared; do not change rules locally.
- Click list now (Mac browser at localhost): `Preview the dashboard` → Settings → Alert Thresholds; toggle alerts, change min/max, save, leave/reopen and confirm the in-session values remain; try an invalid gap and confirm Save stays blocked. This validates unchanged preview UI only. After A9/A10 on iOS Simulator: sign in → Settings → Alert Thresholds; confirm defaults 50/120 when missing, save changed values, verify `users/{uid}/settings/alerts` in Firebase Console includes `enabled`, `hrMin`, `hrMax`, `updatedAt`, then close/reopen and confirm persistence. Android equivalent is Tarun-to-test after SHA-1 setup.
- STOP after A8: await PL approval before A9. No push.

### 2026-10-05 — Phase 2 A9: real auth wired, JS SDK removed
- Native iOS/Android builds now resolve `authService.native.ts` and `useAuthSession.native.ts`. The existing auth container therefore calls the A5 native Auth/Firestore service, observes the persistent native Firebase session, blocks unverified email/password sessions through that service, and signs out through native Auth. Profile and alert containers continue to resolve their A7/A8 native adapters. Web resolves the existing preview services. Screens, navigation, previews and the mock `BleProvider` are unchanged.
- Split shared auth/session types and the session display-name helper from platform implementations so Metro can select native Firebase adapters without importing native modules into browser previews. Native session names prefer the first Auth display name, then the email prefix, then `Researcher`.
- Removed the `firebase` JavaScript SDK and its lockfile packages, deleted `src/lib/firebase.ts`, and deleted `.env.example` because it contained only obsolete Firebase web keys. Source scans find no JavaScript Firebase import, `@/lib/firebase` reference or `EXPO_PUBLIC_FIREBASE` usage. `npm ls firebase --depth=0` is empty; npm now reports zero known vulnerabilities for the installed dependency tree.
- The `Preview the dashboard` bypass is guarded by `__DEV__` at the app boundary, form model, session hook and screen render. A production web export contains neither the preview button text nor its preview-mode label. The development bypass remains available for the browser and native development builds.
- No Kevin implementation was newly ported in A9. This step wires the A5/A7 ports already recorded from Kevin's `app/login.tsx`, `app/register.tsx`, `app/_layout.tsx`, `app/(auth)/settings.tsx` and `app/(auth)/home.tsx` into Tarun's existing containers through `src/features/auth/authService.native.ts`, `useAuthSession.native.ts` and the existing `src/features/profile/accountService.native.ts`.

**Validation and open items:**
- `npm run test:session`: 2 passing; `npm run test:auth`: 15 passing; `npm run test:profile`: 12 passing; `npm run test:alerts`: 9 passing. `npm run typecheck` and `git diff --check` pass. Node's stripped-TypeScript tests still print the harmless module-format warning recorded in earlier steps.
- Offline production Expo exports pass for web (566 modules), iOS (975 modules) and Android (973 modules), confirming platform-specific adapter resolution. The release web bundle scan confirms the development preview bypass text is absent.
- No live Firebase request, native prebuild, simulator/device run or security-rule test was performed; those belong to A10/A11. Android Google sign-in remains pending the skipped A4 SHA-1 setup. The Firebase config files remain local, ignored and untracked; `ios/`, `android/` and `.env` are not tracked. Kevin's repo is clean.
- Click list now (Mac browser development preview): open the sign-in screen → tap `Preview the dashboard` → confirm Dashboard opens → Settings → Profile and Alert Thresholds still use their preview state → Log Out returns to sign-in. In a production export, confirm the preview button is absent. After A10 on iOS Simulator: launch → sign in with a verified Firebase account → Dashboard opens → kill/relaunch and confirm the session persists → Log Out returns to sign-in. Android equivalent remains Tarun-to-test after SHA-1 setup.
- STOP after A9: await PL approval before A10. No push.

### 2026-10-05 — Phase 2 A10: iOS build and launch fixes
- Clean iOS prebuild generated the native project, but CocoaPods rejected React Native Firebase 26's default Swift Package Manager resolution with static frameworks. Configured the existing `@react-native-firebase/app` Expo plugin with `ios.disableSPM: true`, retaining `expo-build-properties` static linkage. A clean prebuild then generated `$RNFirebaseDisableSPM = true`; `pod install --repo-update` completed with 129 pods. The generated `ios/` directory remains ignored and uncommitted.
- The first Xcode build succeeded but iOS 27 terminated the app at launch because its SDK requires the UIKit scene lifecycle. Updated Expo from 57.0.20 to 57.0.26 within the `~57.0.23` range via `npx expo install`, and enabled `expo-build-properties` `ios.enableSceneSupport: true`. A clean prebuild generated `UIApplicationSceneManifest` and a scene-aware `AppDelegate` while retaining Firebase initialization. This follows [Expo's SDK 57 Xcode 27 guidance](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md).
- The rebuilt app installed and launched on the iPhone 18 Pro Simulator (iOS 27.0). Metro exposed an existing preference text-scaling error: React Native froze a style object before `applyTextScale` mutated it. The helper now replaces each shared style object, and `StatReadout` selects its token on render. A fresh simulator launch rendered the sign-in screen and the error did not recur. No layout or flow changed.
- No Kevin code was ported in A10. This step changes only `app.json`, Expo package/lockfile versions, `src/theme/typography.ts` and `src/components/ui/StatReadout.tsx`; the A5/A7 Kevin source maps remain as recorded. Mock Bluetooth remains in use.

**Validation and open items:**
- `npx expo run:ios --no-install` built successfully with 0 errors and 4 build warnings, installed, bundled and launched on iPhone 18 Pro Simulator. A screenshot after a fresh launch shows the sign-in form and developer preview button. `npm run typecheck` and all 38 auth/profile/alert/session tests pass.
- Android Studio and Android SDK are absent from standard locations on this Mac, so no Android emulator build was run. Android build and the skipped A4 Windows SHA-1 remain Tarun-to-test. No live Firebase auth/profile/alert operation was performed; those are A11 checks.
- Remaining non-blocking simulator output includes iOS 27 status-bar API deprecations from dependencies, Expo dev-client manifest-asset warnings, and Xcode script dependency warnings. No app JavaScript error appeared after the typography fix.
- The Expo package update reported 33 dependency audit findings (8 moderate, 25 high); no unrelated audit upgrades were applied in this build step.
- Click list on iPhone 18 Pro Simulator: open DSS Wearables → confirm the sign-in screen appears and stays open; tap `Register` then `Log in` to confirm the two forms render; tap `Preview the dashboard` in this development build to confirm Dashboard opens, then `Log Out` returns to sign-in. Android emulator/phone: Tarun to run the same launch check on Windows after generating a development build. A11 contains the real Firebase click list.
- STOP after A10: await PL approval before A11. No push.

### 2026-10-05 — Phase 2 A11: Step A test handoff
- The A11 iOS click list is ready for PL. The iPhone 18 Pro Simulator (iOS 27.0) is booted, and its installed development build displays the sign-in form. This confirms launch and rendering only; it does not establish a Firebase connection or validate an account flow.
- No application code changed and no Kevin code was ported in A11 (Kevin source path → our path: none). No fixes were made.
- `npm run typecheck` passed. All 38 local auth/profile/alert/session tests passed with `node --test tests/*.test.mjs`. These tests use local adapters and do not verify live Firebase, email delivery or cross-device persistence. Kevin's repo remained clean; no secrets or generated native folders are tracked.
- Live iOS checks still require PL's test mailbox, Google accounts and Firebase Console access: registration plus Auth and `users/{uid}` fields; unverified login and verification; password reset; new and existing Google sign-in; profile/avatar persistence; email and password changes; alert settings persistence; logout and session persistence. None is marked passed without the live result.
- Android testing is pending because this Mac has no Android Studio/SDK and A4's Android SHA-1 was skipped. Shared-data testing also requires a build of Kevin's Android app. Record the resulting iOS and Android outcomes in `BUGS.md`; report any Firestore rule denial to PL without changing rules.
- ⛔ STOP after A11. Await PL's Step A test results and approval. Do not begin B0 or push.

### Phase 2 Step B plan

#### B0 source check and scope (2026-10-05)

The required read-only `git -C ../DSS-wearable-App fetch` completed. `origin/feature/ble-connection` remains at `e65c84b` (2026-10-02), so its BLE code and the Task 0 Android Wiring Map have not changed. `origin/main` advanced from the Task 0 `9b61eb8` to `d835fe3` through `8a5b7d1` (2026-10-04); those two commits change only `app/login.tsx`, `app/register.tsx`, `app/(auth)/home.tsx` and `app/(auth)/settings.tsx`. Main still has no `services/ble`, `services/sensors` or `services/devices` files. Continue to port BLE/sensors from the unchanged feature branch; review main's newer auth fixes separately if Step A testing reveals a gap. No code is authorised by this plan alone.

#### a. BLE architecture and device identity

- B1 first ports Kevin's single-device `services/ble/BleService.ts`, `BleContext.tsx`, `constants.ts`, `permissions.ts` and `services/devices/pairedDevices.ts` behind the existing `BleContextValue`. B2 replaces the single `connection`, `connectionToken`, monitor and disconnect subscription with `Map<deviceKey, DeviceSession>`. Each session owns native ID, status, generation/cancel token, three-attempt handshake, disconnect/HR subscriptions, reconnect timer, last reading, battery and RSSI. A cancelled or stale callback may change only its own session. One device dropping must not cancel another; stop foreground scanning while a handshake runs.
- Use a platform-neutral **logical** `deviceKey = platform + ':' + nativeId` in memory and UI filtering. Android `nativeId` is its existing MAC; iOS `nativeId` is the CoreBluetooth peripheral UUID returned by ble-plx, never a fabricated MAC. Keep Kevin's Firestore document ID and `deviceId` equal to the native ID for compatibility; add `platform` and the optional `localName` / `serviceUUIDs` hints. On iOS, direct-connect a saved iOS UUID; if it is stale, scan and match advertised name **plus** service UUID before recording the new UUID as a separate iOS entry. Show Android-only entries through the existing “Reconnect by scanning” state; ambiguous same-name devices require explicit selection. A name/service match is a discovery hint, not proof that two platform records are the same physical device.
- Auto-connect all eligible paired devices, not just index 0. Prioritise the most recently connected, stagger starts by a few seconds, pause scanning during each handshake, and cancel pending work on logout, forget or Bluetooth-off. An explicit user disconnect suppresses automatic reconnect for that device until a new connect action; unexpected drops run Kevin's three-attempt backoff independently per device.
- Preserve `useBle()` with `connections: Record<deviceId, ConnectionState>` and derived `connection` for old consumers. `DashboardContainer` / its device filter, `DevicesContainer`, `DeviceDetailContainer`, `AddDeviceContainer`, heart-rate and steps hooks receive per-device state and tagged readings from the provider/store; presentational screens stay unchanged. The mock provider remains for Previews only.
- No OS-wide fixed concurrent BLE limit is promised. Target **four active devices** for the team's physical-device tests, then tune using measured failures, radio contention and battery drain on each iPhone/Android model. At the provisional four-device admission cap, reject an additional connect with the existing Devices error/status text and keep all active sessions running; no new screen or layout is planned. The cap and message need Tarun's approval with this plan.

#### b. iOS and Android BLE rules

- Foreground scanning uses a short `0x180D` service-filtered pass and then an unfiltered pass for devices that omit the service in advertisements; preserve 15 s total auto-stop and RSSI sort. Background iOS scanning uses a service UUID filter only and accepts slower/coalesced discovery. Defer iOS `BleManager` creation and its permission prompt until Devices/scan or eligible auto-connect. Distinguish `Unauthorized` (permission denied, route to Settings) from `PoweredOff` (turn Bluetooth on), with existing banner text.
- Include `NSBluetoothAlwaysUsageDescription` and the ble-plx plugin permission string. Pairing is initiated by the peripheral/OS when a protected characteristic requires it; the app does not pre-bond or emulate pairing. Guard Android-only `PermissionsAndroid`, GATT 133 retry/cleanup, `requestMTU` and bonding with `Platform.OS === 'android'`. On Android 12+, request `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`; older Android retains Kevin's location permission path. No BLE claim is based on an emulator: B1/B2 need physical phones.

#### c. Final readings documents and write path

Keep Kevin's collection and field types exactly. A BLE notification updates the in-memory live store immediately, while one representative reading per device/type/minute goes to the legacy collection. A separate full-resolution batch per device/type is flushed about every 60 s, on disconnect, and when the app backgrounds. Only genuinely reported sensor types are written. In particular, steps are a device-reported **running daily total**; no step, distance, floor or calorie value is inferred from heart rate.

| Document / field | Final type | Optional? | Writer and compatibility |
|---|---|---|---|
| `users/{uid}/sensor_readings/{type}/readings/{id}`, `type` | path segment `heart_rate` or `steps` | No | Existing Kevin path; both apps read it. |
| `value` | number | No | BLE measured BPM or device-reported running daily steps. |
| `unit` | string (`bpm` or `steps`) | No | Same as Kevin. |
| `timestamp` | Firestore Timestamp | No | Measurement time, same as Kevin. |
| `deviceId`, `deviceName` | string or null | No for new writes; tolerate absence on old docs | Native ID and name. Missing ID means “unknown device” and is excluded from per-device stats. |
| `source` | `ble` or `manual` | No for new writes; tolerate absence on old docs | Retain Kevin's `manual` value for legacy dev/test documents; internal/test batch source is `test`. Missing legacy source is interpreted as `ble`. Never count `manual` in device stats. |
| `users/{uid}/reading_batches/{autoId}`: `deviceId`, `platform`, `type`, `source` | string, `ios\|android`, sensor type, `ble\|test` | No | New additive collection, written by our app only. Generate and persist `autoId` before upload so retries target the same document. |
| `startAt`, `endAt` | Firestore Timestamp | No | Actual first and last sample times. |
| `samples` | array of `{t: Timestamp, v: number}` | No | Full-resolution measured values; split before Firestore's document-size limit. |

For live BLE heart rate alone, one legacy write plus one new batch per device/minute is about 2,880 document writes per device/day, or 11,520 for four devices. If both HR and steps arrive each minute, that doubles to 23,040 for four devices, above Firestore's current 20,000/day free write quota; reads, storage and other users add more. Monitor actual usage and get project-owner agreement on billing/retention before long multi-device home studies. Native Firestore offline persistence queues committed writes until connectivity returns, but unsent in-memory samples also need a bounded durable local batch queue (persist periodically and on background/disconnect); replay with the preallocated batch IDs. A failed write stays queued and is surfaced as an error, never silently discarded. [Firebase pricing](https://firebase.google.com/docs/firestore/pricing); [offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline).

#### d. Final paired-device documents and connection log

| `users/{uid}/devices/{deviceId}` field | Final type | Optional? | Writer and compatibility |
|---|---|---|---|
| `deviceId`, `name` | string | No | Kevin and our app; ID remains the native Android MAC or iOS peripheral UUID. |
| `addedAt`, `lastConnectedAt` | Firestore Timestamp or null while pending | No for new writes; tolerate old null | Keep Kevin's timestamps and update `lastConnectedAt` only after a successful connect. |
| `platform` | `ios\|android` | Yes | Our app; missing means an Android-origin record. |
| `localName`, `serviceUUIDs` | string, string[] | Yes | Our app when advertised; discovery hints, not a cross-platform identity assertion. |
| `lastRssi`, `lastBattery` | number | Yes | Our app only when actually reported; never synthesize a value. |
| `modelNumber`, `firmwareRevision` | string | Yes | Our app only when 0x180A characteristics actually report them. |

Keep `users/{uid}.autoConnectDevice: boolean` (default true) unchanged. `src/lib/devices/connectionLog.ts` retains event types `connect_attempt`, `connected`, `disconnected` (reason `user\|unexpected`), `failed`, `app_background`, `app_foreground`; each has a millisecond timestamp and `deviceId` (null for app events), with optional attempt/auto/connectMs. Persist per-user in AsyncStorage, retaining at most 1,000 events and 30 days, whichever is smaller, and clear in-memory account state on sign-out. This supersedes the old comment proposing a Firestore events subcollection; no shared Firestore event collection is planned in B4. Poll connected RSSI every 30 s while foregrounded, suspend it in background, read 0x180F/0x2A19 battery at connect (and infrequently thereafter), and 0x180A/0x2A24 model plus 0x2A26 firmware at connect. Unsupported or failed reads show **“Not reported”**. The existing stats consume only `source: 'ble'` readings and distinguish user disconnects from unexpected drops; background/closed intervals cannot become artificial gaps.

#### e. Alerts and notifications

- Implement pure `checkHeartRate(reading, thresholds) -> AlertItem | null` over measured BLE HR only, with a 60 s cooldown for each `(deviceId, HR_HIGH|HR_LOW)`. Do nothing when Firestore thresholds `enabled` or Preferences “Alert notifications” is off. Ignore `source: 'test'` / legacy `manual` except in `__DEV__`. Reset cooldown/account state when the signed-in user changes.
- Use `expo-notifications` for local alert delivery, requesting permission at first alert use on iOS and Android 13+ (`POST_NOTIFICATIONS`), and handling denial without claiming delivery. Keep Notifications-screen history per user in bounded AsyncStorage (200 newest items); the current in-memory `src/lib/alerts/alertHistory.ts` API remains the adapter surface. This history is device-local, which avoids inventing Firebase rules for a new collection. Android's app has no alert engine; record it as an additive cross-team feature.

#### f. Background recording

- **iOS:** In B6 set the installed `react-native-ble-plx` 3.5.1 plugin's `modes: ['central']` (which adds `bluetooth-central`); `isBackgroundEnabled: true` affects Android's BLE hardware manifest entry, not iOS background mode in this plugin version. Construct `BleManager` with `restoreStateIdentifier` and `restoreStateFunction`, reattach monitors/owners for restored peripherals, and use service-filtered background scans. A pending `connectToDevice` without a timeout supports iOS background rediscovery. System-terminated apps may be relaunched for CoreBluetooth events; a user force-quit is outside that guarantee. Persist queued samples before suspension. [ble-plx plugin options](https://github.com/dotintent/react-native-ble-plx/blob/master/README.md); [ble-plx restoration](https://github.com/dotintent/react-native-ble-plx/wiki/Background-mode-%28iOS%29); [Apple background guide](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html).
- **Android:** Choose `@notifee/react-native` foreground service with its built-in Expo config plugin, plus a **local Expo config plugin** for its service's `android:foregroundServiceType="connectedDevice"` and `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_CONNECTED_DEVICE` manifest permissions. Start the service while the app is foregrounded, with one persistent “Recording from N devices” notification; register the long-running task outside React, stop it when recording ends, and test its coexistence with `expo-notifications`. Android 12+ Bluetooth scan/connect permissions are also required; request Android 13+ `POST_NOTIFICATIONS` for visible notifications, noting denial does not itself prohibit starting a foreground service. Explain battery-optimisation settings before directing the user there. Validate process-kill/reconnect behaviour on a physical Android phone; a foreground service is not a promise of uninterrupted execution. [Notifee installation/plugin](https://notifee.app/react-native/docs/installation/); [Notifee foreground service](https://notifee.app/react-native/docs/android/foreground-service/); [Android connected-device type](https://developer.android.com/develop/background-work/services/fgs/service-types); [Android BLE background guidance](https://developer.android.com/develop/connectivity/bluetooth/ble/background).
- Use existing connection status areas for “Recording in background” where they support it. Any additional screen wording/layout needs Tarun's separate approval under rule 0.3. Measure battery impact with the same phone/device(s), comparable baseline and active one-hour runs, noting screen state, signal and percentage-point drain; do not present an estimate as a measured result. Background/closed intervals are excluded from gap/drop-out stats.

#### g. Mock removal and h. order

B1: real single-device BLE and paired devices, with Preview mock retained. B2: per-device map and multi-device auto-connect. B3: live reading store, exact Kevin writes and new batches; remove seeded readings from real flows. B4: persisted connection log, RSSI, battery/device information and real stats; remove seeded connection history from real flows. B5: pure alert engine, local notification and history. B6: physical-device background recording and measured battery impact. B7: remove remaining mock paths from real flows. Keep Previews, explicitly labelled `__DEV__` test buttons and `testExtras` sample sleep only for development; real sleep remains “No sleep data yet,” and Distance/Floors/Calories remain “--” until a device reports them. No B-step reordering is recommended because each later step depends on the prior data surface.

#### i. Risks and approval questions

1. Step A live Firebase results are still pending from A11; B1 implementation should not be called done on the strength of local adapter tests. Tarun's Android build and the skipped Android Google SHA-1 also remain pending.
2. The project owners must confirm rules permit the additive `reading_batches` path. If they deny it, stop and ask PL to coordinate with Kevin/Jared; do not edit rules or console settings. Tarun must approve the exact reading and paired-device shapes above **before any Step B code**.
3. iOS UUIDs can change, advertisements may omit 0x180D, and identical names can make rediscovery ambiguous. Explicit selection is safer than connecting the wrong wearable. Confirm the team's physical devices and service advertisements during B1.
4. Four concurrent devices is a provisional product cap, not an OS guarantee. Test the exact phones and wearable mix before raising it; account for scan/connect contention and battery drain.
5. The chosen Notifee foreground service plus local manifest plugin needs an Android 14+ prebuild/manifest and process-lifecycle test, and a notification-interoperability test with `expo-notifications`. This Mac has no Android SDK; Tarun must run those checks on Windows/phone.
6. Both local queues and Firestore's offline cache can grow during long disconnected sessions. Set a measured storage limit and report backlog/error state before at-home deployment; avoid silent sample loss or unbounded writes.

### 2026-10-05 — B0 Progress Log

- Changed only this charter: refreshed the branch comparison, final additive reading/device shapes, and Step B implementation/test plan. No code, packages, Firebase settings or UI changed; no Kevin code was ported in B0 (Kevin path → our path: none). No fixes were made.
- Open items: A11 live Firebase checks, Tarun approval of document shapes and provisional four-device cap, Firestore rules for new collections, physical BLE devices, Android toolchain/testing, and background battery measurements. Kevin's repo remained read-only and clean. Stop for PL **and Tarun** plan approval; no Step B code until PL says “Step B plan approved by Tarun.”
- Validation: `npm run typecheck` and `git diff --check` pass. `git status` shows only this charter change; no secrets or generated native folders are staged/tracked. Kevin's working tree remains clean.
- Review click list (Mac, no app behaviour changed): open this charter, find “Phase 2 Step B plan”, inspect the two final document-shape tables and B1–B7 order, then send this section to Tarun. The expected result is agreement or specific requested edits before any Step B code.

### 2026-10-05 — Phase 2 B1: real single-device BLE

- Ported Kevin's scan, three-attempt/backoff connection, discover → battery → Heart Rate Measurement monitor, unexpected-drop reconnect, cancel/disconnect and state descriptions into a native BLE service. The native provider now uses it for one active device, while retaining the existing `useBle()` shape and presentational screens; the web/Preview mock remains separate. Native Heart Rate notifications update the in-memory live readings store immediately, so the Dashboard and Heart Rate page can show actual BPM. Kevin-format Firestore reading writes and full-resolution batches are **B3**, not claimed here.
- Ported paired-device Firestore subscriptions, save/forget and `users/{uid}.autoConnectDevice`. The most recent eligible native-platform device auto-connects when enabled. New paired-device fields are additive: `platform`, `localName`, `serviceUUIDs`; Android's existing fields and document ID stay intact. Foreign-platform entries show “Reconnect by scanning”; a stale iOS UUID can be rediscovered only from a unique name + advertised-service match. Ambiguous devices require manual scan selection.
- iOS Bluetooth manager creation waits until Devices/scan or eligible auto-connect; `Unauthorized` and `PoweredOff` are distinct, and the existing warning banner exposes its built-in Settings action on denial. Scanning runs a filtered 0x180D pass, then an unfiltered pass within 15 s; compact and expanded GATT UUIDs are normalised. Android-only permissions and MTU handling remain platform guarded. iOS Bluetooth/photo/camera usage strings and Kevin's BLE plugin options were added without a screen redesign.
- Ported files: Kevin `services/ble/BleService.ts` → `src/lib/ble/BleService.native.ts` plus extracted `heartRateMeasurement.ts` / `uuid.ts`; `services/ble/constants.ts` → `src/lib/ble/constants.ts`; `services/ble/permissions.ts` → `src/lib/ble/permissions.native.ts`; `services/ble/BleContext.tsx` → `src/features/devices/BleProvider.native.tsx`; `services/devices/pairedDevices.ts` → `src/lib/ble/pairedDevices.native.ts`. Existing containers and types were adapted only to bridge that service.
- Fixes over the source: no automatic connect when the auto-connect preference read is denied; clear live readings across account/provider teardown; ignore stale scan-pass callbacks; normalise 16-bit/full Heart Rate UUIDs; avoid treating an Android MAC as an iOS peripheral ID. The installed ble-plx 3.5.1 plugin inspection corrected the B6 plan above: iOS background mode uses `modes: ['central']`, whereas `isBackgroundEnabled` is Android-specific in this version.

**Validation and open items:**
- `npx expo install 'react-native-ble-plx@^3.5.1'` installed 3.5.1. Clean offline iOS and Android prebuilds generated Bluetooth permissions; the iOS Info.plist includes Bluetooth, photo-library and camera usage strings, and AndroidManifest includes scan/connect plus pre-Android-12 location permissions. `pod install --repo-update` installed the BLE pod. The offline iOS Simulator build succeeded with 0 errors and 4 script warnings, installed and opened to the sign-in screen. Final iOS and Android Metro exports, `npm run typecheck`, and 40 local tests pass.
- The physical iPhone is listed **offline** by Xcode; the Simulator has no BLE radio. No physical scan, pairing, BPM, reconnect, permission-prompt or paired-device Firestore operation was verified. Android Studio/SDK is absent here, so Android native compilation and phone testing remain Tarun-to-test. A11 live Firebase checks also remain pending. These gaps are recorded in `BUGS.md`; no security rules or Firebase console settings were changed.
- Physical iPhone click list with a Heart Rate strap or nRF Connect: open Devices/Add device → switch Bluetooth off/on and check distinct banners; deny Bluetooth and tap Settings; scan and check RSSI order, heart marker and 15 s stop; connect and cancel during setup; connect again and confirm measured BPM on Dashboard and Heart Rate; disconnect; walk out of range and back to check RECONNECTING; Forget; relaunch with auto-connect off then on. Repeat on an Android phone if available, and check `users/{uid}/devices/{deviceId}` in Firebase Console after a successful connect.
- ⛔ STOP after B1. Await PL's physical-device results and approval. Do not begin B2 or push.

### 2026-10-05 — App structure (final): 4 tabs with a bio-stats Activity tab
**This is the app's structure on both iOS and Android** (team decision; Phase 3 replaces Kevin's UI with it). Branch `phase-2`, on top of PL's B1 (`6ad37aa`). No Firebase, auth or BLE service code changed.

- **Tabs:** Dashboard (default after sign-in) | Devices | Activity | Settings. A standard tab bar (Feather `grid`, `bluetooth`, `activity`, `settings`; icon + label, active in accent). The raised centre button is gone, so `tabBarBaseHeight` is the plain bar height, and the `tabFab` / `tabFabLift` / `elevation.fab` tokens were removed. `TabKey` gained `activity`.
- **Activity tab** (`src/features/activity/`):
  - `activityModel.ts`: a pure `buildActivity()` turns readings into source chips and per-source sections.
    - Source key: a `deviceId`, `test-data` for `source: 'manual'`, or `unknown-device` for readings without a `deviceId` (shared data rule).
    - Chips are ordered by newest data. The default is the newest device, else (dev) Test data.
    - `dailySteps()`: a day's total is its highest running total.
  - `ActivityFocusProvider` (replaces `DeviceFilterProvider`): the chosen chip, kept while the app is open, plus a one-shot scroll request.
  - `useActivityData` / `ActivityContainer`:
    - `useSensorHistory` over 7 days (heart rate + steps).
    - The paired/connected list is used only for chip names.
    - `testExtras` sample sleep counts only as Test data in `__DEV__`.
    - The test buttons write `source: 'manual'` and select the Test data chip.
  - `ActivityScreen` (presentational) with `SourceChips`, `HeartRateSection`, `StepsSection` and `SleepSection`. These were moved out of the old pages; `sleepStages.ts` moved here.
  - `NotReported` shows "Not reported by this device." ("No test data for this yet." on the Test data chip).
  - Empty state: "No data yet / Connect a device in the Devices tab." The dev card holds Add Test Reading, Add 24h of Sample Data and Add Test Steps.
  - No device or connection information on this tab.
- **Not estimated:**
  - Resting heart-rate Week/Month trends and sleep have no real source, so `restingTrendsFor` returns null and `sleepFor` returns only the dev sample night (Test data).
  - The resting range is the same percentile range of measured readings the Dashboard already uses.
  - No distance, floors or calories on Activity.
- **Dashboard:**
  - Collapsed cards and the layout are unchanged, and so is `DashboardScreen`'s props type.
  - The expanded links now read **"Open in Activity ›"**: Heart Rate → Heart Rate section; Today's Activity and Calories → Steps; Sleep → Sleep. Each has its own screen-reader hint (`CardLink` gained `hint`).
  - `DashboardContainer` calls `focus(section, source)` with the card's source (the device of its latest reading; Test data for test readings and the dev sample night), then opens the tab.
  - The ring and "Devices ›" still open the Devices tab.
- **Removed:**
  - The pushed Heart Rate, Steps and Sleep pages, with their containers, hooks and previews (`features/heart-rate/`, `features/steps/`, `features/sleep/`).
  - `DeviceFilterProvider`, `useShowingLabel` and `lib/sensors/filterReadings.ts`.
  - The `heart-rate` / `steps` / `sleep` stack routes.
  - Alert Thresholds is now reached from Settings only.
- **Primitive:** `Screen` gained an optional `scrollRef` so Activity can scroll to a section (`measureLayout` against the scroll content).
- **Unchanged:** the Devices tab (exactly), Settings, Profile, Alert Thresholds, Notifications, Preferences, the unsaved-changes guard, Firebase/auth and BLE logic, and the Dashboard's "--" rule for Distance/Floors/Calories.
- **Previews:**
  - Activity: no data, one device with full data, two devices (chips switch), device missing sleep, stale, Test data chip (dev), loading, error.
  - Dashboard: + "With tab bar".
  - UI primitives: + "Tab bar: Dashboard" / "Tab bar: Activity" (tappable).
  - The Heart Rate, Steps and Sleep previews were removed.
- **Phase 2 swap points (current):**

| Swap point | Real source |
|---|---|
| `lib/sensors/readings.ts` (in-memory; used by `useDashboardData`, `useActivityData`, `useDevicesData`) | B3: Firestore-backed store, readings tagged with `deviceId` + `source` |
| `useActivityData` → `sleepFor` / `restingTrendsFor` | A real sleep / resting heart-rate source when one exists (null until then; dev sample night on Test data only) |
| `features/devices/BleProvider.tsx` (mock, web/Previews) / `BleProvider.native.tsx` (real, B1) | B2 multi-device, B4 connection log |
| `lib/sensors/testExtras.ts` | Dev only; delete once a real sleep source exists |

- **Checks:** `npm run typecheck` clean; 40/40 automated tests pass (none referenced the removed pages); web screenshots of the Activity states and tab bar at 375 wide (entry restored). iOS and Android JS bundles export, and a clean `expo prebuild --platform android` succeeds (Bluetooth permissions in the manifest; generated `android/` deleted, prebuild's package.json script change reverted). **Not run: `npx expo run:android`.** This Windows PC has no Android SDK, emulator or `adb` (no Android Studio), so the 4-tab emulator launch is still to verify once Android Studio is installed.

### 2026-10-05 — Handover v2: work moves to Kevin's repo (`ui-changes`)
- **The rules changed:**
  - Work now happens in **Kevin's repo** (`KevinCGIA/DSS-wearable-App`) on branch **`ui-changes`**.
  - `main` changes only through pull requests from `ui-changes`; nobody pushes to `main`, and nobody force-pushes.
  - One person works on `ui-changes` at a time.
  - **DSS-iOS-UI is now a frozen backup** (`phase-2` at `8f51881`); don't commit there any more.
  - `ui-changes` joins Kevin's history with an `ours` merge, so the tree is the unified app. Kevin's `.github`, `docs` and `shared` folders are kept.
  - See `AGENTS.md` ("Working on ui-changes") and `PL_1_SETUP_AND_CONTEXT.md` / `PL_2_PHASE2_TASKS.md` (v2).
- **B0 approved by Tarun:**
  - Kevin's reading fields plus the new `reading_batches` collection.
  - Device ID = platform + the device's own ID.
  - At most **4 devices** at once.
  - The connection log stays **on the phone** (AsyncStorage).
  - Weight range **20–300 kg**, pending team agreement (Kevin's app uses 2–500 kg).
  - B1 was committed before this approval and reviewed afterwards.
- **Tarun tested Kevin's old app with LightBlue on Android:** live heart rate works. Kevin's handshake may require a Battery service; **PL_2 T1** makes Battery and Device Information optional in our app.
- **The final UI:**
  - 4 tabs: Dashboard | Devices | Activity | Settings.
  - A bio-stats Activity tab: device chips, "Not reported by this device", no estimates.
  - IBM Plex Sans with tabular figures.
  - The formatting polish is done (20 padding, 16 between cards, shared SectionLabel, wrapping at X-Large).
- **Next:** Phase 2 continues from **PL_2 v2 step T0**, with Praneet on Codex.
- **Android testers:** `ANDROID_TESTING.md` covers setup, the LightBlue fake heart-rate device, the UI checklist and the A11/B1 checks. They report in `BUGS.md` (Screen | Bug | Steps | Platform/device | Tester | Status) through a pull request into `ui-changes`.

### 2026-10-06 — Main merge note
- `ui-changes` is being merged into Kevin's `main` via pull request; the old app is backed up as tag `before-unified-app` (`d835fe3`).
- Phase 2 continues on `ui-changes`; `main` is updated from `ui-changes` by pull request at each milestone.

### 2026-10-06 — PL setup checklist
- Branch `ui-changes` was pulled from KevinCGIA/DSS-wearable-App. Praneet confirmed the branch is reserved for this run. The history contains the 4-tab UI (`140a615`), IBM Plex Sans (`ab61c42`), polish commits and v2 handover (`d5e3465`).
- Tools: Xcode 27.0, CocoaPods 1.17.0, Node 22.18.0, Git 2.54.0. Both ignored, untracked Firebase config files identify `wearable-app-f9d83` with the expected iOS and Android bundle IDs. `.gitignore` excludes both files, `.env`, `/ios` and `/android`; no forbidden files are tracked.
- `npm install`, `npm run typecheck` and all 40 automated tests passed. Clean iOS prebuild and CocoaPods install succeeded. `npx expo run:ios` built with 0 errors and 4 script warnings; the iPhone 18 Pro Simulator opened to sign-in. The dev-only Preview badge is visible; live Firebase flows remain for T2. No differences from PL_1 section 7 were found.
- Setup answers: commits go to `ui-changes`; pull `origin ui-changes` before starting and before pushing; never commit to `main`; never commit Firebase config files, `.env`, `/ios` or `/android`; Tarun approves UI changes; existing Firestore fields may not change, only additions.
- The local continuous-run prompt was added as documentation to make the setup working tree clean. Open items remain live Firebase checks, Firebase rules confirmation for new paths, per-developer SHA-1, physical BLE checks, Android testing and JJ's Daily Insight.

### 2026-10-06 — Phase 2 T0: state check and decisions
- Confirmed `ui-changes` is pulled and clean after the setup commit was pushed. The 2026-10-05 v2 handover already records Tarun's B0 approval: Kevin-compatible reading fields plus `reading_batches`, platform + native device ID, maximum four devices, and a phone-local AsyncStorage connection log. Weight remains 20–300 kg pending team agreement; B1 was committed before approval and reviewed afterwards.
- Open: Kevin/Jared must confirm rules for `settings/alerts` and `reading_batches`; each Android developer supplies their own SHA-1 (Praneet's Android setup/testing is skipped for this run); Daily Insight remains with JJ. Live Firebase and physical BLE checks are collected in `TESTING_SESSION.md` for the final session.
- Validation: typecheck and all 40 automated tests pass; no Firebase config, `.env`, `/ios` or `/android` files staged or tracked. T0 changes documentation only.

### 2026-10-06 — Phase 2 T1: BLE robustness and bounded loading
- Heart-rate monitoring starts before the optional battery read. Battery has a two-second transaction deadline; missing, malformed or unavailable values remain null/Not reported and never trigger reconnect. Device Information remains optional and is not requested by the handshake. A device without the HR service stays connected and reports the missing capability through the existing Add device error banner.
- HR parsing ignores invalid base64 and truncated packets; tests cover 70, 100 and 16-bit 300 BPM. Native-service tests cover missing optional services and a device without heart rate.
- Added deadline helpers for BLE discovery/scanning/cancellation, profile loads/writes, alert settings loading/saving, paired-device/preferences subscriptions, auth readiness and profile creation/avatar Firestore writes. Initial subscription timeout ends loading while permitting recovery from a later snapshot. Existing error surfaces handle failures; no screen layout, style or navigation changes.
- Files: BLE service/parser, async deadline helper, auth/profile/threshold/device hooks, adapter tests and new deadline/BLE tests. Typecheck and all 46 tests pass. Physical iPhone and live Firestore checks remain pending in `TESTING_SESSION.md`; no console/rules changes and no new-path permission denial observed.
