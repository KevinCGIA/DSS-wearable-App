# DSS Wearables (iOS)

React Native (Expo) + TypeScript client for the DSS wearable health tracker.

## Setup

```bash
npm install
cp .env.example .env   # fill in from Firebase console → Project settings → Your apps
npm start              # then scan the QR with Expo Go, or press i on macOS
npm run typecheck
```

Enable **Email/Password** under Firebase Authentication → Sign-in method, or every
sign-in returns "Email sign-in is turned off for this project."

## Structure

```
src/features/<name>/  one folder per feature — its screen, hooks and helpers
                      auth, home, analytics, monitoring, settings
src/navigation/       RootNavigator — tab state and the tab-to-screen map
src/components/ui/    shared primitives (Core UI)
src/components/       shared non-primitive components (PlaceholderScreen)
src/theme/            design tokens — colors, spacing/radius, typography
src/data/             shared fixture data
src/lib/              Firebase client, shared hooks
```

Every component and screen reads from `src/theme`. Add a token there rather than a
literal hex or pixel value in a screen.

Imports use the `@/` alias for `src/` (`import { colors } from '@/theme';`), so moving a
file does not rewrite imports elsewhere. Import each component from its own file rather
than a shared barrel `index.ts` — barrels conflict on every parallel PR that adds one.

Work inside your own `src/features/<name>/` folder where you can. `src/components/ui/`,
`src/theme/` and `App.tsx` are the shared surfaces: keep changes there small and flag them.

## Design tokens

| Token group | Choice |
| --- | --- |
| Ground / surface | `#F6F8FB` page, `#FFFFFF` cards |
| Accent (live tier) | `#2B7BE4`, gradient `#4F94F2 → #1C61C4` |
| Session tier | `#1B2C3F` badge on white |
| Text | `#0E1B2A` primary, `#4A6076` secondary, `#6B8098` muted |
| Vitals | calm `#1FA98A`, peak `#F0A02C`, pulse `#F2506B` — meaning only, never decoration |
| Type | Barlow (numerals), Manrope (UI) |
| Radius | 10 / 14 / 20 / 28 / pill |
| Spacing | 4-based: 4, 8, 12, 16, 20, 24, 32, 40, 56 |

## Not yet wired

Heart rate on Home is simulated on a 2s interval. BLE/NFC device connectivity,
Firestore session history, and Cloud Storage are the next milestones; the Activity,
History, and Settings tabs are placeholders that already use the design system.
