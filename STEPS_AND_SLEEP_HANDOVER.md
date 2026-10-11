# Steps and sleep over Bluetooth: handover note

**Status (2026-10-11):** not built. The app detects a steps/sleep device but does not read its data.
Everything else in the biometrics work (heart rate, HRV, energy, SpO₂, temperature, blood pressure,
running metrics, weight, BMI, body fat, glucose) is collected and displayed.

## Why it isn't built

There are two ways a wearable can send steps and sleep over Bluetooth, and we could use neither:

1. **The standard: Physical Activity Monitor Service (PAMS, service `0x183E`).** Its specification says
   use by anyone who is not a Bluetooth SIG member is prohibited. The team is not a member, so the
   format was deliberately not implemented and no copy of the spec is in this repo.
2. **The product owner's own format.** Most wearables send steps and sleep in a private (vendor) format.
   We did not have the product owner's device or its data format before handover.

## What you need before starting

One of:
- **The product owner's data format:** the service UUID, the characteristic UUIDs, and the byte layout of
  each packet (which bytes are steps, sleep stage, timestamps, units, byte order), plus whether the
  device pushes data (notify) or has to be asked for stored records.
- **Or** confirmation that the organisation is a Bluetooth SIG member (membership at the Adopter level is
  free), in which case PAMS can be implemented from the official spec.

## What the app does today

- A device with service `0x183E` connects and shows **"Steps & sleep (not supported yet)"** in its
  Measures row (Devices tab and Device Detail). If that is its only health service, the connection
  shows the usual "doesn't provide heart rate or other supported health data" message.
- **Steps:** the whole pipeline already exists (`steps` reading type, saving, Dashboard "Today's
  Activity", Activity → Steps section). Only the Bluetooth decoder is missing. `steps` values are a
  **running total for the day that resets at midnight**.
- **Sleep:** the screens exist (Dashboard "Sleep & Recovery", Activity → Sleep) but show
  "No sleep data yet". The only sleep data is a dev sample night on the Test data chip.

## Where to add it

| Step | File | What to do |
|---|---|---|
| 1. Decode | `src/lib/biometrics/decoders.ts` | Add a pure function per packet type (bytes in, values out). Follow the existing decoders; return `null` for malformed packets. Add tests in `tests/biometricDecoders.test.mjs`. |
| 2. Identify the service | `src/lib/biometrics/metrics.ts` | Add the service UUID to `SERVICE_UUIDS` and map it in the services-to-measures table (near `PHYSICAL_ACTIVITY_MONITOR`). For steps, map it to `'steps'`. Update `measureLabel` so the "not supported yet" text goes away. |
| 3. Subscribe | `src/lib/ble/BleService.native.ts` → `startHealthMonitors` | Add a block like the others: monitor the characteristic, decode, then `this.emitMetrics([{ type: 'steps', value, timestamp }])`. Add its UUID to `CHARACTERISTICS`. If the device needs a request to send stored records, see how glucose writes to its control point. Tests: `tests/bleHealthMonitors.test.mjs`. |
| 4. Steps: done | — | Emitting `steps` is enough. Saving and every screen already handle it. |
| 5. Sleep: storage | `src/data/types.ts`, `src/lib/sensors/` | Sleep is not a single number, so it needs its own shape. The screens expect `SleepSummary` (total minutes, score, rating, start, end, stages) and `SleepTrends`. Save nights in a **new** Firestore collection (e.g. `users/{uid}/sleep_sessions/{id}`); do not change existing collections. |
| 6. Sleep: show it | `src/features/activity/useActivityData.ts` (`sleepFor`), `src/features/dashboard/useDashboardData.ts` (`sleep`, `sleepTrends`) | Return the real night for the selected device instead of `null`. No screen changes needed. Then delete `src/lib/sensors/testExtras.ts`. |
| 7. Rules | `firestore.rules` | Allow the new sleep collection for the owner only. Kevin/Jared deploy rules; never edit them in the console. |

## Rules to keep

- **Nothing estimated.** Do not derive steps, distance, calories or sleep from heart rate. If the device
  does not report a sleep score, leave it out rather than inventing one.
- **Firestore: additions only.** Never rename, remove or retype existing fields.
- **No UI redesign without Tarun.** The existing cards already cover steps and sleep.

## Testing without the real device

nRF Connect (Android/iOS) can advertise a custom service and send hand-written packets, which is enough
to test the decoder and the screens once the format is known. Final checks need the real wearable.
