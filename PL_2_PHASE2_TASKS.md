# PL Handover 2 of 2: Remaining Phase 2 Tasks (v2)

**Audience:** the AI coding assistant (**OpenAI Codex**) on **PL's Mac**.
**This version replaces yesterday's `PL_2_PHASE2_TASKS.md`.** Work now happens in **Kevin's repo, branch `ui-changes`**.
**Prerequisite:** the Setup Checklist in `PL_1_SETUP_AND_CONTEXT.md` (section 12) is all ✅.
**Goal (deadline mode):** a working app where **several BLE devices are connected at once**, each with live heart rate, saved history and stats, plus alerts, on iOS and Android.

---

## 0. Rules (repeated on purpose)
1. Work only in `~/DSSWEARABLE/DSS-wearable-App` on branch **`ui-changes`**. **Never commit or push to `main`. Never force-push.** Never merge Kevin's old branches into `ui-changes`.
2. **`git pull origin ui-changes` before starting each step and before every push.** Only one person (PL or Tarun) works on `ui-changes` at a time.
3. **Never commit** `google-services.json`, `GoogleService-Info.plist`, `.env`, `/ios` or `/android`.
4. **Don't redesign the UI.** Swap data sources only. A needed UI change gets proposed and waits for Tarun's approval.
5. **Firestore: only additions.** Never rename, remove or retype existing fields. Never change security rules.
6. **Data honesty:**
   - no estimated values
   - test data always labelled "Test data" and never counted in device stats
   - "Not reported" when a device doesn't provide something
7. **`npx expo install`** for packages. After adding a native package, run `npx expo prebuild --clean` before building.
8. Codex rules from `PL_1` section 0.5 apply to every step.

## 1. How each step works (deadline mode)
1. Do the whole step. Commit as you go with clear messages.
2. `npm run typecheck` must be clean and all automated tests must pass. Add tests for new pure logic (parsers, alert rules, stats).
3. Update previews only if a change breaks them.
4. Append a Progress Log entry to `claudephase2charter.md`: step, what changed, files touched, open issues.
5. **⛔ STOP once per step** with a short **click list** naming the device (iOS Simulator, physical iPhone, Android phone).
6. After PL approves, PL runs `git pull origin ui-changes`, then `git push origin ui-changes`.

## 2. Test equipment needed
- **Physical iPhone** running the app (`npx expo run:ios --device`). The Simulator has no Bluetooth.
- **At least 2 other phones as fake heart-rate devices** (LightBlue → Virtual Devices → Heart Rate). One phone = one fake device. Hex values: `0046` = 70, `005A` = 90, `0064` = 100.
- Android testing is done by Tarun / the Android team on their PCs.

---

## T0. Verify state and record decisions (no app code)
- Confirm you're on `ui-changes`, pulled and clean.
- Confirm the Progress Log records the **B0 approval**:
  - Kevin's fields + `reading_batches`
  - device ID = platform + device ID
  - max 4 devices
  - the connection log on the phone (AsyncStorage)
  - weight 20–300 kg pending team agreement
  - B1 committed before approval and reviewed afterwards

  Add it if it's missing.
- List open items:
  - Firestore rules for `settings/alerts` and `reading_batches` (Kevin/Jared to confirm)
  - SHA-1 per developer
  - Daily Insight (JJ)
- Commit: "Phase 2 T0: state check and decisions". ⛔ **STOP.**

## T1. BLE robustness fixes (before any device testing)
1. **Optional services:** after connecting, the handshake continues to the Heart Rate subscription even if Battery (`0x180F`) or Device Information (`0x180A`) is missing or fails to read. Show "Not reported". **Never disconnect or retry because of these.**
2. **No heart-rate service:** stay connected, and show a clear "This device doesn't provide heart rate" state instead of looping or reconnecting.
3. **Heart-rate parser:** handle the flags byte (8-bit and 16-bit, little-endian), and ignore malformed packets without crashing. Add unit tests with sample bytes: `00 46`→70, `00 64`→100, `01 2C 01`→300, empty → ignored.
4. **No endless loading:** every screen that waits on Firestore or BLE must end in data, an empty state or an error within a few seconds. Catch `permission-denied`, missing docs and "no data yet".
- Commit: "BLE: optional services, HR parser tests, no endless loading". ⛔ **STOP.**

## T2. Step A live checks (iOS Simulator, Firebase only)
Walk PL through these one at a time and record each in `BUGS.md` (Pass/Fail):
1. Register → Auth user and `users/{uid}` fields exist in the Firebase console
2. Unverified login blocked → verify → login works
3. Forgot password email
4. Google sign-in, new account → profile created, avatar shows the photo or initials
5. Google sign-in, existing account → profile not overwritten
6. Profile and avatar edits survive a relaunch
7. Change email / change password flows
8. Alert thresholds save to `users/{uid}/settings/alerts` and reload
9. Logout; stays signed in after relaunch when logged in
10. Same account works on Android (Tarun / the Android team)

Fix failures one at a time. Commit fixes. ⛔ **STOP.**

