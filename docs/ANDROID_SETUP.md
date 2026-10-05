# Running the Android app on a phone

Two ways to get the app onto an Android phone over USB:

- **Option A — Install the APK.** Quickest. No developer tools needed. You get a fixed
  build of the app; code changes need a new APK.
- **Option B — Run from source.** For developing. Code changes appear on the phone as
  you save.

Bluetooth features (scanning, connecting to wearables) only work on a real phone, not the
emulator.

---

## Option A: Install the APK

Ask Kevin for the latest `DSS-Wearable-*.apk`.

1. Connect the phone to the computer with a USB-C cable.
2. On the phone, pull down the notification shade, tap the USB notification and choose
   **File transfer**.
3. Copy the `.apk` file into the phone's **Download** folder (on Windows, the phone shows
   up in File Explorer).
4. On the phone, open the **Files** app → **Downloads** and tap the `.apk`.
5. If asked, allow installs from this source (**Settings → Install unknown apps**), then
   tap **Install**.

If install fails with "App not installed" or a signature/package conflict, uninstall any
older copy of the app first, then try again.

The APK runs on its own: no laptop, Metro, or Wi-Fi needed after installing (Firebase
login does need internet). Development-only buttons (e.g. "Add Test Reading") are hidden
in this build.

---

## Option B: Run from source (Windows)

### 1. Install the tools (once)

| Tool | Notes |
|---|---|
| [Node.js LTS](https://nodejs.org) | Includes `npm` |
| [Git](https://git-scm.com/download/win) | |
| [Android Studio](https://developer.android.com/studio) | Installs the Android SDK and a JDK. On first launch, let the setup wizard install the default SDK. |

Then set environment variables (Start → "Edit the system environment variables" →
Environment Variables → User variables):

| Variable | Value |
|---|---|
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` |
| `Path` (add an entry) | `%LOCALAPPDATA%\Android\Sdk\platform-tools` |

Open a **new** terminal and check: `adb --version` and `java -version` should both work.

### 2. Get the code

Keep the path short. Windows has a 260-character path limit and the native build creates
deep folders, so `C:\dev\` works better than somewhere under `Documents\OneDrive\...`.

```bash
cd C:\dev
git clone https://github.com/KevinCGIA/DSS-wearable-App.git
cd DSS-wearable-App
git checkout feature/ble-connection
npm install
```

### 3. Add the Firebase config file

`google-services.json` is not in git. Get it from Kevin privately (don't commit it or post
it publicly), then put a copy in **both** places:

```
DSS-wearable-App\google-services.json
DSS-wearable-App\android\app\google-services.json
```

### 4. Set up the phone (once)

1. **Settings → About phone** → tap **Build number** 7 times to unlock Developer options.
2. **Settings → System → Developer options** → turn on **USB debugging**.
3. Connect the USB-C cable. On the phone, tap **Allow** on the "Allow USB debugging?"
   prompt (tick "Always allow from this computer").
4. Run `adb devices`. The phone should be listed as `device`.
   - `unauthorized` → accept the prompt on the phone.
   - Not listed → try another cable/port. Samsung phones may need the
     [Samsung USB driver](https://developer.samsung.com/android-usb-driver).

### 5. Build and run

```bash
npx expo run:android
```

The first build takes 10–20 minutes. It installs the app on the phone, connects it to
Metro over the USB cable (`adb reverse`), and starts Metro. Keep the terminal open; saving
a file reloads the app on the phone.

Next time, run the same command. It only rebuilds what changed, so it's much faster.

---

## Running on a Mac

Follow Option B steps 2–5 (the Android SDK path is `~/Library/Android/sdk`), but use:

```bash
npm run android:dev
```

This also starts the emulator if no phone is connected, fixes the emulator's network after
switching Wi-Fi networks, and frees memory after builds. See `scripts/android-dev.sh`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **"Unable to load script"** / can't connect to Metro | Run `adb reverse tcp:8081 tcp:8081`, then shake the phone → **Reload**. Needed again whenever the cable is unplugged. |
| **"SDK location not found"** | `ANDROID_HOME` isn't set, or the terminal was opened before setting it. |
| **JDK / "Unsupported class file major version"** errors | Point `JAVA_HOME` at Android Studio's bundled JDK (`...\Android Studio\jbr`). |
| **"File google-services.json is missing"** | See step 3; it must also be in `android\app\`. |
| **"Filename longer than 260 characters"** / CMake errors | Move the project to a short path like `C:\dev\`. |
| **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`** | An older copy is signed with a different key. Uninstall the app from the phone and run again. |
| **Google Sign-In fails with `DEVELOPER_ERROR`** | The build must be signed with the repo's `android/app/debug.keystore` (SHA-1 `5E:8F:16:06:...`, registered in Firebase). Don't delete or regenerate it. |
| Login fails with **`auth/network-request-failed`** | The phone has no internet. Check Wi-Fi/mobile data. |
