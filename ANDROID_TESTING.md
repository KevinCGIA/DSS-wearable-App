# Android testing: unified DSS app

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

## 6. Biometrics checks (branch `feature/biometrics` until it is merged)
The app now collects every standard Bluetooth health measurement a device provides, and only shows what a device actually reports. To test before the merge, use `git checkout feature/biometrics` in section 1.

### 6a. Screens only (no second phone, 2 minutes)
Activity tab → Development card → **Add 24h of Sample Data**. This adds a day of every measurement as **Test data**.

Two things that look like bugs but aren't:
- **Give it time to load.** After opening the app, saved readings take a few seconds to arrive (longer on an emulator). Until then the Dashboard shows a spinner and **"--"**, and Activity shows "Loading your data…". Check the numbers after they settle.
- **Sample sleep is not saved.** The sample night disappears when the app restarts (tap Add 24h of Sample Data again to bring it back). Everything else is saved.

- [ ] **Activity:** a **Test data** chip is selected. Heart Rate, Steps and Sleep are filled. Below Sleep, **More vitals** has a card each for Heart Rate Variability, Blood Oxygen, Blood Pressure (as "120/80"), Body Temperature, Blood Glucose, Weight, BMI, Body Fat, Energy Burned and Distance.
- [ ] **Dashboard:** Steps, Distance and Active Calories show numbers (Floors stays "--"). A **Vitals** card appears at the bottom; tap it to expand; **Open in Activity ›** opens the Activity tab at More vitals.
- [ ] **Units:** Settings → Preferences → Imperial. Temperature shows °F, weight lb, glucose mg/dL, distance mi. Switch back to Metric.
- [ ] **Steps:** **Add Test Steps** raises today's steps on both Dashboard and Activity.
- [ ] Repeat the Activity and Dashboard checks at **X-Large** text: nothing is cut off or overlapping.

### 6b. Fake health devices (second phone)
Same idea as section 2: a second phone pretends to be the device. LightBlue has ready-made virtual devices for some of these; for the rest use **nRF Connect** (Configure GATT server → add the service and characteristic by their IDs, then advertise). Type the value in **Hex**. The team has not tried every one of these on a real phone yet, so record what works.

After connecting, each device's card in the **Devices** tab should list what it measures (e.g. "Temp", "BP") in a row of pills, and the value should appear in **Activity → that device's chip → More vitals**.

| # | Pretend to be | Service | Characteristic | Hex value to send | Expected in the app |
|---|---|---|---|---|---|
| 1 | Thermometer | `1809` | `2A1C` (indicate) | `006E0100FF` | Body Temperature **36.6 °C** |
| 2 | Blood pressure cuff | `1810` | `2A35` (indicate) | `00780050005D00` | Blood Pressure **120/80 mmHg** |
| 3 | Pulse oximeter | `1822` | `2A5F` (notify) | `0062004800` | Blood Oxygen **98 %**, and Heart Rate **72** |
| 4 | Weight scale | `181D` | `2A9D` (indicate) | `08A438ED00D606` | Weight **72.5 kg**, BMI **23.7** |
| 5 | Body composition scale | `181B` | `2A9C` (indicate) | `1004D5009501A438` | Body Fat **21.3 %**, Weight **72.5 kg** |
| 6 | Running sensor | `1814` | `2A53` (notify) | `030003AA690040E20100` | Speed **10.8 km/h**, Cadence **170 spm**, Stride **1.05 m** |
| 7 | Running sensor, distance | same | same | then `030003AA690028E60100` | Distance today **0.10 km** (the total went up by 100 m) |
| 8 | Heart rate with energy | `180D` | `2A37` (notify) | `08486400` → `0848C800` | Heart Rate **72**. Energy Burned today **24 kcal** after the second value (it counts the increase between the two) |
| 9 | Heart rate with beat timing | `180D` | `2A37` (notify) | alternate `10480004` and `10483303` every few seconds for about a minute | A **Heart Rate Variability** card appears (calculated over 30 seconds, so it needs several values) |

Also check:
- [ ] A measurement taken once (temperature, blood pressure, weight) shows "Measured x ago" and joins a **Recent readings** list after a second value.
- [ ] Two fake devices connected together each get their own chip in Activity with only their own measurements.
- [ ] Firebase console: new readings appear under `users/{uid}/reading_batches` with `type` such as `body_temperature`, `bp_systolic`, `spo2`.
- [ ] A broken value (e.g. `00`) is ignored: no crash and no new reading.

### 6c. Cannot be faked
- **Blood glucose:** the app asks the meter for its stored readings, which the phone apps cannot answer. Needs a real Bluetooth glucose meter.
- **Steps and sleep from a device:** not built (see below). The screens can only be checked with Test data (6a).

