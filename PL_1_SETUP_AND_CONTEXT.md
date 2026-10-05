# PL Handover 1 of 2: Setup and Context (v2: work now happens in Kevin's repo)

**Audience:** the AI coding assistant (**OpenAI Codex**) running on **PL's (Praneet's) Mac**.
**This version replaces yesterday's `PL_1_SETUP_AND_CONTEXT.md`.** The rules changed: all work now happens in **Kevin's repo** on the branch **`ui-changes`**. Ignore any older instruction that says Kevin's repo is read-only or that work goes in `DSS-iOS-UI`.

**Companion file:** `PL_2_PHASE2_TASKS.md` (v2), the remaining work. **Don't start it until every item in section 12 passes.**

---

## 0. Rules (these override everything else, including the charter and older handover files)

### 0.1 Where work happens
- **Working repo:** Kevin's repo, `DSS-wearable-App` (https://github.com/KevinCGIA/DSS-wearable-App).
- **Working branch:** **`ui-changes`**. It contains the full unified app: Tarun's UI + Kevin's ported logic + Phase 2 so far.
- **Never commit or push to `main`.** `main` still holds the Android team's old app until the team merges `ui-changes` by pull request.
- **Never force-push.** Never rebase, amend or reset commits that are already pushed. Never delete branches or tags.
- **Always `git pull origin ui-changes` before starting work and before every push.** Tarun and the Android team may push to the same repo.
- **One person works on `ui-changes` at a time.** PL and Tarun agree who is working before starting. The Android team works on their own `android-testing` branch and sends pull requests into `ui-changes`.
- **Kevin's old branches** (`feature/ble-connection`, `feature/android-auth`, `feature/ios-auth`) and the old `main` are **history only**. Never merge them into `ui-changes`; they would bring the old app back. Read old code with `git show origin/feature/ble-connection:<path>` if needed.
- **`DSS-iOS-UI` (Tarun's private repo) is a frozen backup.** Don't commit or push there.

### 0.2 Never commit secrets or generated folders
- Never commit `google-services.json`, `GoogleService-Info.plist`, `.env`, `/ios` or `/android`.
- Before every commit run `git status`. Before every push run `git ls-files | grep -iE "google-services|GoogleService-Info|\.env$"`, which must print nothing.

### 0.3 Don't redesign the UI
- Tarun's UI is final and approved. Don't change layouts, colours, fonts, spacing, wording or navigation.
- Phase 2 swaps **data sources** (providers, services, hooks, containers). Screens stay presentational.
- If real data genuinely needs a UI change, propose the smallest change and **stop for Tarun's approval**.

### 0.4 Shared Firebase project
- **Never change Firestore security rules or Firebase console settings.** Ask PL to coordinate with Kevin/Jared.
- **Firestore: only additions.** Never rename, remove or retype existing fields (section 8).

### 0.5 Codex operating rules
- **Run Codex from inside `~/DSSWEARABLE/DSS-wearable-App`.**
- **Use an approval mode that asks before running commands** (not full-auto).
- Network commands (`npm`, `npx expo install`, `git fetch/pull/push`, `pod install`, builds) need PL's approval. Don't work around the sandbox.
- **Re-read `AGENTS.md`, this file, `PL_2_PHASE2_TASKS.md` and the latest Progress Log entry in `claudephase2charter.md` at the start of every session.**
- **One step at a time.** Respect every ⛔ STOP.
- **Never** run `rm -rf`, `git reset --hard`, `git clean`, `git push --force` or `git checkout -- .` without PL's explicit approval for that exact command.
- If anything is ambiguous or risky, **stop and ask**.

---

## 1. What the app is
- **DSS Wearables**, CSE3CAP Capstone, Team BRIc, La Trobe University.
- **Purpose:** a companion app for **testing and demonstrating new BLE wearable hardware.**
- **Users:**
  - **researchers**, who pair devices, check connection and data, compare devices, and demo them
  - **test subjects**, who wear devices at home while the app records data
- **NOT a fitness app.** No zones, goals, "% achieved", workouts or coaching.
- **Core requirement: several devices connected at once,** each with its own data and stats.
- **One codebase for iOS and Android.** The team agreed this UI becomes the app on both platforms.

## 2. People
| Person | Role |
|---|---|
| **Tarun (TK)** | Built the UI. Approves any UI change. Reviews the final pull request. |
| **Praneet (PL)** | Continues Phase 2 on a Mac. You work for PL. |
| **Kevin / Jared** | Android team; own the repo and the Firebase project. |
| **Android team** | Tests `ui-changes` on Android; reports in `BUGS.md` via pull requests into `ui-changes`. |
| **JJ** | Daily Insight Summary (DWBS22-372). Not built; waiting on JJ. Don't build it. |

## 3. Folder layout on PL's Mac
```
~/DSSWEARABLE/
├── DSS-wearable-App/    ← Kevin's repo. WORK HERE, on branch ui-changes.
└── DSS-iOS-UI/          ← optional, frozen backup. Don't commit here.
```

## 4. Key documents (in the repo root on `ui-changes`)
| File | What it is |
|---|---|
| `AGENTS.md` | Auto-loaded by Codex. Expo SDK notes plus a short "Working on ui-changes" section pointing here. |
| `CLAUDE.md` | Tarun's Claude Code entry file. **Don't edit it.** |
| `claudephase2charter.md` | Full plan and **Progress Log**. **Append to the Progress Log after every step.** |
| `PL_1_SETUP_AND_CONTEXT.md` | This file. |
| `PL_2_PHASE2_TASKS.md` | The remaining work. |
| `ANDROID_TESTING.md` | The Android team's test guide. |
| `BUGS.md` | Screen \| Bug \| Steps \| Platform/device \| Tester \| Status |
| `ANDROID_BUGS.md` | Bugs found in Kevin's old app (most are fixed in this app). |

**Order of authority:** section 0 of this file → `PL_2_PHASE2_TASKS.md` → this file → the charter. If the code contradicts this file, the code is the truth about what exists; report the difference.

## 5. Tech stack
| | Value |
|---|---|
| Expo / React Native | SDK 57 (installed 57.0.26) / RN 0.86.x, TypeScript |
| Navigation | Hand-rolled tab bar + stack in `src/navigation/RootNavigator.tsx` (no expo-router) |
| Imports | `@/` alias → `src/` |
| Firebase | `@react-native-firebase` (app, auth, firestore) + `@react-native-google-signin/google-signin` |
| BLE | `react-native-ble-plx` |
| Dev builds | `expo-dev-client`. **Expo Go no longer works.** |
| Fonts | IBM Plex Sans (400/500/600/700), numbers with tabular figures |
| iOS build settings | `expo-build-properties` with `useFrameworks: "static"`, plus scene support and Firebase `disableSPM` (needed for Xcode 27) |

Add packages with `npx expo install <pkg>` only.

## 6. Architecture rules
1. **Screens are presentational:** props in, no Firebase/BLE/timers inside.
2. **Logic** lives in hooks, containers, providers and services (`src/lib/`, `src/features/<feature>/`).
3. **Tokens** live in `src/theme/` (spacing, type including `type.overline` and `type.unit`, icon sizes, layout). No literal values in screens.
4. **Primitives** live in `src/components/ui/`, imported from their own files.
5. **Previews:** every screen has `*.preview.tsx` (dev-only menu: Settings → Development → Previews). Keep them building.
6. **Typecheck and tests:** `npm run typecheck` clean and all automated tests passing after every step.
7. **Minimal comments.**

## 7. Current state of the app

### 7.1 UI (final)
- **Tabs:** **Dashboard** (default) | **Devices** | **Activity** | **Settings**. Standard tab bar, no raised button.
- **Dashboard:**
  - blue header with greeting/date, a **?** Help sheet and the avatar (→ Profile)
  - **expandable** cards: Heart Rate · Device & Today's Activity (device ring, "<n> devices connected" when several) · Sleep & Recovery · Active Calories
  - expanded cards link with **"Open in Activity ›"**
  - Distance/Floors/Calories show **"--"** (no data source)
- **Devices tab:**
  - summary strip
  - **Add device** scan/connect flow (six states, Cancel, Bluetooth banners, auto-connect)
  - **Connected now** and **Previously connected** cards with per-device stats and Stable/Unstable/Not responding badges
  - **Device Detail** with reliability, data quality and session history
  - stats come from a connection event log, which is **not yet fed by the real provider** (B4)
- **Activity tab:** **bio stats only.**
  - device chips choose whose data is shown
  - sections: Heart Rate (latest BPM, 24h chart Min/Avg/Max, resting range, resting trend) · Steps (today, 24h chart, 7-day) · Sleep
  - "Not reported by this device" where there's no data
  - a dev-only "Test data" chip and test buttons
  - no connection or device info here
- **Settings:** Profile row, Alert Thresholds, Notifications, Preferences (text size, units, alert toggle), Development → Previews (dev), Log Out with confirm.
- **Profile:** avatar picker, name/height/weight (units-aware, saved as cm/kg), change email, change password, unsaved-changes guard.
- **Polish done:** IBM Plex Sans, 20pt card/row padding, 16pt card gaps, shared `SectionLabel`, 52/64 row heights, icon size tokens, baseline-aligned number + unit, X-Large text wraps.

### 7.2 Phase 2 progress
| Step | Status |
|---|---|
| A1–A3, A5–A10 Firebase auth, profile, avatar, alert thresholds, JS SDK removed, iOS build fixes | **Code done.** Google sign-in bugs fixed. |
| A4 SHA-1 | **Each developer adds their own** (PL, Tarun, the Android team) |
| A11 live checks (10) | **Not run yet** on any device |
| B0 plan | **Approved by Tarun** (see 7.3) |
| B1 one device, real BLE | **Code done, not tested on a device.** Kevin's original BLE code was confirmed working with LightBlue on Android. |
| B2 several devices at once | **Not started. TOP PRIORITY.** |
| B3 readings saved to Firestore | Not started. Readings are in memory only, so history is lost on restart. |
| B4 real connection log → Devices tab stats | Not started |
| B5 alert engine | Not started (thresholds UI + Firestore exist) |
| B6 background recording | **Deferred** |
| B7 clean-up, C docs | Mostly deferred |

### 7.3 Decisions already made (don't reopen)
- **B0 approved:**
  - keep Kevin's existing Firestore fields, plus the new `reading_batches` collection
  - device ID = platform + the device's own ID
  - **max 4 devices** connected at once
  - the connection log stays on the phone (AsyncStorage) for now
- **Weight range** 20–300 kg (pending team agreement; Kevin's app uses 2–500).
- **Bundle IDs:** iOS `com.galaxies.firebase`, Android `com.dsswearablecool.firebase`.
- **Navigation:** this app's own navigator replaces Kevin's expo-router app. Kevin's committed `android/` folder is not used (Expo regenerates it).

## 8. Firebase (settled)
| | iOS | Android |
|---|---|---|
| Project ID | `wearable-app-f9d83` | `wearable-app-f9d83` |
| Project number | `944450266341` | `944450266341` |
| App ID | `com.galaxies.firebase` | `com.dsswearablecool.firebase` |
| Config file (repo root, never committed) | `GoogleService-Info.plist` | `google-services.json` |

**Firestore documents (shared with Kevin's old app):**
| Document | Fields |
|---|---|
| `users/{uid}` | `name`, `height`, `weight` (strings), `profilePictureUrl`, `autoConnectDevice` (bool) |
| `users/{uid}/private/avatarData` | `imageData` (300×300 JPEG data URI) |
| `users/{uid}/sensor_readings/{type}/readings` | `value`, `unit`, `timestamp`, `deviceId`, `deviceName`, `source` |
| `users/{uid}/devices/{deviceId}` | `deviceId`, `name`, `addedAt`, `lastConnectedAt` (+ optional `platform`, `localName`, `serviceUUIDs`) |
| **New:** `users/{uid}/settings/alerts` | `enabled`, `hrMin`, `hrMax`, `updatedAt` |
| **New:** `users/{uid}/reading_batches/{autoId}` | `deviceId`, `platform`, `type`, `source`, `startAt`, `endAt`, `samples: [{t, v}]` |

**Ask Kevin/Jared** to confirm the Firestore rules allow the two new paths.

## 9. Known issues and facts
- **The handshake must not need a battery service.** Kevin's code reads battery (`0x180F`) before subscribing to heart rate. LightBlue's fake Heart Rate device has no battery, and many real research devices won't either. A missing battery or device-info service must show "Not reported", never disconnect. (Fixed first in `PL_2`.)
- **No screen may spin forever.** Loading must end in data, an empty state or an error within a few seconds.
- **Steps and sleep don't come over BLE.** Only heart rate (`0x2A37`) and battery (`0x2A19`) are read. Steps/sleep come from dev test data until a device's step format is known.
- **iOS BLE rules:**
  - no MAC addresses (use platform + iOS UUID)
  - Android-only workarounds (GATT 133, `requestMTU`, bonding) guarded by `Platform.OS`
  - `Unauthorized` vs `PoweredOff` handled separately
  - pairing is started by the device
- **Fitbit:** only the Charge 6, Fitbit Air and Pixel Watch 2+ share heart rate over BLE, and only when sharing is switched on. The Inspire 3 and older can't.

## 10. Testing
| What | How |
|---|---|
| Firebase (iOS) | iOS Simulator: `npx expo run:ios` |
| BLE (iOS) | **Physical iPhone:** `npx expo run:ios --device`. Set Xcode Signing to PL's Apple ID once. Trust the developer on the iPhone. |
| Android | Tarun or the Android team: `npx expo run:android` (emulator for Firebase, physical phone for BLE) |

**Fake heart-rate devices:**
- **LightBlue** on an iPhone: Virtual Devices → Heart Rate. Keep LightBlue open and the iPhone unlocked.
- Send values in **Hex**, with byte limit ≥ 2: `0046` = 70, `0048` = 72, `005A` = 90, `0064` = 100 (`00` = flags byte, then BPM).
- **Battery** (if a service can be added): `180F`/`2A19`, one byte (`55` = 85%).

**Several devices need several fake devices:** one iPhone can only be **one** fake device, so B2 testing needs **2+ separate phones** running LightBlue (or nRF Connect on Android phones that support its GATT server).

Free Apple ID builds expire after 7 days; rebuild before demos.

## 11. Setup procedure (report each result; stop at the first failure)
1. **Tools:** report `xcodebuild -version`, `pod --version`, `node -v`, `git --version`.
2. **Repo:**
   - `cd ~/DSSWEARABLE/DSS-wearable-App`
   - `git fetch origin`
   - `git checkout ui-changes`
   - `git pull origin ui-changes`
   - report the last 10 commits; they must include the 4-tab UI, the font/polish commits and "Docs: ui-changes handover v2"
   - `git status` must be clean
   - if `ui-changes` doesn't exist on origin, **stop**: Tarun hasn't pushed yet
3. **Remote:** `git remote -v` shows `origin` = KevinCGIA/DSS-wearable-App.
4. **Firebase files** are in the repo root with exact names, from `wearable-app-f9d83`, gitignored and **untracked**.
5. **`.gitignore`** contains `google-services.json`, `GoogleService-Info.plist`, `.env`, `/ios`, `/android`.
6. **Install:** `npm install`, then `npm run typecheck` (clean) and the automated tests (all passing).
7. **Build:** `npx expo prebuild --platform ios --clean`, then `npx expo run:ios` (Simulator). The app opens to sign-in.
8. **Read** `claudephase2charter.md` (latest Progress Log entries) and `PL_2_PHASE2_TASKS.md`. List any differences from section 7.
9. **Report** the checklist below and stop.

## 12. Setup checklist (all must be ✅)
- [ ] Xcode, CocoaPods, Node, Git versions reported
- [ ] In `~/DSSWEARABLE/DSS-wearable-App`, on branch **`ui-changes`**, pulled, working tree clean
- [ ] Last commits include the 4-tab UI, fonts/polish and the v2 handover docs
- [ ] `origin` = KevinCGIA/DSS-wearable-App
- [ ] Both Firebase files present, correct project, untracked; `.gitignore` correct
- [ ] `npm install` OK, typecheck clean, tests passing
- [ ] iOS Simulator build opens to sign-in
- [ ] Differences from section 7 listed (or "none")
- [ ] **Answer in one line each:**
  - Which branch do commits go on?
  - What must you run before starting and before pushing?
  - Which branch must never receive commits?
  - Which files must never be committed?
  - What needs Tarun's approval?
  - Which Firestore fields may change? (Answer: none of the existing ones; only additions.)

If any item is ❌, stop and explain. When all are ✅, tell PL: **"Setup complete. Ready for PL_2_PHASE2_TASKS.md step T0."**
