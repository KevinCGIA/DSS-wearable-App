@AGENTS.md

# DSS Wearables — iOS UI (CLAUDE.md)

## Context

- App: **DSS Wearable Device Companion App** (CSE3CAP capstone, Team BRIc)
- **This project is my iOS UI**: Expo SDK 57, React Native 0.86, TypeScript, Firebase JS SDK, `@/` alias → `src/`. It is the base design; we're improving and finishing it.
- The Android team's app is complete in a separate repo: https://github.com/KevinCGIA/DSS-wearable-App. It uses expo-router (`app/` folder), `@react-native-firebase` and `google-services.json`.
- **Target branch: `origin/feature/ble-connection`** (not yet merged into `main`). Read it with `git show` only, with no fetch or checkout. Before Phase 2, re-check whether it has been merged or changed.
- Eventually this UI moves into a copy of the Android repo under `src/ios/` and gets wired to their logic (Phase 2). **Phase 1 happens here, in this standalone project.**
- I develop on Windows. Test with `npx expo start` (Android emulator, or Expo Go on an iPhone, since this project only uses Expo Go–compatible packages).
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
| Top bar, left | Today's real date, e.g. "Sat, Oct 3" (muted) | — | — |
| Top bar, right: refresh | Round icon button, spins while `refreshing` | — | `onRefresh` (reconnect/refresh device) |
| Top bar, right: avatar | Photo, or initials. Small green dot when a device is connected. | "?" with no name | **Settings tab** (Android) |
| Header | "Welcome!" or "Welcome, {first name}!" + muted "Here is your daily summary" | "Welcome!" | — |
| Header, right: help | Round outlined "?" button | — | Opens a static **Help sheet** (how to pair, what the connection states mean) |
| Card 1: Heart Rate | Heart icon in a soft accent circle, "Heart Rate", "Live" pill (≤ 2 min old) or "Last seen x ago". Hero BPM (Barlow) + "BPM" in accent. "Resting: low–high bpm · Normal" (from 24h data, "Normal" in calm). Waveform bars that pulse while live and stay still otherwise. | "--" BPM + "No readings yet. Connect your wearable to start tracking.", no waveform | Heart Rate tab *(iOS)* |
| Card 2 left: Device | Ring (accent border, soft fill) + watch icon, device name, uppercase status: CONNECTED / SYNCING (discovering or refreshing) / CONNECTING / RECONNECTING / DISCONNECTING / FAILED (+ battery when connected). "✓ Tap to sync" when connected. | Grey ring, "No Device", "Tap to connect" | **Devices** screen (Android) |
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
- [ ] **Auth:** move the Firebase calls into `useAuthForm.ts`. `AuthScreen` becomes props-only.
  - Login: email, password, `onSignIn`, `onSignInWithGoogle`, "Please verify your email" state, **Forgot password?** (`onSendPasswordReset`, same reset-email logic as Change Password) with a reset-sent confirmation
  - Register (match Android): avatar (optional, `onChooseProfilePicture`), name, height (cm), weight (kg), email, password, **confirm password** ("Passwords do not match."), `onSignUp`, plus a **separate Google sign-up button** (`onSignUpWithGoogle`), then a "Verification email sent" state
- [x] **Home (UI change 2, reference layout):** rebuild to match the Home dashboard table:
  - Props: `now` (date derived from it), `profile: UserProfile | null`, `profileLoading`, `connection: ConnectionState`, `refreshing`, `heartRate: LatestReadingState`, `restingRange: { low; high } | null`, `steps: LatestReadingState`, `activity: DailyActivityExtras`, `sleep: SleepSummary | null`, `onRefresh`, `onOpenSettings`, `onOpenDevices`, `onOpenTab`. **No `onLogout`.**
  - `HomeContainer` + `useHomeData` own the data, the clock and the refresh timer. The simulated heart rate lives in `useLiveHeartRate.ts`, used only in the connected preview.
  - New primitives: `IconButton` (incl. spinning), `Sheet` (help), `ProgressBar`, `Waveform`, Avatar initials + status dot, Pill `good` tier, raised centre tab
  - Remove the old area tiles, the bell, the zone label and Log Out
  - Previews: no device, connecting, connected + syncing, connected with full mock data (+ failed)
  - Log Out moves to Settings with a confirm
