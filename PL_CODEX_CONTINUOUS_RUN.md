# Codex Continuous Run: Setup + Phase 2

**For:** Praneet (PL), using Codex on his Mac.
**Use:** open a **new Codex chat**, started inside `~/DSSWEARABLE/DSS-wearable-App`, and paste the prompt below as the **first message**.

## Before you paste
- [ ] On branch `ui-changes` (`git status` says "up to date with origin/ui-changes", working tree clean)
- [ ] `google-services.json` and `GoogleService-Info.plist` are in the repo root, from `wearable-app-f9d83`, not tracked by git
- [ ] You have write access to Kevin's repo (otherwise the pushes fail with 403)
- [ ] For the test session at the end: your iPhone running the app + **2 other phones** with LightBlue (Virtual Devices → Heart Rate)

## The prompt

```
The rules have changed: work now happens in Kevin's repo on branch ui-changes. Forget yesterday's handover files. Read AGENTS.md, PL_1_SETUP_AND_CONTEXT.md (v2), PL_2_PHASE2_TASKS.md (v2) and the latest Progress Log entries in claudephase2charter.md, and obey PL_1 section 0 at all times.

RUN MODE: continuous. Don't stop between steps. Work through everything below in order, and only stop when it is NECESSARY:
- a setup checklist item fails and you can't fix it safely
- typecheck or tests fail and you can't fix them after reasonable attempts
- a task would break a rule (pushing to main, force-push, committing Firebase files/.env/ios/android, changing Firestore rules or console settings, merging Kevin's old branches, any destructive git command)
- a UI layout/design change seems necessary (propose it and wait for Tarun's approval)
- Firestore permission-denied on a new path (report it; Kevin/Jared must update the rules)
- something only I can do (adding my SHA-1 in Firebase, physical phone testing)
- anything ambiguous where guessing could lose work or data
Otherwise keep going. Don't stop for click lists or approvals between steps.

AFTER EACH COMPLETED STEP (no stopping):
- npm run typecheck clean and all automated tests passing (add tests for new pure logic)
- confirm git status shows no Firebase files/.env/ios/android staged
- commit with a clear message
- append a short Progress Log entry to claudephase2charter.md
- git pull origin ui-changes, then git push origin ui-changes (never main, never --force)
- write that step's click list into a TESTING_SESSION.md file instead of stopping

ORDER:
1. PL_1 section 11 setup. Stop only if a checklist item is ❌ and can't be fixed. Otherwise note the results in the Progress Log and continue.
2. PL_2 T0 (state check and decisions).
3. PL_2 T1 (optional battery/device-info services, HR parser tests, no endless loading).
4. PL_2 T4 / B2 (several devices at once, max 4). This is the top priority.
5. PL_2 T5 / B3 (readings saved per device to Firestore).
6. PL_2 T6 / B4 (real connection log → Devices tab stats).
7. PL_2 T7 / B5 (alert engine), including the Android 13+ POST_NOTIFICATIONS permission.
8. Build on the iOS Simulator (npx expo run:ios) to confirm the app opens and signs in.
9. STOP (necessary: device testing). Give me ONE combined test session from TESTING_SESSION.md, in this order:
   - T2 Step A live checks (Simulator)
   - T3 one-device test
   - T4 multi-device test (my iPhone running the app + 2 phones with LightBlue)
   - T5 saved readings
   - T6 device stats
   - T7 alerts
   I'll report results, and you'll fix failures in one pass, then do T8 wrap-up.

ANDROID: I can't build or test Android on this Mac. Keep all existing Android code and permissions working (Bluetooth permissions, Platform.OS === 'android' paths such as GATT 133 retries and requestMTU, the Android 13+ notification permission). Skip Android builds, Android testing and my Android SHA-1. The Android team tests Android.

Skip (deferred, done later): B6 background recording and B7 full clean-up. Never open or merge a pull request to main.
```

## While it runs
- **Codex asks before running terminal commands.** Approve them as they pop up.
- **It will take hours.** Leave it running.
- **Tell Tarun you're working on `ui-changes`,** so nobody else edits it at the same time.

## Running it overnight
1. **Start in the evening and stay for the first 30–60 minutes.** Setup runs the commands that need internet (`npm install`, `pod install`, the first Simulator build, the first push). Approve them while you're awake.
2. **While you're away, Codex pauses at any command that needs your approval** and waits until you're back. Nothing is lost; it continues once you approve.

**In the morning:**
1. Read the latest **Progress Log** entries in `claudephase2charter.md` to see how far it got.
2. If it's waiting on a command, check it and approve it. If it stopped early, read why; it only stops for real problems.
3. Push anything not yet pushed:
   ```bash
   git pull origin ui-changes
   git push origin ui-changes
   ```
4. If it reached step 9, **do the combined test session** with your iPhone + 2 LightBlue phones.
5. If it ran out of usage partway, use the prompt below in a new chat.

## If you run out of usage or start a new chat
Open a new Codex chat in the same folder and paste:

```
Re-read AGENTS.md, PL_1_SETUP_AND_CONTEXT.md, PL_2_PHASE2_TASKS.md, PL_CODEX_CONTINUOUS_RUN.md and the latest Progress Log entry in claudephase2charter.md. Run git pull origin ui-changes. Tell me which step we stopped at, then continue in the same continuous run mode from there.
```

## Fake heart-rate values in LightBlue (Hex, byte limit 2+)
| BPM | Type |
|---|---|
| 60 | `003C` |
| 70 | `0046` |
| 90 | `005A` |
| 100 | `0064` |
| 120 | `0078` |

Edit the **Heart Rate Measurement** value, not the User Description. Keep LightBlue open and the phone unlocked.

## Round 2 (later, after this run is tested and fixed)
**B6: background recording.** Build it in a separate run once round 1 is done.
- **iOS:** `react-native-ble-plx` background mode (`bluetooth-central`), state restoration, pending-connection reconnects, background scans filtered by the Heart Rate service.
- **Android:** a foreground service with a "Recording from n devices" notification, its permissions, and battery-optimisation handling (the Android team tests it).
- **Test with LightBlue:** the app phone locked for 5–10 minutes with 2 LightBlue phones (kept open and unlocked, values changed by hand), checking that:
  - readings keep saving to Firestore
  - an alert fires on the lock screen
  - switching a LightBlue device off and on reconnects while locked
