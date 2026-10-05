# Android testing: unified DSS app (branch `ui-changes`)

For anyone testing the app on Android. Test on a **physical Android phone**: the emulator has no Bluetooth.

## 1. Setup
1. Clone Kevin's repo and switch to the branch:
   ```
   git clone https://github.com/KevinCGIA/DSS-wearable-App.git
   cd DSS-wearable-App
   git checkout ui-changes
   git pull origin ui-changes
   npm install
   ```
2. Put **both** Firebase files in the repo root (ask the team; **never commit them**): `google-services.json` and `GoogleService-Info.plist`.
3. Add **your own debug SHA-1** to the Android app in Firebase project **`wearable-app-f9d83`** (Project settings → Your apps → Android → Add fingerprint). Without it, Google sign-in fails on your machine. Get it with:
   ```
   cd android && ./gradlew signingReport
   ```
   (Run `npx expo prebuild --platform android` first if there's no `android/` folder. Never commit `android/`.)
4. Plug in the phone (USB debugging on) and run:
   ```
   npx expo run:android
   ```

## 2. Fake heart-rate device (LightBlue)
Use **LightBlue** on an iPhone as the wearable:
1. LightBlue → **Virtual Devices** → **+** → **Heart Rate**. Keep it on and the iPhone screen awake.
2. Open the Heart Rate Measurement characteristic and set the value in **Hex**. The first byte is the flags (`00`), the second is the BPM:
   - `0046` = 70 BPM
   - `005A` = 90 BPM
   - `0064` = 100 BPM
3. In the app: Devices → Add device → Scan for Devices → connect to the LightBlue device. Changing the hex value should change the BPM in the app within a few seconds.

## 3. UI checklist
Check each item at the **Default** text size, then again at **X-Large** (Settings → Preferences → Text size) on a small phone. Nothing should be cut off, overlap, or be unreachable.

- [ ] **Tabs:** 4 tabs in this order: Dashboard (opens first after sign-in) | Devices | Activity | Settings. Standard tab bar, no raised button.
- [ ] **Dashboard, collapsed:** greeting with your first name and the date, "?" help, avatar → Profile; Heart Rate, Device & Today's Activity, Sleep & Recovery, Active Calories cards. Distance, Floors and Calories show "--".
- [ ] **Dashboard, expanded:** tap each card (or its chevron) to expand it.
  - **"Open in Activity ›"** opens the Activity tab at the matching section: Heart Rate → Heart Rate; Today's Activity and Calories → Steps; Sleep → Sleep.
  - The device ring and **"Devices ›"** open the Devices tab.
- [ ] **Activity:** device chips under the header (names only; most recent data first). Switching chips switches the data.
  - Heart Rate: BPM + "Updated x ago" (grey after 10 min), resting range, 24 h chart with Min/Avg/Max, resting trend.
  - Steps: today, steps per hour, 7-day chart. Sleep: last night and trends.
  - A section a device doesn't report shows **"Not reported by this device."**
  - **No** signal, battery or connection status on this tab.
  - Dev builds: the Development card (Add Test Reading, Add 24h of Sample Data, Add Test Steps) adds a **Test data** chip.
- [ ] **Devices tab:** summary strip, Add device, "Connected now" and "Previously connected" cards with stats and a Stable / Unstable / Not responding badge, Disconnect / Connect / Forget.
- [ ] **Device Detail:** tap a device card → reliability, data quality, session history; ‹ goes back.
- [ ] **Settings:** Profile row, Alert Thresholds, Notifications, Preferences, Log Out (asks to confirm).
- [ ] **Profile:** change photo, name, height, weight (Save), Change Email, Change Password.
- [ ] **Alert Thresholds:** on/off, Minimum/Maximum steppers, Save.
- [ ] **Notifications:** alerts grouped by day, or "No alerts yet".
- [ ] **Preferences:** text size (Default / Large / X-Large applies app-wide) and units (Metric / Imperial changes height, weight and distance).
- [ ] **Unsaved changes:** edit Profile or Alert Thresholds, then press **Android back** (or switch tab) → "Discard changes?" with Keep editing / Discard.
- [ ] **Android back:** closes pushed pages first, then returns to Dashboard, then leaves the app.

## 4. Step A11 checks (Firebase, 10)
Use a test email you can open. Record each as Pass/Fail in `BUGS.md`.

| # | Steps | Expected |
|---|---|---|
| 1 | Register with name, email, password, height, weight (and a photo). | "Verification email sent". Firebase console: the Auth user exists; `users/{uid}` has `name`, `height`, `weight` as strings; the photo is in `users/{uid}/private/avatarData`. |
| 2 | Log in before verifying. Then open the email link and log in again. | First try: "Please verify your email" and you stay signed out. After verifying: Dashboard opens. |
| 3 | Log in screen → Forgot password? → enter the email. | "Reset email sent"; the email arrives. |
| 4 | Google sign-in with a Google account never used in the app. | Signed in; Dashboard greets the Google first name; avatar shows the Google photo or initials; `users/{uid}` created. |
| 5 | Set a name/height in Profile, log out, sign in with the same Google account again (Log in **and** Register buttons). | Profile unchanged (name, height, weight, auto-connect kept). |
| 6 | Profile: change name, height, weight and photo → Save. Kill and reopen the app. | All changes still there; Dashboard greeting uses the new first name. |
| 7 | Profile → Change Email (new address), then Change Password. | Verification email to the new address; password-reset email to the account email. |
| 8 | Settings → Alert Thresholds: change min/max → Save. Kill and reopen. | Values kept; `users/{uid}/settings/alerts` has `enabled`, `hrMin`, `hrMax`, `updatedAt`. |
| 9 | Kill and reopen while signed in. Then Settings → Log Out → confirm. | Stays signed in after relaunch; Log Out returns to sign-in. |
| 10 | Sign in with the same account in Kevin's old Android app (if available). | Same name, height, weight and photo. |

## 5. Step B1 checks (Bluetooth, one device, 6)
Use LightBlue (section 2) and a physical phone.

| # | Steps | Expected |
|---|---|---|
| 1 | Build with `npx expo run:android`. | The app installs and opens to sign-in; Android asks for Bluetooth (Nearby devices) permission when you first scan. |
| 2 | Deny the Bluetooth permission and open Devices → Add device. Then turn Bluetooth off, then on. | Denied: a banner with a **Settings** button. Off: "Bluetooth is turned off" banner. On: the banner clears. |
| 3 | Add device → Scan for Devices. | Devices appear sorted by signal; heart-rate devices have a ❤; scanning stops by itself after 15 s; Stop Scanning works. |
| 4 | Connect to LightBlue; Cancel during connecting once; connect again; Disconnect; then connect and turn the LightBlue device off and on. | States: Connecting (attempt n) → Setting up → Connected. Cancel stops it. Device off → Reconnecting → Connected again when it's back. |
| 5 | While connected, change the LightBlue hex value (`0046` → `005A` → `0064`). | Dashboard Heart Rate and Activity (that device's chip) show 70 → 90 → 100 within a few seconds. |
| 6 | Check Firebase console after connecting. Then Forget the device. Then relaunch with Auto-connect on, and again with it off. | `users/{uid}/devices/{deviceId}` appears after connecting and goes away after Forget. Auto-connect on: reconnects on launch; off: doesn't. |

## 6. Not built yet: don't report these as bugs
- Several devices connected at the same time
- Saved history (readings are live only for now; restarting the app clears them)
- Real device stats and badges in the Devices tab (they show seeded or test history)
- Heart-rate alerts and phone notifications
- Recording in the background or with the screen locked

## 7. How to report
1. Create a branch from `ui-changes` called `android-testing` (or `android-testing-<your name>`).
2. Add rows to the bug table in `BUGS.md`: **Screen | Bug | Steps | Platform/device | Tester | Status**, plus Pass/Fail for the A11 and B1 checks.
3. Push your branch and open a **pull request into `ui-changes`**.

**Never push to `main` or straight to `ui-changes`.**
