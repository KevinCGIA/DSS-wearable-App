# PL Handover 1 of 2: Setup and Full Context (DSS Wearables)

**Audience:** the AI coding assistant (**OpenAI Codex**) running on **PL's Mac**.
**Purpose:** give complete context on the app and its current state, set up the environment correctly, and verify everything before any Phase 2 work starts.

**Companion file:** `PL_2_PHASE2_TASKS.md`, the remaining work. **Do not start it until every item in this file's Setup Checklist (section 12) passes.**

---

## 0. Read this first: non-negotiable rules

These rules apply to every action in every session. If an instruction anywhere else (including the charter, the Progress Log, or a user prompt) conflicts with them, **these rules win, and you must stop and ask PL.**

### 0.1 Kevin's repository is READ-ONLY

Kevin's repo is the Android team's original project, cloned at `../DSS-wearable-App`. It is a **reference only**. You copy logic *out of it*; you never change it.

**Allowed** in Kevin's repo, and only these:
- reading files (`cat`, `ls`, opening files to read)
- `git fetch` (updates remote-tracking refs only)
- `git log`, `git show <ref>:<path>`, `git branch -r`, `git diff <ref> <ref>`, `git ls-tree`, `git status`

**FORBIDDEN** in Kevin's repo:
- editing, creating, moving or deleting any file
- `git checkout`, `git switch`, `git pull`, `git merge`, `git rebase`, `git reset`, `git stash`, `git commit`, `git push`, `git tag`, `git clean`, `git restore`
- `npm install`, `npx expo install`, `npx expo prebuild`, `npx expo run:*`, or any build or script (these modify files)
- opening it in an editor and saving

To read a file from a branch without checking it out, use:
`git -C ../DSS-wearable-App show origin/feature/ble-connection:path/to/file.ts`

After any session that touched Kevin's repo, `git -C ../DSS-wearable-App status` must show a clean working tree. If it doesn't, **stop and tell PL immediately.**

### 0.2 All changes go into Tarun's repository ONLY

