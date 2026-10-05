# Combined Phase 2 test session

## Setup — iOS Simulator

- Open DSS Wearables on the iPhone 18 Pro Simulator. Confirm the sign-in screen appears. Verified on 2026-10-06; the development build displays its Preview mode badge.
- T0 review (Mac): read the 2026-10-06 T0 Progress Log entry. Confirm the approved four-device cap, platform device IDs, additive Firestore schema and phone-local connection log are recorded. This does not require a live app test.

## T2 Step A live checks — iOS Simulator

1. Register a test account; confirm Auth and the string `name`, `height`, `weight` fields under `users/{uid}` in Firebase Console.
2. Confirm unverified login is blocked, verify the email, then log in.
3. Request a password reset and check the email.
4. Google sign-in with a new account: confirm the profile and photo or initials.
5. Google sign-in with an existing account: confirm existing profile values survive.
6. Edit profile and avatar, relaunch, and check they persist.
7. Exercise change email and change password.
8. Save alert thresholds and reload; check `users/{uid}/settings/alerts`. Report any `permission-denied` to Kevin/Jared.
9. Confirm signed-in state survives relaunch and Logout returns to sign-in.
10. Disconnect networking and open Profile and Alert Thresholds: loading must end in an error or cached data within eight seconds. Restore networking and retry.

Same-account Android testing is assigned to the Android team.

## T3 one-device test — physical iPhone + LightBlue phone

1. In LightBlue, create a Heart Rate virtual device without Battery or Device Information services. Keep the phone awake and LightBlue open.
2. On the app iPhone, check Bluetooth off/on banners and denied permission → Settings.
3. Scan; check heart-rate marker, signal ordering and automatic stop after 15 seconds.
4. Connect, cancel during setup, then connect again. The missing optional services must not cause a disconnect or retry; Devices shows battery as Not reported.
5. Change Heart Rate Measurement in Hex: `0046` (70), `0064` (100), `012C01` (300). Dashboard and Activity must update.
6. Send malformed/empty data if LightBlue permits it: the app must stay responsive.
7. Test a virtual device without the Heart Rate service. It stays connected and the existing Add device banner says it does not provide heart rate.
8. Disconnect; turn the LightBlue device off and on to test unexpected-drop reconnect; Forget; relaunch with auto-connect off, then on.

## T4 multi-device test — app iPhone + 2 LightBlue phones

1. Keep both LightBlue phones unlocked with Heart Rate virtual devices active. Give them distinct names if possible.
2. Connect each from Add device. Devices must show two Connected now cards; Dashboard must show two devices connected.
3. Set device A to `0046` (70), B to `0064` (100). In Activity, select each chip and check its value. Change A to `005A` (90); B must stay at 100.
4. Disconnect A. B must continue streaming. Reconnect A, then Forget A; B must remain connected.
5. Pair A again, enable auto-connect, relaunch: both remembered devices reconnect. Switch auto-connect off and relaunch: neither reconnects automatically.
6. With additional equipment, connect four devices, then try a fifth. Expect the existing error banner to state the four-device limit; all four streams continue. Two LightBlue phones alone cannot validate this physical limit test.
7. Cancel one device while it is connecting or reconnecting; the other remains connected and the cancelled device must not return later.

## T5 saved readings

Pending implementation steps; perform these in the final combined session.

## T6 device stats

Pending implementation steps; perform these in the final combined session.

## T7 alerts

Pending implementation steps; perform these in the final combined session.