### 6d. Not built yet: don't report these as bugs
- **Steps and sleep over Bluetooth.** A steps/sleep monitor (service `183E`) connects and shows "Steps & sleep (not supported yet)" on its Devices card. Why, and how to add it: `STEPS_AND_SLEEP_HANDOVER.md`.
- **Floors:** no Bluetooth device reports it, so it always shows "--".
- Recording in the background or with the screen locked.

## 7. Background recording, alerts, export and account checks (branch `feature/hardening`)
These need a new build (`npx expo run:android`), because a small native service was added.

### 7a. Background recording (physical phone + a fake heart-rate device from section 2)
| # | Steps | Expected |
|---|---|---|
| 1 | Connect the fake heart-rate device. | Android asks to allow notifications (first time only). A **"Recording from 1 wearable"** notification appears and stays. |
| 2 | Press Home, wait 3 minutes while changing the BPM on the other phone a few times, then open the app. | The Heart Rate chart in Activity has no gap for those 3 minutes. Firebase console: `reading_batches` has documents for each minute. |
| 3 | Lock the phone for 10 minutes with the device still sending, then unlock. | Same: no gap. |
| 4 | With the app in the background, set the BPM above your Maximum threshold. | A "High heart rate" notification arrives while the app is still in the background. |
| 5 | Tap the Recording notification. | The app opens. |
| 6 | Disconnect the device in the app. | The Recording notification disappears within a few seconds. |
| 7 | Connect again, then swipe the app away from the recent apps screen. | Recording stops (expected). Reopen: the time the app was closed is not counted as a drop-out in that device's stats. |
| 8 | Optional, overnight: record with the phone charging. Note the phone model. | Recording continues all night. If it stops, note the time and model in `BUGS.md` (some phones need the app exempted from battery optimisation). |

### 7b. Device alerts
| # | Steps | Expected |
|---|---|---|
| 1 | With a device connected, turn the fake device off (or walk it out of range) and leave it off. | After the app gives up reconnecting (about 30 seconds), a **"Wearable disconnected"** notification, and the same alert in Settings → Notifications. |
| 2 | Turn it off and back on within a few seconds. | It reconnects by itself and **no** alert is raised. |
| 3 | Tap Disconnect yourself. | No alert. |
| 4 | If your fake device has a Battery service: set it to `14` (hex, = 20 %) or lower, then connect. | A **"Wearable battery low"** alert, once per connection. |
| 5 | Settings → Preferences → turn Alert notifications off, then repeat 1. | No notification and no new alert. |

### 7c. Export
| # | Steps | Expected |
|---|---|---|
| 1 | Settings → Export Data → 24 hours → Export CSV, after recording or adding sample data. | The phone's share sheet opens with a file named `dss-readings-<date>-<time>.csv`. The screen then says "Exported N readings." |
| 2 | Send the file to yourself and open it in a spreadsheet. | Columns: `time_utc, time_local, metric, type, value, unit, device, device_id, source`. One row per reading, oldest first. Test data rows say "Test data" and `test`. |
| 3 | Choose a range with nothing saved. | "No readings were saved in …" and no share sheet. |
| 4 | Turn on Airplane mode and export. | An error message; no crash. |

### 7d. Account and sign-in
| # | Steps | Expected |
|---|---|---|
| 1 | Register with the password `abc123`, then `abcdefgh`, then `abc12345`. | The first two are refused ("at least 8 characters", "a letter and a number"); the third is accepted. |
| 2 | Log in with a wrong password, then with an email that isn't registered. | The **same** message both times ("That email and password don't match"). |
| 3 | **Use a throwaway account.** Profile → Delete Account → Cancel. | Nothing happens. |
| 4 | Same account, signed in more than 5 minutes ago: Delete Account → Delete Account. | "Your account was not deleted… log out, log in again, then try this within a few minutes." Nothing is deleted. |
| 5 | Log out, log in, then Delete Account → Delete Account straight away. | The app returns to the sign-in screen. Firebase console: the user is gone from Authentication, and `users/{uid}` and everything under it is gone from Firestore. Logging in again fails. |

### 7e. Loading and long recordings
- [ ] Open the app from closed: while saved readings load, the Dashboard shows a spinner in Heart Rate and **"--"** for Steps (not 0), and Activity shows "Loading your data…". Numbers appear within a few seconds.
- [ ] After recording one device for more than a day and a half, Activity may show a blue note: "Showing your most recent readings. Older readings are saved…". The charts must still show data. This is expected, not an error.

## 8. How to report
1. Create a branch from `ui-changes` called `android-testing` (or `android-testing-<your name>`).
2. Add rows to the bug table in `BUGS.md`: **Screen | Bug | Steps | Platform/device | Tester | Status**, plus Pass/Fail for the A11 and B1 checks.
3. Push your branch and open a **pull request into `ui-changes`**.

**Never push to `main` or straight to `ui-changes`.**