- [ ] **Sleep tab (from Analytics):** take `SleepSummary | null` and its series as props from a container. The default container returns no data, which gives the "No sleep data yet" state. Move the resting HR chart to the Heart Rate tab.

### Task 3: Build the missing and placeholder screens (in this order)
- [ ] **Settings** (one page, per the Settings section above). Props named after Android handlers: `onChooseProfilePicture`, `onSaveProfile`, `onChangeEmail(newEmail)`, `onChangePassword`, `onLogout`, `onConnect`, `onDisconnect`, `onForgetDevice`, `onSetAutoConnect`, `onOpenDevices`. Loading, saving and validation states. Previews entry under `__DEV__` only.
- [ ] **Devices** (Android route `devices`):
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
- [ ] No typecheck errors and no yellow-box warnings
- [ ] Write a **UI Sign-off** section in the Progress Log listing every screen, its props type, and its container/hook
- [ ] **Stop. Wait for me to say "start Phase 2".**

---

## PHASE 2 — MOVE INTO THE ANDROID REPO AND WIRE (LOCKED)

Overview only, for when I unlock it:
1. In my copy of the Android repo (`upstream` = Android team, never pushed to), read `package.json`, the `app/` folder and `tsconfig.json`. Compare:
   - **Expo SDK / RN version** (this project is SDK 57 / RN 0.86) and align to theirs
   - **Navigation** (expo-router?)
   - **Firebase client**: this project uses the JS SDK with `.env` keys. If they use `@react-native-firebase`, my containers switch to their auth/Firestore helpers and the JS SDK is dropped. Two Firebase clients must not coexist.
   - **The `@/` alias**: theirs probably points to the repo root, mine to `src/`. Re-alias my code as `@ios/*` → `./src/ios/*` and rewrite my imports.
2. Copy `src/` into `src/ios/` and merge the needed dependencies (fonts, linear-gradient, vector-icons) with `npx expo install`
3. Mount my UI on iOS with `app/*.ios.tsx` routes (or a platform-specific root layout), leaving the Android team's `app/*.tsx` untouched. Never put code in the root `ios/` or `android/` folders, because those are generated by prebuild.
4. Replace each container's mock data with the Android team's logic: auth (email verification, Google), the `users/{uid}` Firestore profile, BLE, the alert engine
5. Run an iOS compatibility audit and add the `ios` block in `app.json` (bundle ID, `GoogleService-Info.plist`, Bluetooth/photo/camera permission strings, `expo-build-properties` with `useFrameworks: "static"`)
6. Never touch or commit `google-services.json` / `GoogleService-Info.plist`
7. Write `IOS_BUILD.md` and `BUGS.md` for PL, who builds on his Mac and runs the tests

### Final step: Firebase and bundle ID (do last, with me)
Known so far: Android package **`com.dsswearablecool.firebase`**, Firebase project number **`944450266341`** (from the Google `webClientId`). **The project ID must come from Kevin or Jared**, because `google-services.json` is not in the repo. Android's placeholder `ios.bundleIdentifier` is `com.galaxies.firebase`, and mine is `au.edu.latrobe.bric.dsswearables`. Agree on one.
- [ ] Confirm with the team which Firebase project the iOS app uses. **It should be the same project as Android**, with the iOS app registered inside it, so both platforms share the same accounts and `users/{uid}` data.
- [ ] Set the iOS `bundleIdentifier` to match the iOS app registered in that Firebase project
- [ ] Add `GoogleService-Info.plist` and the `googleServicesFile` entry in `app.json`
- [ ] Test register/login on iOS, and log in on Android with the same account to confirm it's shared

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
