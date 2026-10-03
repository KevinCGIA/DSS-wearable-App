# Android app: bugs found during the iOS wiring review

**From:** Tarun (iOS UI)  ·  **Date:** 3 Oct 2026
**Code reviewed:** `origin/feature/ble-connection` @ `e65c84b` (same as `main` for the auth and settings files)

Hi Kevin and Jared, I found these while mapping the Android screens so the iOS app behaves the same way. Bugs 1 to 4 are the most important. They affect the shared `users/{uid}` data in Firebase, and the iOS app will read and write that same data. Line numbers refer to the branch above.

---

## 1. "Sign up with Google" overwrites an existing user's profile

- **Severity:** High (data loss in shared Firestore)
- **Screen:** Register
- **File:** `app/register.tsx:243` (`signUpWithGoogle` → `setDoc(doc(firestore, "users", uid), {...})`)

**Steps to reproduce**
1. Register with Google, then go to Settings and set your name, height and weight. Turn Auto-connect off.
2. Log out and go to Register.
3. Leave the form empty and tap "Sign up with Google" with the same Google account.

**Expected:** Signs in and keeps the existing profile.
**Actual:** `setDoc` without `{ merge: true }` replaces the whole `users/{uid}` document. Name becomes the Google first name, height and weight become `""`, and `autoConnectDevice` is deleted.

**Suggested fix:** Only write the profile if the doc doesn't exist yet (`getDoc` first), or use `setDoc(..., { merge: true })` and skip empty fields.

---

## 2. "Sign in with Google" never creates a profile, so Save Changes then fails

- **Severity:** High
- **Screens:** Login, then Settings
- **Files:** `app/login.tsx:95` (`signInWithGoogle` only calls `signInWithCredential`), `app/(auth)/settings.tsx:210` (`saveProfile` uses `updateDoc`)

**Steps to reproduce**
1. With a Google account that has never used the app, tap the Google button on **Login** (not Register).
2. Go to Settings, enter a name and tap Save Changes.

**Expected:** Profile saved.
**Actual:** No `users/{uid}` doc was ever created, so `updateDoc` throws `firestore/not-found` and the user sees "Failed to update profile". Home and Settings also show an empty profile.

**Suggested fix:** Share one "ensure profile exists" helper between both Google buttons (it also fixes bug 1). Alternatively, use `setDoc(..., { merge: true })` in `saveProfile`.

---

## 3. Google users never see their profile picture

- **Severity:** Medium
- **Screens:** Home (avatar), Settings
- **Files:** `app/register.tsx:247` writes `profilePictureUrl` on `users/{uid}`. `app/(auth)/home.tsx:57` and `app/(auth)/settings.tsx:78` only read `users/{uid}/private/avatarData.imageData`.

**Steps to reproduce**
1. Sign up with a Google account that has a photo.
2. Look at the Home avatar and the Settings picture.

**Expected:** Google photo shown.
**Actual:** Grey "?" placeholder, because `profilePictureUrl` is saved but never read.

**Suggested fix:** When `private/avatarData` is missing, fall back to `profilePictureUrl`. Alternatively, store Google photos in `private/avatarData` too, so there's one place to read from.

---

## 4. Height and weight are stored as strings, with no validation

- **Severity:** Medium (data quality in shared Firestore)
- **Screens:** Register, Settings
- **Files:** `app/register.tsx:107-109` and `:243-245`, `app/(auth)/settings.tsx:210-214`. Inputs at `register.tsx:299,307` and `settings.tsx:399,411` use `keyboardType="numeric"` only.

**Steps to reproduce**
1. In Settings, enter Height `abc` (paste) or `1.8.5`, then Save Changes.

**Expected:** Validation error, or a number saved.
**Actual:** Saved as is. Valid values are also saved as strings (`"180"`), so anything doing maths on them (e.g. calories later) has to parse them, and iOS has to handle both types.

**Suggested fix:** Validate (e.g. 50–250 cm, 20–300 kg) and save `Number(value)`, or `null` when empty.

---

## 5. Home shows 0 steps next to hardcoded distance, floors, sleep and calories

- **Severity:** Medium (misleading data)
- **Screen:** Home
- **File:** `app/(auth)/home.tsx:165` (live `StepsDisplay`) next to hardcoded `:168` "4.8 km", `:172` "12 Floors", `:187` "7h 42m", `:197` "86/100", `:214` "486 kcal"

**Steps to reproduce**
1. Log in with a new account and no device.

**Expected:** All empty (or all hidden) until real data exists.
**Actual:** "0 Steps" next to "4.8 km" and "12 Floors", plus fixed sleep and calorie values that never change.

**Suggested fix:** Hide these until there's a data source, or show "--". (iOS currently hides distance, floors and calories, and shows sleep as "--".)

---

## 6. Home "Log Out" has no confirmation

- **Severity:** Low (inconsistent UX)
- **Screen:** Home
- **File:** `app/(auth)/home.tsx:78` (`logout` calls `signOut` directly). Settings asks "Are you sure you want to log out?" first.

**Steps to reproduce:** Tap Log Out on Home.
**Expected:** The same confirm dialog as Settings.
**Actual:** Logs out immediately.

---

## 7. Home greeting ignores the user's name

- **Severity:** Low
- **Screen:** Home
- **File:** `app/(auth)/home.tsx:93` (static "Welcome!")

**Steps to reproduce:** Set a name in Settings and go back to Home.
**Expected:** Greeting with the name, e.g. "Welcome, Alex!", falling back to "Welcome!" with no name.
**Actual:** Always "Welcome!". The name is already loaded in Settings (`loadProfile`) but not on Home.

---

## 8. Google Sign-In isn't set up for iOS

- **Severity:** Medium (blocks iOS Google login in Phase 2)
- **Screens:** Login, Register
- **Files:** `app/login.tsx:24` and `app/register.tsx:35` (duplicated `GoogleSignin.configure({ webClientId })`, no `iosClientId`)

**Expected:** One shared config with both `webClientId` and `iosClientId`, plus the iOS URL scheme from `GoogleService-Info.plist`.
**Actual:** Only the web client ID, copied in two files. On iOS, `GoogleSignin.signIn()` will fail without the iOS client ID.

**Suggested fix:** Move `GoogleSignin.configure` into one module (e.g. `services/auth/google.ts`) and add `iosClientId` once the iOS app is registered in Firebase.

---

## 9. iOS bundle identifier is a placeholder that doesn't match the Android package

- **Severity:** Low (needs a team decision before the iOS build)
- **File:** `app.json:12` `"bundleIdentifier": "com.galaxies.firebase"` vs `app.json:22` `"package": "com.dsswearablecool.firebase"`

**Expected:** An agreed iOS bundle ID, registered as an iOS app in the same Firebase project (project number `944450266341`).
**Actual:** An unrelated placeholder.

**Ask:** Could you share the Firebase **project ID** and agree the iOS bundle ID with us?

---

## 10. Errors use `alert()` / `console.log`, and the Home avatar fails silently

- **Severity:** Low
- **Files:** `app/login.tsx:53-104` (`alert(...)` for success and errors, including "Signed in successfully!" on every login), `app/(auth)/home.tsx:69` (avatar load error only logged)

**Expected:** Inline error messages, no success alert on a normal login, and a retry or placeholder if the avatar fails.
**Actual:** Global `alert()` pop-ups, and a silent failure on Home.