## T3. B1 device test (one device, physical iPhone + LightBlue)
Walk PL through:
- Bluetooth off/on banners; permission denied → Settings button
- scan (heart-rate devices first, ❤ marker, auto-stop at 15 s)
- connect (states) and Cancel
- **live BPM updates** on the Dashboard and Activity when the LightBlue value changes
- Disconnect
- LightBlue device off → reconnecting → on → reconnects
- Forget
- relaunch with auto-connect

Record in `BUGS.md`, fix failures, commit. ⛔ **STOP.**

## T4. B2: several devices at once (TOP PRIORITY)
- Refactor the BLE provider from one connection to a **per-device connection map (max 4)**. Each device has its own:
  - connect (3 attempts) and Cancel
  - handshake (T1 rules)
  - heart-rate subscription
  - optional battery read
  - reconnect timer and state
- Connecting a second device **never disconnects** the first. Disconnect and Forget affect only that device.
- Every reading is tagged with its `deviceId` (and `deviceName`, `source`).
- Auto-connect reconnects **all** remembered devices (up to 4) after relaunch.
- At the limit: a clear message; never connect a 5th.
- The existing UI shows each device separately, **with no layout changes**:
  - Devices tab "Connected now" cards
  - Dashboard device ring ("<n> devices connected") and expanded rows
  - Activity chips (one per device, each with its own data)
- Android-only workarounds stay guarded by `Platform.OS`. iOS uses platform + iOS UUID as the device key.
- **Click list (2+ LightBlue phones):**
  - connect both
  - change one device's value → **only that device's** BPM changes
  - disconnect one → the other keeps streaming
  - Forget one
  - relaunch → both auto-connect
  - try a 5th device → the limit message
- Commit: "Phase 2 B2: multi-device BLE". ⛔ **STOP.**

## T5. B3: save readings per device to Firestore
- Keep writing **Kevin-compatible** docs to `users/{uid}/sensor_readings/{type}/readings` (`value`, `unit`, `timestamp`, `deviceId`, `deviceName`, `source`) at Kevin's rate (about 1 per 60 s per device).
- **Also** write full-resolution data to `users/{uid}/reading_batches/{autoId}`: `{ deviceId, platform, type: 'heart_rate', source: 'ble'|'test', startAt, endAt, samples: [{t, v}] }`, one batch per device flushed every 60 s or on disconnect/background. One write per device per minute, never one per sample.
- The Activity tab (per-device chips), Dashboard charts and history read from Firestore, so **history survives an app restart**. Firestore's offline cache queues writes when there's no internet.
- Test data writes `source: 'test'` and stays out of device stats.
- If Firestore rules block the new path, **stop and report**. Don't change rules.
- **Click list:**
  - 2 devices streaming → batches appear per device in the console
  - Kevin-format docs still written
  - kill and relaunch → charts still show history
  - airplane mode → readings continue → sync when back online
- Commit: "Phase 2 B3: readings saved per device". ⛔ **STOP.**

## T6. B4: real connection log → Devices tab stats
- The real provider writes per-device events to the persisted connection log (AsyncStorage, bounded size):
  - connect attempt, connected, disconnected (`user` | `unexpected`), failed
  - app background/foreground
- Also record RSSI (poll about every 10 s while connected) and battery (or "Not reported").
- The Devices tab cards, summary strip, badges (Stable/Unstable/Not responding, thresholds in one constants file) and Device Detail session history use real data.
- Background/closed time never counts as gaps or drop-outs.
- **Click list:**
  - stats update live for each device
  - a walk-away drop counts as unexpected
  - Disconnect counts as user
  - kill and relaunch → history kept
- Commit: "Phase 2 B4: real device stats". ⛔ **STOP.**

## T7. B5: alert engine
- `npx expo install expo-notifications`.
- A pure `checkHeartRate(reading, thresholds)` with a **60 s cooldown per device and alert type**.
- Thresholds come from `users/{uid}/settings/alerts`. Respect `enabled` and the Preferences alert toggle.
- Request notification permission (iOS, and Android 13+ `POST_NOTIFICATIONS`).
- Alerts are saved for the Notifications screen, showing which device. Test data only alerts in `__DEV__`.
- **Click list:**
  - set Max below the live BPM → one notification, then none for 60 s
  - it appears in Notifications with the device name
  - toggle off → none
- Commit: "Phase 2 B5: alerts". ⛔ **STOP.**

## T8. Wrap-up
- Update `ANDROID_TESTING.md` (multi-device, saved history and alerts are now testable) and `BUGS.md`.
- Progress Log: what's done, what's deferred (B6 background recording, B7 clean-up), known limitations (foreground-only recording; steps/sleep not from BLE).
- Final checks:
  - typecheck clean, tests pass
  - no secrets tracked
  - `main` untouched
  - all work on `ui-changes`
- PL pushes. Tell PL: **"Phase 2 core complete. Ready for the team's pull request ui-changes → main once Android testing passes."** Never open or merge that pull request yourself.

---

## Deferred (don't build now)
- **B6** background recording (iOS `bluetooth-central` + state restoration; Android foreground service)
- **B7** full clean-up and the full C docs
- **Daily Insight Summary** (JJ)
- Steps/sleep over BLE (needs the device's data format from the researchers)
- Any UI redesign
