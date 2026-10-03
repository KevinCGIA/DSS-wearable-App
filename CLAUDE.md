@AGENTS.md

# DSS Wearables — iOS UI (CLAUDE.md)

## Context

- App: **DSS Wearable Device Companion App** (CSE3CAP capstone, Team BRIc)
- **This project is my iOS UI**: Expo SDK 57, React Native 0.86, TypeScript, Firebase JS SDK, `@/` alias → `src/`. It is the base design; we're improving and finishing it.
- The Android team's app is complete in a separate repo: https://github.com/KevinCGIA/DSS-wearable-App. It uses expo-router (`app/` folder), `@react-native-firebase` and `google-services.json`.
- **Target branch: `origin/feature/ble-connection`** (not yet merged into `main`). Read it with `git show` only, with no fetch or checkout. Before Phase 2, re-check whether it has been merged or changed.
- **Repo:** https://github.com/TarunKrishnan6/DSS-iOS-UI.git (private, `origin`). **Never push.** Tarun pushes himself. PL works on `fix/<name>` branches and opens pull requests into this repo; nobody pushes straight to `main` except Tarun.
- **Plan:** Phase 1 (UI) and Phase 2 (wiring real logic, ported from Kevin's repo) both happen **in this repo**. Merging into Kevin's repo is Phase 3, later, after PL has tested everything.
- I develop on Windows. In Phase 1, test with `npx expo start` (Android emulator, or Expo Go on an iPhone, since this project only uses Expo Go–compatible packages). From Phase 2 step 4, a development build is needed (no Expo Go).
- Read the versioned Expo docs (see AGENTS.md) before using any Expo API.

## Inputs to fill in

- `ANDROID_REPO_PATH` = `C:\Users\tarun\Desktop\DSSWEARABLE\DSS-wearable-App` (sibling of this ios folder, i.e. `..\DSS-wearable-App`). **Read-only: never edit, commit or run git commands that change anything in it.**

## Match the Android app (structure + wiring)

The Android app is already wired up. **My UI keeps its own visual design but copies the Android app's structure, buttons and actions exactly.** That way both platforms behave the same, and Phase 2 is a 1:1 swap of containers.

**Bottom tabs (5, in this order; tab keys = Android route names):**

| Tab key | Label | Feather icon | Content (matches Android `feature/ble-connection`) |
|---|---|---|---|
| `home` | Home | `home` | Dashboard (below) |
| `heart-rate` | Heart Rate | `heart` | Large live BPM with "● Live" and "Updated x ago" (greyed "Last reading x ago" after 10 min, "from {device}"), plus a 24h line chart with Min / Avg / Max. iOS extra (UI only): a link to Alert Thresholds. **No HR zones** (UI change 1). |
| `fitness` | Fitness | `activity` | Steps Today against a 10,000 goal progress bar, plus a 24h steps-per-hour bar chart with Total. **No distance, floors or calories.** |
| `sleep` | Sleep | `moon` | Default: empty "No sleep data yet" state (Android is a placeholder with no data source). My full sleep design (last night, stages, week/month score and hours) only appears in previews. |
| `settings` | Settings | `settings` | One page matching Android (Task 3) |

**Tab bar:** the 5 tabs above, with **Fitness as a raised circular accent button in the centre** (white icon, label underneath). The other tabs are unchanged, with the active tab in accent.

**Home dashboard (UI change 2: reference-screenshot layout).** Android's elements and destinations, in my visual language: light grey page, white large-radius cards with soft elevation, consistent gaps, everything scrolling above the tab bar.

| Element | Shows | Empty / no-device state | Tap action |
|---|---|---|---|
| Top bar, left | Time-of-day greeting + today's real date, e.g. "Good evening · Sat, Oct 3" (morning 5–12, afternoon 12–17, evening 17–21, night 21–5) | — | — |
| Top bar, right: avatar | Photo, or initials. Small green dot when a device is connected. | "?" with no name | **Settings tab** (Android) |
| Header (on the full-width blue hero background with the top bar) | "Welcome!" or "Welcome, {first name}!" + "Here is your daily summary", white on blue | "Welcome!" | — |
| Top bar, right: help (left of avatar) | Round white "?" button | — | Opens a static **Help sheet** (how to pair, what the connection states mean) |
| Card 1: Heart Rate | Heart icon in a soft accent circle, "Heart Rate", "Live" pill (≤ 2 min old) or "Last seen x ago". Hero BPM (Barlow) + "BPM" in accent. "Resting: low–high bpm · Normal" (from 24h data, "Normal" in calm). Waveform bars that pulse while live and stay still otherwise. | "--" BPM + "No readings yet. Connect your wearable to start tracking.", no waveform | Heart Rate tab *(iOS)* |
| Card 2 left: Device | Ring (accent border, soft fill) + watch icon, device name, uppercase status: CONNECTED / SYNCING (discovering or refreshing) / CONNECTING / RECONNECTING / DISCONNECTING / FAILED (+ battery when connected). Round **sync** button (`onRefresh`, spins while `refreshing`) beside "Tap to sync" when connected, or "Tap to retry" when FAILED. The ring and name open Devices. | Grey ring, "No Device", "Tap to connect" | **Devices** screen (Android) |
| Card 2 right: Today's Activity | "TODAY'S ACTIVITY" label, then Steps / Distance (km) / Floors rows, values right-aligned and bold, units muted | Steps 0. Distance and Floors "--" (no data source). | Fitness tab *(iOS)* |
| Card 3: Sleep & Recovery | Moon icon, title, status pill (e.g. "Optimal"). Duration (big) + "Sleep Duration", score "86 /100" + "Sleep Score". Segmented Deep/REM/Light bar with labels and durations. | Empty state "No sleep data yet" (no data source) | Sleep tab *(iOS)* |
| Card 4: Active Calories | Flame icon, title, "Target: 600" pill. Big kcal + muted "kcal", "{n}% achieved" in accent, rounded progress bar. | "--" kcal, empty bar (no data source) | Fitness tab *(iOS)* |

- **No Log Out on Home.** Log Out lives only in Settings (with confirm). This is an iOS change from Android, logged in the Progress Log.
- **No bell on Home.** Notifications stay reachable from Settings.
- **Distance, floors, calories and sleep** have no Android data source. They show "--" or an empty state in the real flow, and real values only in previews/mocks.
- Default Home state is **no device connected**. The simulated heart rate (`useLiveHeartRate`) is used only in the connected preview.
- Keep my visual language (Barlow numerals, accent colours, vital colours for meaning only). Don't copy Android's emojis or Material styling.
- iOS-only improvements are logged in the Progress Log as suggestions for the Android team. Android bugs are in `ANDROID_BUGS.md`.

**Settings: one scrolling page, like Android (no Profile sub-screen):**
1. Avatar (tap or "Change Profile Picture") + editable profile: Name, Height (cm), Weight (kg), Save Changes
2. Devices section: current device + Disconnect/Cancel, Auto-connect toggle, "Pair a New Device" → Devices, Paired devices list with Connect / Forget (confirm) and its empty state
3. Account & Security: New Email input + Change Email (verify-before-update), Change Password (sends a reset email)
4. iOS-only rows: Alert Thresholds, Notifications, Preferences (if built)
5. Log Out (with confirm)
6. `__DEV__` only: Previews

**Sub-screens (pushed on the hand-rolled stack, with a back button):** `devices`, `alert-thresholds`, `notifications`, `preferences`, `previews`.

## Current state (audited)

**Design system — keep it, it's the base:**
- Tokens in `src/theme/`: colors (blue accent, ink neutrals, vital colours calm/peak/pulse used for meaning only), spacing (4-based), radius, elevation, typography (Barlow numerals, Manrope UI)
- Primitives in `src/components/ui/`: Button, Card, Pill, Screen, SegmentedControl, StageTrack, StatReadout, TabBar, TextField, BarChart
- Conventions: feature folders in `src/features/<name>/`, import each component from its own file (no barrels), no literal hex/px in screens

**Screens:**

| Screen | Status | Notes |
|---|---|---|
| Auth (`features/auth/AuthScreen.tsx`) | Built | Login/register segmented. **Firebase calls are inside the screen**, which breaks Rule 1. No email verification, Google sign-in or forgot password. |
| Home (`features/home/HomeScreen.tsx`) | Built | Simulated heart rate (2s interval inside the screen), sleep summary, area shortcuts |
| Analytics (`features/analytics/AnalyticsScreen.tsx`) | Built | Week/month sleep and resting HR charts from `src/data/sleep.ts` |
| Monitoring (`features/monitoring`) | Placeholder | |
| Settings (`features/settings`) | Placeholder | Only Sign out |
| Devices (was "Pair Device") | Missing | |
| Alert Thresholds | Missing | iOS only, no backend yet |
| Notifications / Alerts list | Missing | iOS only, no backend yet |
| Preferences / Accessibility | Missing | iOS only, lowest priority |

Navigation is a hand-rolled tab state in `RootNavigator.tsx` (Home / Activity / History / Settings). There's no stack, so sub-screens (Pair, Alerts, Profile) have nowhere to push.

## Rules

1. **Screens are presentational.** They take data and callbacks as props, with no Firebase, BLE, timers or business logic inside. Logic lives in a hook or container in the same feature folder (`useX.ts` / `XContainer.tsx`). In Phase 2, only the containers get swapped for the Android team's logic.
2. All fake data lives in `src/data/`. Its shapes must match the real data shapes listed below.
3. Use the existing tokens and primitives. Add a token rather than a literal value, and add a primitive rather than duplicating UI.
4. Every screen has a `*.preview.tsx` rendering each state (empty, loading, error, filled) with mock props, reachable from a dev-only Previews menu.
5. iOS-first: `Screen` handles safe areas, touch targets are at least 44pt, icon buttons get `accessibilityLabel`, and layouts must work at larger text sizes.
6. Don't add native-only packages (BLE, `@react-native-firebase`, etc.) in Phase 1. The app must keep running in Expo Go.
7. Minimal comments. Run `npm run typecheck` after every task and fix all errors. Commit after each task. Update the Progress Log.
8. **Firebase and bundle ID are deferred to the end of Phase 2.** Don't change `bundleIdentifier` in `app.json`, don't add a `.env`, and don't touch any Firebase config. The app runs in preview mode without Firebase. Only set `supportsTablet` to false.

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
- [x] **Settings** (one page, per the Settings section above). Props named after Android handlers: `onChooseProfilePicture`, `onSaveProfile`, `onChangeEmail(newEmail)`, `onChangePassword`, `onLogout`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onOpenDevices`. Loading, saving and validation states. Previews entry under `__DEV__` only.
- [x] **Devices** (Android route `devices`):
  - Connection card for all six states: connecting (attempt n), discovering ("Setting up device..."), reconnecting (attempt n), disconnecting, failed (`error` on disconnected), connected (battery + Disconnect). **Cancel** for pending states.
  - Bluetooth banners: PoweredOff / Unauthorized / Unsupported / Resetting. Scan error banner.
  - Scan / Stop Scanning (disabled while busy). Scan results sorted by RSSI with an HR-capable marker, signal bars + label, and "Current" / "Connect". Empty text for scanning and idle.
  - Auto-connect toggle and Paired devices (Connect / Forget with confirm) — the same components as Settings
  - Props: `onStartScan`, `onStopScan`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onBack`
- [ ] **Fitness tab**: Steps Today vs 10,000 goal (progress bar, "Goal reached!", "Updated x ago"), 24h steps-per-hour bar chart with Total. States: loading, error, no data ("No step data yet. Connect your wearable to start tracking.").
- [ ] **Heart Rate tab**: large BPM, Live badge, Updated/Last reading age, "from {device}", greyed when stale, no zones, 24h line chart with Min/Avg/Max (needs a `LineChart` primitive: Views, or `react-native-svg` via `npx expo install`, which is Expo Go–compatible and already in Android's deps), link to Alert Thresholds. States: loading, error, no data.
- [ ] **Alert Thresholds** (iOS only, **no backend yet**): enable toggle, min/max HR steppers, validation (min < max, sensible range), Save
- [ ] **Notifications** (iOS only, **no backend yet**): alerts grouped by day, with type icon, value and time, plus an empty state
- [ ] **Preferences / Accessibility** (lowest priority, only if time allows): text size (scale factor in typography), units, notifications toggle

### Task 4: Polish and sign-off
- [ ] Click through every flow:
  - Auth (all states) → Home (no device) → tap device → Devices → Home (connected)
  - Each Home element tap goes to the right tab or screen
  - Heart Rate → Alert Thresholds → Fitness → Sleep → Settings → Notifications → Preferences
  - Log Out from both Home and Settings
- [ ] Compare side by side with the Android app: same tabs, same Home elements in the same order, Android's tap destinations (plus the iOS improvements)
- [ ] Check the largest text size, a small iPhone width (375) and a large one (430)
- [ ] Replace the default Expo app icon and splash with the DSS icon (the accent-blue chevron matching the Home design), and check the app name shows as "DSS Wearables" on the iPhone home screen.
  - Status: icons were generated on 2026-10-04 by `scripts/generate-logo.mjs` (`icon.png`, `splash-icon.png`, Android adaptive icons, favicon).
  - Still to do: wire the splash in `app.json` (needs OK, Rule 8), and verify both the icon and the name in a real build. Expo Go shows its own icon.
- [ ] No typecheck errors and no yellow-box warnings
- [ ] Write a **UI Sign-off** section in the Progress Log listing every screen, its props type, and its container/hook
- [ ] **Stop. Wait for me to say "start Phase 2".**

---

## PHASE 2 — WIRE REAL LOGIC (in this repo) (LOCKED until I say "start Phase 2")

**Where:** this repo (`https://github.com/TarunKrishnan6/DSS-iOS-UI.git`, private). **Kevin's repo stays read-only**; it's only a reference to copy logic from. **Never push.** Tarun pushes. PL tests from this repo on his Mac, works on `fix/<name>` branches, and opens pull requests into this repo or logs issues in `BUGS.md`. Nobody pushes straight to `main` except Tarun.

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
5. **Replace each container's mocks with the real logic** (`useHomeData`, `useSleepData`, `useAuthForm`/`authService`, the Devices/Settings/Heart Rate/Fitness containers). **Screens stay presentational and unchanged.**
6. **Alert engine** (Android has none):
   - A pure function `checkHeartRate(reading, thresholds)` → `AlertItem | null`, compared against `hrMin`/`hrMax`
   - A 60 s cooldown per alert type
   - Thresholds stored at `users/{uid}/settings/alerts`
   - Local notifications via `expo-notifications`, including the iOS permission request
   - Alerts saved for the Notifications screen

   Log this in the Progress Log as **a gap to tell the Android team** (they can reuse the same engine).
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
  - `isBackgroundEnabled: false` means no `bluetooth-central` background mode.
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

**5. Background: foreground only for the demo.**
- No `bluetooth-central` background mode (`isBackgroundEnabled: false`).
- When the app goes to the background, iOS suspends JS within seconds. Heart rate stops being saved, and the link may drop.
- On return, `onDeviceDisconnected` fires and the reconnect flow (below) runs.
- **Known limitation:** no background heart-rate logging or background alerts on iOS. A future option is background mode + CoreBluetooth state restoration.

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

**7. Test checklist for PL** (physical iPhone, dev build; log results in `BUGS.md`):
- [ ] First Devices visit: Bluetooth permission prompt appears (not at login). Deny it → "Bluetooth permission was denied" banner. Allow it in iOS Settings → scanning works.
- [ ] Bluetooth off in Control Centre → "Bluetooth is turned off" banner. Back on → banner clears.
- [ ] **Scan:** devices appear sorted by signal, with the heart-rate marker. Auto-stops after 15 s. Stop Scanning works.
- [ ] **Connect:** connecting → setting up → connected, with battery shown. Cancel during connecting returns to no device.
- [ ] **Live heart rate:** Home card shows "Live", the BPM updates and the waveform pulses. The Heart Rate tab shows live BPM and the 24 h chart fills over time.
- [ ] **Disconnect** from Devices and from Settings → Home shows "No Device".
- [ ] **Out of range:** walk away until it drops → RECONNECTING (attempt n) → reconnects when back in range, or FAILED after 3 attempts.
- [ ] **Forget device** (confirm) → removed from Paired devices. If it was connected, it disconnects.
- [ ] **App restart with Auto-connect on** → reconnects to the last iOS device without scanning. With Auto-connect off, it doesn't.
- [ ] **Alert notification:** set Max to just under your current heart rate → a local notification fires once (60 s cooldown) and appears on the Notifications screen. Notification permission prompt appears the first time.
- [ ] Background the app for 1 min, then return → reconnects (the foreground-only limitation is expected).

### Phase 2 Final step: Firebase (do last, with me)
- [ ] **Confirm the Firebase project with the team.** It's the **same project as Android**: package **`com.dsswearablecool.firebase`**, project number **`944450266341`**. The **project ID must come from Kevin or Jared** (`google-services.json` isn't in their repo).
- [ ] **Register the iOS app in that project** and set `ios.bundleIdentifier` to match. Android's placeholder is `com.galaxies.firebase`, mine is `au.edu.latrobe.bric.dsswearables`; agree on one.
- [ ] **Add the config file:** `GoogleService-Info.plist` (never committed) and `ios.googleServicesFile` in `app.json`.
- [ ] **Google sign-in on iOS:** configure the URL scheme from `REVERSED_CLIENT_ID` via the `@react-native-google-signin/google-signin` config plugin (`iosUrlScheme`), and add `iosClientId`. Without this, Google sign-in fails on iPhone.
- [ ] **Test shared data:** register and log in on iOS, then log in on Android with the same account to confirm the account and `users/{uid}` data are shared.

---

## PHASE 3 — MERGE INTO KEVIN'S REPO (later, blocked on a team decision)

- **Blocking question for the team:** is my UI **iOS-only** (mounted via `*.ios.tsx` routes) or does it **replace the Android UI too**?
- **Placeholder `ios/` folder:** Kevin's repo has one (only `.gitkeep`, plus a CODEOWNERS entry for `/ios/`). Move its contents to `docs/ios/` before any iOS prebuild there, because prebuild generates `ios/`.
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