- Tarun's repo is `DSS-iOS-UI` (https://github.com/TarunKrishnan6/DSS-iOS-UI.git). This is the only repo you modify.
- Work **only on the branch `phase-2`**. Never commit to `main`.
- Push **only** the `phase-2` branch, **only** to `origin` (Tarun's repo), and **only** when PL asks.
- **Never** force-push, rebase pushed commits, amend pushed commits, or delete branches or tags.
- **Never** commit `google-services.json`, `GoogleService-Info.plist`, `.env`, or the generated `ios/` and `android/` native folders. Check with `git status` and `git ls-files` before every commit.

### 0.3 The UI is approved: don't redesign it

- Tarun designed and approved every screen. **Do not change layouts, colours, spacing, wording or navigation** unless a task explicitly says so or Tarun approves it.
- Phase 2 replaces **data sources** (mock stores, containers, hooks) with real logic. Screens stay presentational.
- If real data forces a UI change, describe it, propose the smallest change, and **stop for approval**.
- Tarun may restructure the navigation **after** Phase 2 (e.g. a per-device "Activity" tab). Keep logic out of screens and keep every reading tagged with `deviceId`/`source`, so that change stays UI-only. Don't build it now.

### 0.4 When unsure, stop and ask

Stop and ask PL before anything involving:
- pushing
- deleting
- secrets
- Firebase console or security rules changes
- UI changes
- anything in Kevin's repo beyond reading

## 0.5 Codex-specific operating rules

- **Run Codex from inside `~/DSSWEARABLE/DSS-iOS-UI`**, so that folder is the workspace. Kevin's repo sits outside the workspace at `../DSS-wearable-App`. Reading it is fine; writing to it is forbidden (rule 0.1).
- **Use an approval mode that asks before running commands** (not full-auto / "yolo"), so PL sees every command before it runs. Never request or use permission to write outside `DSS-iOS-UI`.
- Some steps need **network access** (`npm install`, `npx expo install`, `git fetch`/`pull`/`push`, `pod install`, builds). If the sandbox blocks them, ask PL to approve that specific command. Don't work around the sandbox.
- Codex reads `AGENTS.md` automatically. These handover files are linked from it (setup step 6). **Re-read them at the start of every new session** before continuing, then read the latest Progress Log entry to see where work stopped.
- **One step per turn.** Respect every ⛔ STOP in `PL_2_PHASE2_TASKS.md`, even when running autonomously. Never chain several steps without PL's approval.
- **Never** run destructive commands (`rm -rf`, `git reset --hard`, `git clean`, `git push --force`, `git checkout -- .`) without PL's explicit approval for that exact command.

---

## 1. What the app is

- **Name:** DSS Wearables (Expo `name`: "DSS Wearables").
- **Project:** CSE3CAP Capstone, Team BRIc, La Trobe University. Project owner: Shanmuga Sundar Dhanabalan (Deputy Director, CTI).
- **Purpose:** a companion app for **testing and demonstrating new BLE (Bluetooth Low Energy) wearable hardware.**
- **Users:**
  - **Researchers**: pair devices, check the connection and data work, compare devices, and give demos.
  - **Test subjects**: wear devices at home while the app records their data.
- **It is NOT a fitness app.** Never add fitness or coaching language or features (heart-rate zones, "fat burn", step goals, "% achieved", workouts, tips). Prioritise:
  - connection status
  - signal quality
  - device reliability
  - data quality
  - live and recorded data
- **Platforms:** iOS **and** Android from one codebase. The team agreed this app's UI (the 4-tab structure: Dashboard | Devices | Activity | Settings) becomes the UI on **both** platforms.

## 2. People

| Person | Role |
|---|---|
| **Tarun (TK)** | Built the UI (Phase 1 and the layout change). Owns `DSS-iOS-UI`. Reviews and merges PL's pull requests. Final say on UI. |
| **PL** | Doing Phase 2 on a Mac. You work for PL. |
| **Kevin** | Android team. Owns `DSS-wearable-App`. Real BLE, auth and Firestore logic lives on his branch `feature/ble-connection`. |
| **Jared / Kevin** | Firebase project owners. |
| **JJ** | Owns Jira DWBS22-372, "Daily Insight Summary". Not built anywhere; waiting on JJ. |

## 3. Repositories and folder layout on PL's Mac

```
~/DSSWEARABLE/
├── DSS-iOS-UI/          ← Tarun's repo. THE ONLY REPO YOU CHANGE. Work here, on branch phase-2.
└── DSS-wearable-App/    ← Kevin's repo. READ-ONLY reference (rule 0.1).
```

- `ANDROID_REPO_PATH` = **`../DSS-wearable-App`** (relative to `DSS-iOS-UI`). This overrides any Windows path written in `claudephase2charter.md`.
- Tarun's local folder on Windows is called `ios`. On PL's Mac the clone is `DSS-iOS-UI`. Same repo, different folder name.
- Kevin's relevant branches:
  - `main`
  - `feature/android-auth`
  - `feature/ble-connection` (**the target**: newest auth, BLE, sensors, devices and charts code, not yet merged into main as of 2026-10-03)
  - `feature/ios-auth`

## 4. Key documents in Tarun's repo

| File | What it is |
|---|---|
| `AGENTS.md` | **Auto-loaded by Codex.** Contains notes about the Expo SDK version (read the versioned Expo docs before using any Expo API). Setup step 6 adds a section telling Codex to read these handover files and the charter before any work. |
| `CLAUDE.md` | Tarun's Claude Code entry file (imports `AGENTS.md` and the charter). **Codex doesn't use it. Don't edit it.** |
| `claudephase2charter.md` | The full plan plus the **Progress Log**: every decision, the Task 0 Android Wiring Map, the UI Sign-off table, the "Phase 2 swap points" table, and the ported-file records. **Append to its Progress Log after every step.** |
| `ANDROID_BUGS.md` | 10 bugs found in Kevin's code. Several must be fixed (not copied) when porting. |
| `PL_1_SETUP_AND_CONTEXT.md` | This file. |
| `PL_2_PHASE2_TASKS.md` | The remaining work. |

**Order of authority** when documents disagree:
1. Rule 0 of this file
2. `PL_2_PHASE2_TASKS.md` (for work)
3. this file (for context and setup)
4. `claudephase2charter.md`

If the **code** or the latest Progress Log contradicts the "current state" described below, the code is the truth about what exists. Report the difference to PL.

## 5. Tech stack

| | Tarun's repo (`DSS-iOS-UI`) | Kevin's repo (`DSS-wearable-App`) |
|---|---|---|
| Expo / React Native | SDK 57 / RN 0.86.x | SDK 57 / RN 0.86.3 |
| Language | TypeScript | TypeScript |
| Navigation | Hand-rolled tab bar + stack in `src/navigation/RootNavigator.tsx` (no react-navigation, no expo-router) | expo-router (`app/` folder) |
| Imports | `@/` alias → `src/` | Relative imports, no alias |
| Firebase | `firebase` JS SDK in **preview mode** (no real backend yet). **Phase 2 switches to `@react-native-firebase`.** | `@react-native-firebase` (app, auth, firestore) + `@react-native-google-signin/google-signin` |
| BLE | **Mock** `BleProvider` (simulated devices) | `react-native-ble-plx ^3.5.1` (`services/ble/BleService.ts`, `services/ble/BleContext.tsx`) |
| Charts | Custom components, no chart package | `react-native-svg` |
| Local storage | `@react-native-async-storage/async-storage` (preferences) | — |
| Image picker | `expo-image-picker` | `expo-image-picker` |
| Fonts | Barlow (numerals), Manrope (UI) | — |
| Runs in Expo Go today? | **Yes** (until Phase 2 adds native modules) | No |

**Package rule:** always add packages with `npx expo install <pkg>` (it picks SDK-compatible versions). Never use plain `npm install <pkg>` for Expo or React Native packages.

## 6. Architecture rules of Tarun's app (keep them)

1. **Screens are presentational.** `features/<feature>/<Name>Screen.tsx` takes data and callbacks as props, with no Firebase, BLE, timers or business logic.
2. **Logic lives in hooks and containers** in the same feature folder (`use<Name>Data.ts`, `<Name>Container.tsx`), plus services and stores in `src/lib/`.
3. **Mocks** live in `src/data/` and the mock stores. Their shapes match the real Android data shapes, so Phase 2 replaces stores and services, not screens.
4. **Design tokens** live in `src/theme/` (colours, spacing, radius, elevation, typography). Never use literal hex or px in screens.
5. **Primitives** live in `src/components/ui/` (Button, Card, Pill, Screen, Header, ListRow, Toggle, Stepper, EmptyState, ErrorBanner, Avatar, SegmentedControl, StatReadout, BarChart, TabBar, ExpandableCard, etc.). Import each from its own file (no barrel files).
6. **Previews:** every screen has a `*.preview.tsx` covering all its states, listed in a dev-only Previews menu (Settings → Development → Previews, behind `__DEV__`). Keep these working; update them when props change.
7. **Accessibility:**
   - `Screen` handles safe areas
   - touch targets are at least 44pt
   - icon buttons have `accessibilityLabel`
   - layouts work at the app's X-Large text size and with the system's largest text
8. **Minimal code comments.**
9. **`npm run typecheck` must be clean** after every step.

## 7. Current state of the app (after Tarun's layout change)

Phase 1 (the full UI on mock data) was signed off on 2026-10-04. After that, Tarun restructured the navigation around researchers and test subjects. **Everything below runs on mock data. Nothing is connected to real Firebase or real Bluetooth yet.**

### 7.1 Navigation

- **Bottom tab bar, 4 tabs, in this order:** **Dashboard** (the default tab after sign-in) | **Devices** | **Activity** | **Settings**. A standard tab bar (icon + label, active tab in accent), no raised button. **This is the app's final structure on both platforms (2026-10-05).**
- The old tabs (Home, Heart Rate, Fitness, Sleep) and the later pushed Heart Rate / Steps / Sleep pages were removed. Their content is now the **Activity** tab.
- A hand-rolled **stack** on top of the tabs handles pushed pages and back navigation (‹, Android hardware back).
- An **unsaved-changes guard** in the navigator shows "Discard changes?" (Keep editing / Discard) when leaving an edited form via ‹, Android back, or a tab switch.

### 7.2 Sign-in / Register (Auth)

- One screen with a Log in / Register segmented switch, a blue header and the DSS logo.
- **Register fields:** name, email, password, confirm password, avatar (photo picker), height, weight. Height and weight follow the units preference (cm/kg or in/lb) and are always saved as cm/kg.
- **Login:** email and password, plus **Forgot password?**, which shows a "reset email sent" confirmation.
- **States:**
  - "Verification email sent" after registering
  - "Please verify your email" on unverified login
  - inline error banners
- **Google** sign-in and sign-up buttons.
- **"Preview the dashboard"** bypass for development without Firebase. **Phase 2 must make it `__DEV__`-only.**
- **Logic:** `useAuthForm` → `authService` (Firebase JS SDK / preview) and `useAuthSession`.

### 7.3 Dashboard tab (default)

- **Header on the textured blue banner:**
  - greeting and date ("Good morning · Sun, Oct 4")
  - a **?** button that opens a Help sheet (how to pair, what the connection states mean)
  - an **avatar** (photo or initials, green dot when a device is connected) that opens **Profile edit**
  - a "Welcome, {name}!" title and subtitle
- **Cards** (layout approved; collapsed cards must not change):
  1. **Heart Rate:**
     - BPM (or "--")
     - a small square **Live** / **Last seen x ago** badge
     - resting range ("Resting: x–y bpm · Normal")
     - a waveform that pulses while live
     - the empty text "No readings yet. Connect your wearable to start tracking."
  2. **Device and Today's Activity:**
     - left: a device ring showing the device name and an uppercase status (CONNECTED · 85%, SYNCING, CONNECTING (attempt n), RECONNECTING, DISCONNECTING, FAILED · Tap to retry, or "No Device · Tap to connect"), plus a sync button
     - right: Steps, Distance (km or mi) and Floors
     - with several devices connected, the ring shows "<n> devices connected" and the weakest signal or status
     - tapping the ring opens the **Devices** tab
  3. **Sleep & Recovery:** duration, score /100, a status pill and a stage bar, or "No sleep data yet".
  4. **Active Calories:** kcal, or "--" with "Not reported by connected devices yet." No target, no "% achieved", no goal bar.
- **Expandable cards:** tapping a card (or its chevron) expands it in place. Several can be open at once. Expanded content:
  - **Heart Rate:** the 24h chart with Min/Avg/Max, last reading time and source device (or "from Test data"), and "Open in Activity ›"
  - **Device and Activity:** a row for every connected device (name, signal bars + dBm, battery or "Not reported", status, last sync), an hourly steps mini chart, "Devices ›" and "Open in Activity ›", or "No device connected" + "Add device ›"
  - **Sleep:** the stage breakdown, bedtime → wake, a 7-night mini trend and "Open in Activity ›"
  - **Calories:** a source line and "Open in Activity ›"
- **"Open in Activity ›"** opens the Activity tab scrolled to that section (Heart Rate, Steps, Sleep; Calories → Steps) with that card's source device selected. The device ring and "Devices ›" go to the Devices tab.
- **Data honesty rules:**
  - **Distance, Floors and Active Calories always show "--"** in the real flow, because nothing provides them.
  - Test data is labelled "from Test data" and is never attributed to a real device.
  - No values are estimated or derived.
- **Logic:** `useDashboardData` / `DashboardContainer` → `useBle`, `useProfile`, the readings store, `usePreferences` (units), and `testExtras` (sample sleep only). The container maps the links to `ActivityFocusProvider.focus(section, source)` + the Activity tab.

### 7.4 Activity tab (bio stats only)

- A blue "Activity" header, then **source chips** (horizontal scroll, name only): one per device with data, most recent data first; readings without a `deviceId` show as "Unknown device"; a **Test data** chip in dev builds only. Default: the device with the newest reading, else (dev) Test data. The choice is kept while the app is open.
- **No device or connection information** here: no status, signal, battery, "Live · device" line, reconnect states or device actions. Those are the Devices tab's.
- Sections for the selected source:
  - **Heart Rate:** latest BPM with "Updated x ago" (greyed after 10 minutes), resting range, a 24h line chart of 30-minute averages (gaps as breaks) with Min/Avg/Max, and a resting heart-rate Week/Month trend
  - **Steps:** today's total, a 24h steps-per-hour chart with Total, and a 7-day daily steps chart. **No step goal.**
  - **Sleep:** last night (duration, score, stages) and Week/Month trends
- A section the source doesn't report shows **"Not reported by this device."** Nothing is estimated; no distance, floors or calories. Resting heart-rate trends and sleep have no real source yet.
- Empty state: "No data yet. Connect a device in the Devices tab."
- **Dev-only** Development card at the bottom: "Add Test Reading", "Add 24h of Sample Data" (Android's random sample generator, plus a sample night), "Add Test Steps". All write to the Test data source.
- **Logic:** `useActivityData` / `ActivityContainer` → the readings store (`useSensorHistory`, 7 days) split by source in `buildActivity` (`activityModel.ts`), the paired/connected device list only to name chips, and `testExtras` (sample sleep, dev only).
- **Alert Thresholds** is reached from Settings only.

### 7.5 Devices tab

- A blue "Devices" header and a summary strip: connected now, devices tested, readings today, overall connection success rate.
- An **Add device** button opens the scan/connect flow:
  - scanning auto-stops after 15 s
  - results are sorted by signal, with a ❤ marker for heart-rate devices
  - **six connection states:** connecting (attempt n of 3), setting up, connected, reconnecting, disconnecting, failed
  - **Cancel** during connecting
  - Bluetooth banners: off, unauthorized, unsupported, resetting
  - an auto-connect toggle
- **"Connected now"** cards, one per connected device (several can be connected at once):
  - name, status, signal bars + dBm, battery or "Not reported"
  - current BPM, 24h average BPM, steps today, readings this session, session duration, last reading
  - a data health badge: **Stable / Unstable / Not responding**
  - Disconnect and Forget
- **"Previously connected"** cards, most recent first:
  - last connected time, last known signal and battery
  - total sessions, total connected time, total readings, average BPM
  - the last session (date, duration, readings, how it ended: user or unexpected)
  - success rate, drop-outs, badge
  - Connect and Forget
- **Device Detail** (pushed): all stats, plus reliability (success rate, average time to connect, drop-outs, reconnects), data quality (readings/min, gaps over 30 s while connected) and the full session history.
- **Mock data sources:**
  - a mock `BleProvider` (supports several devices)
  - an in-memory **connection event log** (connect attempt, connected, disconnected with reason user/unexpected, failed, app background/foreground; timestamps + `deviceId`)
  - readings tagged by `deviceId`
  - badge thresholds as constants in one file
- **Stats rules:** test-data readings never count towards device stats. Background or closed time never counts as gaps or drop-outs.

### 7.6 Settings tab and pushed pages

- **Settings:**
  - a Profile row (small avatar, name, email) that opens Profile edit
  - Alert Thresholds, Notifications, Preferences
  - Development → Previews (dev only)
  - **Log Out** with a confirm dialog
  - no Devices section (it's a tab now)
- **Profile edit:**
  - avatar change via `expo-image-picker` (square crop, saves immediately)
  - name, height and weight with Save (units-aware, saved as cm/kg)
  - an Account section with **Change Email** (enter a new address, verification) and **Change Password** (sends a reset email)
  - the unsaved-changes guard
- **Alert Thresholds:**
  - an on/off switch
  - a 30–220 BPM range bar (amber below, green inside, red above)
  - Minimum and Maximum steppers in 5 BPM steps
  - validation: minimum 30–100, maximum 80–220, maximum at least minimum + 10
  - Save, with the "✓ Saved" state
  - mock storage shaped like `users/{uid}/settings/alerts`
- **Notifications:**
  - alerts grouped by day (Today / Yesterday / date)
  - a red ↑ for high and an amber ↓ for low, with value and time
  - Clear all, and the empty state "No alerts yet" + Set alert thresholds
  - a dev-only "Add Test Alert"
  - mock in-memory alert history
- **Preferences:**
  - text size (Default / Large / X-Large, applied app-wide)
  - units (Metric / Imperial)
  - an alert notifications on/off toggle
  - saved on-device with AsyncStorage

### 7.7 Mock stores that Phase 2 replaces

The exact list is the "Phase 2 swap points" table in the charter's Progress Log. Expected:

| Mock | Real replacement |
|---|---|
| `features/devices/BleProvider.tsx` (mock BLE) | Port of Kevin's `services/ble/BleService.ts` + `BleContext.tsx`, extended for multiple devices |
| `lib/sensors/readings.ts` (in-memory readings) | Port of Kevin's `services/sensors/*` (Firestore), with deviceId tagging and batched saving |
| connection event log (in-memory) | The same store, persisted, fed by real BLE events |
| `features/auth/authService.ts` (JS SDK / preview) | `@react-native-firebase` auth + Google Sign-In |
| `features/profile/accountService.ts` / `ProfileProvider` | Firestore `users/{uid}` + `private/avatarData` |
| `lib/alerts/thresholds.ts` / `alertHistory.ts` | Firestore `users/{uid}/settings/alerts` + the real alert engine |
| `lib/sensors/testExtras.ts` (sample sleep) | Keep for dev only; delete once a real sleep source exists |
| `lib/preferences` | **Keep** (device-local) |

## 8. Firebase (settled facts; don't reopen)

| | iOS | Android |
|---|---|---|
| Firebase project ID | `wearable-app-f9d83` | `wearable-app-f9d83` |
| Project number | `944450266341` | `944450266341` |
| App identifier | `com.galaxies.firebase` (`ios.bundleIdentifier`; also matches Kevin's app.json) | `com.dsswearablecool.firebase` (`android.package`) |
| Config file (project root) | `GoogleService-Info.plist` (has `CLIENT_ID` + `REVERSED_CLIENT_ID`) | `google-services.json` |

- Different app IDs in the **same** project is intentional. Accounts and data are shared across both platforms.
- **Not used:** the Firebase project `dss-wearable-bric` and the ID `au.edu.latrobe.bric.dsswearables`. Don't reference them.
- Both config files come from Tarun **privately**. They're gitignored. **Never commit them.** In the past they were accidentally committed once and had to be scrubbed, so check `git ls-files` before every commit.
- **Google sign-in on Android** requires the SHA-1 of the debug keystore on the machine doing the build. PL's Mac has its own keystore (`~/.android/debug.keystore`), so PL's SHA-1 must be added in Firebase (Phase 2 Step A covers this).
- **Google sign-in on iOS** requires the `@react-native-google-signin/google-signin` config plugin with `iosUrlScheme` = `REVERSED_CLIENT_ID` from the plist.
- **Firestore layout used by Kevin's Android app** (verify against his code before relying on it):
  - `users/{uid}`: profile (name, height, weight, …)
  - `users/{uid}/private/…`: avatar data (Base64)
  - `users/{uid}/sensor_readings/…`: sensor readings
  - `users/{uid}/devices/{deviceId}`: paired devices `{ deviceId, name, addedAt, lastConnectedAt }`. `deviceId` is a **MAC address** on Android.
  - **New in Phase 2:** `users/{uid}/settings/alerts`
- **Shared data compatibility rule:** until Phase 3, Kevin's Android app still writes to this same Firestore. Tarun's app may only **ADD optional fields or new collections**. Never rename, remove or change the type of any field Kevin's app writes or reads. Documents without the new fields must still work (a missing `deviceId` on a reading means "unknown device").
- **Do not change Firestore security rules or any Firebase console settings** without PL confirming the team (Kevin/Jared) agreed. It's a shared project.

## 9. Known issues and decisions you must respect

- **`ANDROID_BUGS.md`:** when porting Kevin's auth, **fix these, don't copy them**:
  - Google sign-in never creates the `users/{uid}` profile (Save Profile later fails)
  - Google sign-up wipes an existing user's profile
  - Google users always see "?" as their avatar

  Log each fix so the Android team can copy it.
- **Kevin's BLE handles ONE connection at a time.** This app's UI shows several, so Phase 2 extends it (see `PL_2_PHASE2_TASKS.md`).
- **Kevin saves heart rate at most once per minute.** That's too sparse for research, so Phase 2 adds batched saving of every reading.
- **iOS BLE differences** (detailed in the charter's "Phase 2: BLE on iOS"):
  - no MAC addresses on iOS (random peripheral UUIDs)
  - Android-only workarounds (GATT 133 handling, `requestMTU`, bonding calls) must be guarded by `Platform.OS === 'android'`
  - `Unauthorized` vs `PoweredOff` states
  - pairing is started by the device, not the app
  - 0x180D-filtered plus unfiltered scan passes
- **Background recording** for at-home use replaces the earlier "foreground-only" decision.
- **Daily Insight Summary** (DWBS22-372, JJ): no code exists anywhere. **Don't build it.**
- **Phase 3** (merging into Kevin's repo) is **not part of this work.**

## 10. Testing environment (PL's Mac)

| What | How |
|---|---|
| iOS, Firebase-only work | **iOS Simulator**: `npx expo run:ios` (the simulator supports Firebase, not Bluetooth) |
| iOS, Bluetooth | **Physical iPhone**: `npx expo run:ios --device`. The first time, open `ios/*.xcworkspace` in Xcode → Signing & Capabilities → choose PL's Apple ID team. On the iPhone, trust the developer under Settings → General → VPN & Device Management. |
| Android, Firebase-only | Android emulator, if Android Studio is installed: `npx expo run:android` |
| Android, Bluetooth | Physical Android phone over USB, if available. Otherwise Tarun tests Android on his Windows PC after PL pushes. |
| Expo Go | **Stops working** once Phase 2 adds native modules. Use development builds (`expo-dev-client`). |

- **Free Apple ID builds expire after 7 days.** Rebuild within 7 days of any demo.
- Test BLE hardware: a standard Bluetooth heart-rate chest strap (most reliable), or the **nRF Connect** app advertising a Heart Rate service. A Galaxy Watch doesn't expose heart rate over plain BLE. If nRF Connect can't read a device, the app can't either.
- **Common fixes:**
  - `cd ios && pod install --repo-update`
  - `npx expo prebuild --platform ios --clean`
  - "No Firebase App": the plist is missing from the root, or its bundle ID doesn't match

## 11. Setup procedure

Do these in order and report each result to PL. **Never skip a step. Stop at the first failure.**

1. **Tools:** report the versions of `xcodebuild -version`, `pod --version`, `node -v`, `npm -v` and `git --version`. Xcode and CocoaPods are required. Android Studio / Java are optional: check `java -version` and whether `~/Library/Android/sdk` exists, and report.
2. **Folder layout:** confirm `~/DSSWEARABLE/DSS-iOS-UI` and `~/DSSWEARABLE/DSS-wearable-App` both exist and are git repos. Confirm the current working directory is `DSS-iOS-UI`.
3. **Remotes:**
   - `git remote -v` in `DSS-iOS-UI` must show `origin` = `https://github.com/TarunKrishnan6/DSS-iOS-UI.git`
   - `git -C ../DSS-wearable-App remote -v` must show Kevin's repo
4. **Kevin's repo is clean and up to date (read-only):**
   - run `git -C ../DSS-wearable-App fetch`
   - `git -C ../DSS-wearable-App status` must be clean
   - list the remote branches and the latest commit on `origin/feature/ble-connection` (hash, date, message)
   - say whether `feature/ble-connection` has been merged into `main`
5. **Tarun's repo is up to date:**
   - `git checkout main`, then `git pull origin main`
   - report the latest 10 commits on `main`
   - the history must include "Phase 1 sign-off" and the layout-change commits (Dashboard expandable cards, Devices tab)
   - if the layout change isn't there, **stop**: Tarun hasn't pushed it yet
6. **Create the working branch and add the handover files:**
   - `git checkout -b phase-2` (if it already exists on origin, `git checkout phase-2` and `git pull` instead, and tell PL)
   - copy `PL_1_SETUP_AND_CONTEXT.md` and `PL_2_PHASE2_TASKS.md` into the repo root if they aren't already there
   - **append** (don't replace the existing Expo notes) this section to the end of `AGENTS.md`:
     ```
     ## Phase 2 handover (PL, using Codex)
     Before doing ANY work in this repo, read these files in full, in this order, and obey them:
     1. PL_1_SETUP_AND_CONTEXT.md (rules, context, setup checklist)
     2. PL_2_PHASE2_TASKS.md (the work, step by step)
     3. claudephase2charter.md (full plan + Progress Log; append to its Progress Log after every step)
     Rule 0 of PL_1_SETUP_AND_CONTEXT.md overrides everything: Kevin's repo (../DSS-wearable-App) is read-only, all changes go on branch phase-2 of this repo, never commit google-services.json / GoogleService-Info.plist / .env / ios/ / android/, and never redesign the UI.
     ```
   - **don't edit `CLAUDE.md`**: it's Tarun's Claude Code file
   - record the starting commit hash of `main` in the charter's Progress Log under a new entry "Phase 2 handover to PL"
   - commit as "Phase 2 handover: add PL docs"
7. **Firebase config files:**
   - `GoogleService-Info.plist` and `google-services.json` must exist in the repo root **with exactly those names**. Watch for hidden double extensions or "(1)" in the names.
   - verify from their contents:
     - `PROJECT_ID` = `wearable-app-f9d83`
     - `GCM_SENDER_ID` = `944450266341`
     - `BUNDLE_ID` = `com.galaxies.firebase`
     - `REVERSED_CLIENT_ID` is present
     - in the JSON: `project_id` = `wearable-app-f9d83`, `project_number` = `944450266341`, `package_name` = `com.dsswearablecool.firebase`
   - **Never print API keys in full.**
8. **Git safety:**
   - `.gitignore` must contain `google-services.json`, `GoogleService-Info.plist`, `.env`, `/ios` and `/android`
   - `git ls-files | grep -iE "google-services|GoogleService-Info|\.env$"` must print **nothing**
9. **Install and check:**
   - `npm install` (in `DSS-iOS-UI` only), then `npm run typecheck` (must be clean)
   - `npx expo config --type public` must resolve without errors
   - report `ios.bundleIdentifier` and `android.package` from `app.json`. Phase 2 Step A sets them; before it, they may still hold old values, which is expected.
10. **Baseline run (optional but recommended):** `npx expo start`, then open in Expo Go on an iPhone or press `i` for the simulator. Confirm the app opens and the 4-tab structure from section 7 is present. This is the last time Expo Go works.
11. **Read the plan:**
    - read `claudephase2charter.md` in full, especially the Progress Log entries from Task 0, "Phase 2 swap points", "Phase 2: BLE on iOS" and the layout-change entries
    - list any differences between section 7 of this file and what the code and log actually contain
12. **Report** the checklist below to PL and stop.

## 12. Setup Checklist: ALL items must be ✅ before starting `PL_2_PHASE2_TASKS.md`

Copy this list into your report with ✅ or ❌ and a one-line note for each.

**Environment**
- [ ] Xcode installed (version reported)
- [ ] CocoaPods installed (version reported)
- [ ] Node LTS and npm installed (versions reported)
- [ ] Android Studio / Java status reported (optional; note whether Android can be tested on this Mac)

**Repos**
- [ ] `~/DSSWEARABLE/DSS-iOS-UI` exists, `origin` = TarunKrishnan6/DSS-iOS-UI
- [ ] `~/DSSWEARABLE/DSS-wearable-App` exists and is Kevin's repo
- [ ] Kevin's repo fetched; `git status` **clean**; nothing modified there
- [ ] Latest `origin/feature/ble-connection` commit reported, and whether it's merged into `main`
- [ ] Tarun's `main` pulled; "Phase 1 sign-off" and the layout-change commits present
- [ ] Working on branch **`phase-2`** (not `main`)
- [ ] Handover files in the repo root, the "Phase 2 handover" section appended to `AGENTS.md`, `CLAUDE.md` untouched, committed on `phase-2`
- [ ] Starting commit hash recorded in the Progress Log

**Firebase**
- [ ] `GoogleService-Info.plist` present, exact name, `PROJECT_ID` `wearable-app-f9d83`, `GCM_SENDER_ID` `944450266341`, `BUNDLE_ID` `com.galaxies.firebase`, `REVERSED_CLIENT_ID` present
- [ ] `google-services.json` present, exact name, `project_id` `wearable-app-f9d83`, `project_number` `944450266341`, `package_name` `com.dsswearablecool.firebase`
- [ ] Both files gitignored and **not tracked**; `.env`, `/ios` and `/android` gitignored

**App**
- [ ] `npm install` succeeded; `npm run typecheck` clean
- [ ] `npx expo config` resolves
- [ ] (Optional) the app opens in Expo Go / the simulator with tabs Dashboard | Devices | Activity | Settings
- [ ] Differences between section 7 and the actual code/log listed (or "none")

**Understanding** (answer each in one line in the report)
- [ ] Which repo may be changed, and which is read-only?
- [ ] Which branch do all commits go on, and where may it be pushed?
- [ ] Which files must never be committed?
- [ ] What must never be changed without Tarun's approval?
- [ ] Which Firestore fields may be changed? (Answer: none of the existing ones; only additions.)

**If any item is ❌, stop, explain the fix, and wait for PL.** When all are ✅, tell PL: "Setup complete. Ready for `PL_2_PHASE2_TASKS.md` Step A."
