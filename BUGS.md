# Phase 2 verification and bugs

## 2026-10-05 — A11 Step A test

The iPhone 18 Pro Simulator development build opens to the sign-in form. Local typecheck and 38 adapter tests pass. Live Firebase account, email, Firestore, profile, alert, and persistence checks are pending PL's test credentials and clicks; no live result is claimed. Android emulator testing is unavailable on this Mac, and Kevin Android shared-data comparison requires an app build. No A11 runtime defect has been confirmed.

| A11 check | iOS Simulator | Android emulator/phone |
| --- | --- | --- |
| 1. Registration; Auth user and `users/{uid}` fields | Pending live test and Console check | Pending Tarun's build |
| 2. Unverified login; email verification; verified login | Pending live test and email link | Pending Tarun's build |
| 3. Password reset email | Pending live test and inbox check | Pending Tarun's build |
| 4. New Google account; profile and avatar | Pending live test | Pending SHA-1 and Tarun's build |
| 5. Existing Google account; preserve profile | Pending live test | Pending SHA-1 and Tarun's build |
| 6. Profile and avatar edits after relaunch | Pending live test | Pending Tarun's build |
| 7. Change email and password | Pending live test and email link | Pending Tarun's build |
| 8. Alert thresholds Firestore save and reload | Pending live test and Console check | Pending Tarun's build |
| 9. Logout and session persistence | Pending live test | Pending Tarun's build |
| 10. Same profile in Kevin's Android app | Requires Kevin Android build | Requires Kevin Android build |
