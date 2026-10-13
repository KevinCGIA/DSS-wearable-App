# DSS Wearables

A mobile app (Android and iOS) that connects to Bluetooth wearables, shows their readings live,
saves them to the cloud and charts the history. Built by Team BRIc for the CSE3CAP capstone, for the
project owner's custom wearable devices.

React Native 0.86 with Expo SDK 57 and TypeScript. Firebase (Auth + Firestore) is the backend.

> **Start here if you are taking the project over:** [HANDOVER.md](HANDOVER.md) says what is built,
> what has been tested on real hardware, and what is left.

## What it does

- **Accounts:** register, email verification, log in (email or Google), reset password, delete account.
- **Devices:** scan, connect and auto-reconnect to up to four Bluetooth LE wearables at once; pair by
  tapping an NFC tag; per-device signal, battery, reliability stats and session history.
- **Readings:** every standard Bluetooth health measurement a device provides: heart rate, heart rate
  variability, energy burned, blood oxygen, body temperature, blood pressure, running speed, cadence,
  stride and distance, weight, BMI, body fat and blood glucose. Only what a device actually reports is
  shown; nothing is estimated.
- **History:** readings are saved to Firestore (with an offline queue on the phone) and charted per
  device. Readings can be exported as a CSV file.
- **Alerts:** local notifications for heart rate outside your thresholds, a wearable that drops and
  can't reconnect, and a low wearable battery.
- **Background recording:** keeps recording while the app is in the background or the phone is locked.

Not built: steps and sleep from a device (see [STEPS_AND_SLEEP_HANDOVER.md](STEPS_AND_SLEEP_HANDOVER.md)),
admin configuration, AI insights, other languages. The full list is in [HANDOVER.md](HANDOVER.md).

## Run it

The app uses native modules (Bluetooth, NFC, Firebase), so it needs a **development build**. Expo Go
does not work.

1. Install Node 22 or newer, then:
   ```bash
   npm install
   ```
2. Put the two Firebase config files in the project root. Ask the team for them; they are ignored by
   git and must **never** be committed: `google-services.json` (Android) and
   `GoogleService-Info.plist` (iOS).
3. Build and run:
   ```bash
   npx expo run:android
   ```
   ```bash
   npx expo run:ios
   ```
   Android needs Android Studio and a phone with USB debugging (emulators have no Bluetooth). iOS needs
   a Mac with Xcode and, for Bluetooth, a real iPhone. The generated `android/` and `ios/` folders are
   ignored by git; never commit them.
4. Google sign-in on Android only works once **your** debug SHA-1 is added to the Firebase project.
   [ANDROID_TESTING.md](ANDROID_TESTING.md) section 1 explains how.

Without a phone you can still see every screen in a browser, on mock data:

```bash
npm run web
```

Choose **Preview the dashboard** on the sign-in screen, then Settings → Previews for every screen in
every state.

## Check it

```bash
npm run typecheck
```
```bash
npm test
```

Both run automatically on every pull request (`.github/workflows/ci.yml`). The tests cover the data
and Bluetooth logic. They do not talk to Firebase or a real device: device testing is manual, with
[ANDROID_TESTING.md](ANDROID_TESTING.md).

## How the code is organised

```
App.tsx, index.ts          entry point: fonts, sign-in state, navigation
src/features/<name>/       one folder per feature
    XScreen.tsx              presentational: props in, no Firebase or Bluetooth
    useXData.ts / XContainer logic and data for that screen
    x.preview.tsx            the screen in every state, on mock data
src/components/ui/         shared building blocks (Card, Button, charts, …)
src/theme/                 design tokens: colours, spacing, type. No literal values in screens
src/navigation/            tabs and the stack of pushed screens
src/lib/ble/               Bluetooth: scanning, per-device connections, reconnects
src/lib/biometrics/        decoders for each Bluetooth health measurement, and the metric list
src/lib/sensors/           the readings store: offline queue, Firestore, what the screens read
src/lib/alerts/            thresholds, alert decisions, local notifications
src/lib/devices/           connection log and per-device statistics
src/lib/export/            CSV export
src/lib/recording/         keeps recording in the background
modules/dss-recording-service/   small native Android service used for background recording
src/data/                  shared types and mock data
tests/                     unit tests (plain Node, no device needed)
```

Files ending `.native.ts` are used on phones; the same name without `.native` is the browser/preview
version. Imports use the `@/` alias for `src/`.

Two rules the whole codebase follows:
- **Screens are presentational.** Logic lives in the hook or container beside them.
- **Firestore changes are additions only.** Never rename, remove or retype a field another build may
  be reading.

## Where the data lives

Everything is under the signed-in user's own document in Firestore:

| Path | What |
|---|---|
| `users/{uid}` | name, height, weight, auto-connect setting |
| `users/{uid}/private/avatarData` | profile picture |
| `users/{uid}/settings/alerts` | heart rate alert thresholds |
| `users/{uid}/devices/{deviceId}` | remembered wearables |
| `users/{uid}/reading_batches/{id}` | readings at full detail, about one document per device, metric and minute |
| `users/{uid}/sensor_readings/{type}/readings/{id}` | one reading per device, metric and minute (the original format) |

The security rules are in `firestore.rules`. They only take effect when
someone deploys them from the Firebase console or CLI.

On the phone, AsyncStorage holds the upload queue, the alert history, the connection log and the
preferences.

## Working on it

- `main` only changes through pull requests. Never force-push.
- Never commit the Firebase config files, `.env`, `android/` or `ios/`.
