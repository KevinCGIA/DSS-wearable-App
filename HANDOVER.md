# DSS Wearables: handover

Written 13 October 2026, for whoever continues this project after Team BRIc. It says what the app
does today, how much of that has been proven on real hardware, and what to do next.

For setup and the code layout, see [README.md](README.md).

## 1. Status at a glance

"Checked on a phone" means a person used it on a real phone with a real or simulated Bluetooth
device. "Emulator" means it ran on the Android emulator, which has no Bluetooth. "Tests only" means
automated tests pass but nobody has tried it on hardware.

| Area | Built | How far it has been checked |
|---|---|---|
| Register, log in, Google sign-in, reset password | Yes | Emulator (email log in). The full checklist in `ANDROID_TESTING.md` section 4 has not been recorded as run. |
| Scan, connect, reconnect, forget | Yes | Checked on an Android phone with a simulated heart rate device. |
| Live heart rate | Yes | Checked on an Android phone. |
| Other vitals (SpO₂, temperature, blood pressure, running, weight, body fat, glucose, HRV, energy) | Yes | Tests only. Screens checked with sample data. |
| Several devices at once (up to 4) | Yes | Tests only. |
| Saving to the cloud, offline queue, history charts | Yes | Emulator, with sample data, against the real Firebase project. |
| Device statistics and session history | Yes | Tests only. |
| Heart rate alerts | Yes | Tests only. |
| Device alerts (connection lost, low battery) | Yes | Tests only. |
| Background recording, Android | Yes | Emulator: the service starts, shows its notification and keeps the app running in the background. Not tried with a wearable. |
| Background recording, iOS | Configuration only | Not tried. Needs a Mac build and an iPhone. |
| CSV export | Yes | Emulator: file written and the share sheet opened. |
| Delete account | Yes | Tests only, plus the confirmation prompt on the emulator. Never run to the end. |
| NFC tap-to-pair | Yes | Never tried with a real tag. |
| iOS in general | Yes | Launches in the iOS Simulator. No Bluetooth test on an iPhone is recorded. |
| Steps and sleep from a device | No | See `STEPS_AND_SLEEP_HANDOVER.md`. |

## 2. Do these before anyone relies on the app

1. **Check and deploy the Firestore security rules.** The rules in the `firestore.rules` pull request
   are a proposal. Nobody on the team could see which rules are live. Open the Firebase console →
   Firestore Database → Rules, compare, and deploy. Until then, assume user data is only as safe as
   whatever is live.
2. **Test with the real wearable.** Everything beyond heart rate has only met automated tests and
   sample data. Start with section 6 of `ANDROID_TESTING.md`.
3. **Test on an iPhone**, including with the phone locked for ten minutes while a wearable streams.
4. **Run account deletion once with a throwaway account** and confirm in the Firebase console that
   the user's documents and the account are gone.
5. **Decide the Firebase plan.** See "Data volume" below. The free plan is enough for demos, not for
   continuous recording.
6. **Merge.** `main` still holds the old Android-only app. The unified app is on `ui-changes`, and the
   newest work is in open pull requests on top of it.

## 3. Connecting the project owner's wearable

- **If it uses standard Bluetooth health services** (heart rate, pulse oximeter, health thermometer,
  blood pressure, running speed and cadence, weight scale, body composition, glucose), it should work
  without code changes. Its card in the Devices tab lists what it measures.
- **If it uses its own (custom) service**, three small additions are needed. They are the same three
  described for steps in `STEPS_AND_SLEEP_HANDOVER.md`:
  1. a decoder in `src/lib/biometrics/decoders.ts` (bytes in, values out),
  2. the service in `src/lib/biometrics/metrics.ts`,
  3. a subscription in `startHealthMonitors` in `src/lib/ble/BleService.native.ts`.

  Saving, charts, export and alerts then work for it without further changes. A metric that isn't in
  the list yet also needs an entry in `METRICS` (label, icon, unit, and whether it is a live stream, an
  occasional measurement or a running total).
- **Popular consumer watches** (Galaxy Watch, Apple Watch, Fitbit) do not share their data over
  standard Bluetooth services, so the app cannot read them. That was accepted as out of scope: the app
  is built for the project owner's device.

## 4. Known limits

