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

**Who the app is for (2026-10-04, overrides the fitness-style layout): an iOS difference from Android.** Researchers use it to test and demonstrate BLE wearables, and test subjects use it to record data at home. **Avoid fitness wording everywhere** ("Fitness", step goals, "achieved", calorie targets). Android still uses its 5 fitness-style tabs; iOS keeps Android's *actions and data* but organises them around devices and recordings.

**Bottom tabs (3, in this order):**

| Tab key | Label | Feather icon | Content |
|---|---|---|---|
| `devices` | Devices | `bluetooth` | Part 1: the existing Devices screen (scan/connect, six connection states, banners, auto-connect, paired list). **Part 2:** summary strip, Add device, one card per paired device with health/data stats, Device Detail. |
| `dashboard` | Dashboard | `activity` | **Raised centre button, the default tab on sign-in.** Combines the old Home, Heart Rate, Fitness and Sleep tabs (below). |
| `settings` | Settings | `settings` | Profile row, Alert Thresholds, Notifications, Preferences, Development (`__DEV__`), Log Out. Part 1 still has the Devices section; **Part 2 removes it** (it's a tab now). |

Android's tabs, for reference: Home, Heart Rate, Fitness, Sleep, Settings (+ hidden `devices` route). The mapping: Home + Heart Rate + Fitness + Sleep → **Dashboard** (with detail pages); `devices` → **Devices tab**.

**Dashboard** (`features/dashboard/`), keeping Home's header and visual style:

| Element | Shows | Empty / no-device state | Tap action |
|---|---|---|---|
| Top bar | Time-of-day greeting + date; "?" help; avatar (photo/initials, green dot when any device is connected) | "?" avatar with no name | ? → Help sheet; avatar → **Profile** |
| Banner | "Welcome, {first name}!" + "Here is your daily summary" on the textured blue hero | "Welcome!" | — |
| Connected devices strip | A chip per connected (or connecting) device: status dot, name, signal bars | "No device connected" + **Add device** | chip → Devices tab (Part 2: that device's card); Add device → Devices tab |
| Device filter | "All devices" (default) or one device. **Only shown when more than one device is connected.** All cards below follow it, and readings keep their source device (`deviceId`). | hidden | select filter |
| Card 1: Heart Rate | Live BPM, Live / Last seen, waveform, resting range, **source device** ("from Galaxy Watch8" / "from Test data") + **24 h line chart with Min/Avg/Max** | "--" BPM + "No readings yet…", no chart | → **Heart Rate** detail page (pushed, ‹) |
| Card 2: Steps | Today's total, "Updated x ago" + **24 h steps-per-hour chart with Total**. **No goal bar.** | "No step data yet…" | → **Steps** detail page (pushed, ‹; the old Fitness screen renamed, goal bar removed) |
| Card 3: Sleep & Recovery | The existing card | "No sleep data yet" | → **Sleep** detail page (pushed, ‹) |
| Card 4: Distance · Floors · Calories | Values with km/mi from Preferences | **"--" for all three** in the real flow (no real source); filled only in previews | — |

- Dev test-data buttons (Add Test Reading, Add 24h of Sample Data, Add Test Steps) stay on the Heart Rate and Steps **detail pages**, `__DEV__` only.
- Removed from the Dashboard (were on Home): the device ring + sync button (now the strip + Devices tab), the Active Calories target/"achieved" bar.
- Keep my visual language (Barlow numerals, accent colours, vital colours for meaning only, blue textured hero, white rounded cards).
- iOS-only improvements are logged in the Progress Log as suggestions for the Android team. Android bugs are in `ANDROID_BUGS.md`.

**Profile and Settings are split (iOS difference from Android, 2026-10-04).** Android keeps everything on one Settings page.

**Profile** (stack route `profile`, header + ‹ back; opened from the Dashboard avatar and from Settings' Profile row):
1. Avatar + "Change Profile Picture" (image picker, saves straight away)
2. Name, Height, Weight (units from Preferences) + Save (unsaved-changes guard on ‹, hardware back and tab switch)
3. Account: New Email + Change Email (verify-before-update), Change Password (sends a reset email)

**Settings tab:**
1. Profile row: small avatar, name, email and chevron → Profile
2. Devices section (Part 1 only; removed in Part 2)
3. Alert Thresholds, Notifications, Preferences
4. `__DEV__` only: Previews
5. Log Out (with confirm)

**Sub-screens (pushed on the hand-rolled stack, with a back button):** `profile`, `heart-rate`, `steps`, `sleep`, `alert-thresholds`, `notifications`, `preferences`, `previews` (+ `device-detail` in Part 2).

## Current state (audited)

**Design system — keep it, it's the base:**
- Tokens in `src/theme/`: colors (blue accent, ink neutrals, vital colours calm/peak/pulse used for meaning only), spacing (4-based), radius, elevation, typography (Barlow numerals, Manrope UI)
- Primitives in `src/components/ui/`: Button, Card, Pill, Screen, SegmentedControl, StageTrack, StatReadout, TabBar, TextField, BarChart
- Conventions: feature folders in `src/features/<name>/`, import each component from its own file (no barrels), no literal hex/px in screens

**Screens (as of 2026-10-04):**

| Screen | Where | Status |
|---|---|---|
| Auth | `features/auth/` | Built (Task 2) |
| Dashboard (tab, default) | `features/dashboard/` | **Part 1** (replaces Home) |
| Heart Rate detail (pushed) | `features/heart-rate/` | Built; now a detail page |
| Steps detail (pushed) | `features/steps/` | Built as Fitness; renamed, goal removed |
| Sleep detail (pushed) | `features/sleep/` | Built; now a detail page |
| Devices (tab) | `features/devices/` | Built (single device); **Part 2** per-device cards + Device Detail |
| Settings (tab) | `features/settings/` | Built; Devices section removed in Part 2 |
| Profile (pushed) | `features/profile/` | Built |
| Alert Thresholds / Notifications / Preferences (pushed) | `features/alerts`, `notifications`, `preferences` | Built (iOS only) |

Navigation: hand-rolled tabs + route stack in `RootNavigator.tsx` with the unsaved-changes guard.

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
5. **Replace each container's mocks with the real logic** (`useDashboardData`, `useHeartRateData`, `useStepsData`, `useSleepData`, `useAuthForm`/`authService`, the Devices/Settings containers). **Screens stay presentational and unchanged.**
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

   Part 2 of the 2026-10-04 UI change builds this log **in memory with mock data** and the Devices-tab stats on top of it. Step B wires it to real BLE events.

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
- [ ] **Live heart rate:** the Dashboard Heart Rate card shows "Live" and the source device, the BPM updates, the waveform pulses and the 24 h chart fills over time. The Heart Rate detail page matches.
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

## PHASE 3 — MERGE INTO KEVIN'S REPO (later, blocked on a team decision)

- **Blocking question for the team:** is my UI **iOS-only** (mounted via `*.ios.tsx` routes) or does it **replace the Android UI too**?
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

**Android comparison (vs `feature/ble-connection`):**

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