### Data volume
- Each connected device writes about **2 documents per minute per metric** (one at full detail, one in
  the original format): about 2,900 a day for one heart rate stream. A device sending four metrics
  writes about 11,500 a day.
- At the time of writing, Firestore's free plan allows 20,000 writes and 50,000 reads a day for the
  whole project. That is roughly seven heart-rate-device-days of recording per day. Use the paid plan
  for studies; at this scale it costs cents per device per day.
- The app loads the last **8 days**. Within that it shows at most 2,000 full-detail documents (about
  33 hours of one metric from one device) and falls back to the per-minute format for older data, up
  to 10,000 documents per metric. Past those limits the Activity tab shows a note ("Showing your most
  recent readings…") and keeps working. Nothing is lost: everything stays in Firestore and in exports.
- **Not solved:** a month view. It needs a small summary document per device, metric and day
  (minimum, average, maximum, last value), written by the app or a Cloud Function, so that history
  screens read a few dozen documents instead of thousands. That is the recommended next piece of
  data work.

### Background recording
- **Android:** while a wearable is connected, a foreground service shows a "Recording from N
  wearables" notification and keeps the app running. It holds the phone awake, so battery use is
  higher: charge the phone for long sessions. Some phone makers add their own battery savers that can
  still stop apps; if recording stops overnight on a particular phone, exempt the app from battery
  optimisation in the phone's settings.
- **iOS:** the app declares the Bluetooth background mode, so iOS keeps delivering readings from
  connected devices. It does not yet restore itself if iOS removes the app from memory.
- **Both:** swiping the app away from the recent apps screen stops recording until it is opened again.
- Alerts only fire while the app is running (foreground or background recording), because they are
  decided on the phone.

### Security and privacy
- Data in transit and in Firestore is encrypted by Google. The upload queue, alert history and
  connection log on the phone are stored unencrypted in the app's private storage, protected by the
  phone's own storage encryption.
- **Delete account** removes the user's Firestore documents and then the account. Firebase only allows
  that shortly after signing in, so the app asks the user to log out and in again first if needed.
- New passwords need 8 characters with a letter and a number. Log-in errors do not reveal whether an
  email is registered.
- There are no roles. Every signed-in user sees only their own data.

### Other
- Four devices at once, by design.
- History ranges are fixed: 24 hours for live metrics, 7 days for steps and occasional measurements.
- Alert thresholds exist for heart rate only.
- Portrait, phone-sized screens only. English only. Light theme only.
- iOS NFC needs the NFC capability, which requires a paid Apple Developer account.
- On a very slow start the profile can still show a "couldn't load" message (each load gives up after
  eight seconds and is tried twice); Retry fixes it.

## 5. In the brief but not built

| Item from the brief | State |
|---|---|
| Steps and sleep from a device | Not built. The device's data format is needed. `STEPS_AND_SLEEP_HANDOVER.md`. |
| Admin can configure the data plot per device type | Not built. Needs admin accounts, which need a server-side piece (Firebase custom claims or a Cloud Function) that does not exist. |
| Configure device settings | Not built. Depends on what the wearable lets an app change. |
| Customisable dashboard | Not built. The Dashboard already hides anything a device doesn't report. |
| Integration with health platforms | Not built. |
| AI insights and recommendations | Not built. |
| Other languages | Not built. Text is written inline in the screens, so this needs a translation layer first. |
| Firmware development | Not part of this repository. |
| NFC data transfer | Only pairing by NFC tag is built. Reading sensor data over NFC is not. |

## 6. Suggested order of work

1. Section 2 above (rules, real-device tests, plan, merge).
2. The custom wearable's data format, including steps and sleep.
3. Daily summary documents, then week and month views.
4. Alert thresholds for other vitals (low SpO₂, high temperature).
5. iOS state restoration, so recording resumes after iOS removes the app from memory.
6. Admin roles and per-device plot configuration.

## 7. Where things are written down

| Document | What it is |
|---|---|
| `README.md` | Setup, code layout, data paths |
| `ANDROID_TESTING.md` | Step-by-step manual tests, including fake Bluetooth devices |
| `STEPS_AND_SLEEP_HANDOVER.md` | Why steps and sleep aren't built and exactly where to add them |
| `BUGS.md` | Where testers record results |
| `TESTING_SESSION.md` | The team's test checklist from Phase 2 (historical) |
