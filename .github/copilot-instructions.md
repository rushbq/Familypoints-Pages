# Copilot Instructions — Family Points (家庭積分系統)

## Build & Dev Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run deploy     # Build + publish to GitHub Pages (runs predeploy automatically)
```

No test runner or linter is configured in this project.

## Architecture Overview

This is a **React 19 + TypeScript + Vite** single-page app deployed as a static site to GitHub Pages.

- There is **no custom backend server** and **no routing library**.
- Cloud features are provided by **Firebase Authentication** and **Cloud Firestore**.
- There is **no global state manager**; `App.tsx` owns application state.

### Data flow
- **`App.tsx`** orchestrates the whole app lifecycle: Firebase auth state, cloud session state, loading/error UI, the in-memory `AppState`, and persistence.
- The primary app state lives in `App.tsx` as `useState<AppState | null>`.
- State mutations happen through handler functions defined in `App.tsx` (for example `handleAddRecord`, `handleUpdateItems`, `handleUpdateUsers`, `handleUpdateRewardItems`, `handleSendMessage`). These are passed downward via props.
- When a Firebase user is signed in, `App.tsx` subscribes to Firestore through `subscribeState()`.
- When `data` changes, `App.tsx` calls `persistData()` → `saveState()` to write the full normalized snapshot back to Firestore.
- `lastSyncedStateRef` is used to avoid writing back identical state after snapshot updates.

### Storage layer (`services/`)
- **`services/firebase.ts`** — initializes Firebase App, `auth`, and Firestore with `persistentLocalCache()`. Environment variables are required via `VITE_FIREBASE_*`.
- **`services/storageService.ts`** — the real persistence facade used by `App.tsx`.
	- Firestore document path is `userStates/{uid}`.
	- `loadState()` reads the signed-in user's cloud document.
	- `subscribeState()` listens to Firestore in real time.
	- `saveState()` writes the whole normalized `AppState` with `setDoc()`.
	- If no cloud document exists yet, it bootstraps from local IndexedDB and uploads that snapshot.
- **`services/database.ts`** — legacy/local persistence support using Dexie + IndexedDB.
	- Defines `FamilyPointsDB`, schema, and default seed data.
	- Used for initial local bootstrap and browser storage inspection helpers.
	- If you change an IndexedDB table or index, bump `this.version(N)`.
- Current architecture is **cloud-first**. IndexedDB is now mainly for old-data migration, local browser cache support, and storage info utilities — not the primary source of truth.

### Component structure
- **`components/CloudLogin.tsx`** — first gate of the app. Users must sign in with Firebase Email/Password before any family data is shown.
- **`components/RoleSelector.tsx`** — second gate after cloud auth. Children log in directly; parents must enter PIN `080987` (hardcoded as `CORRECT_PIN`).
- **`components/Dashboard.tsx`** — main shell after local role selection; handles tab navigation (`overview | log | settings`) and renders modal overlays (`ActionLogger`, `RewardRedeemer`).
- **`components/SettingsPanel.tsx`** — parent-only admin UI for backup/restore, cleanup, member editing, score item editing, and reward item editing.
- **`components/ui/`** — shared primitives: `Button`, `Card`, `ConfirmationModal`.
- **`components/Icons.tsx`** — centralised re-exports from `lucide-react`.

### Current feature status
- The app currently surfaces three main tabs: `overview`, `log`, and `settings`.
- Secret message data structures and handlers still exist in the codebase, but **`SecretMailbox.tsx` is not wired into the current dashboard flow**.
- If you implement mailbox features, verify the full end-to-end UI wiring instead of assuming it already exists.

### User / role model
Two roles are defined in `types.ts`: `UserRole.PARENT` and `UserRole.CHILD`.

- Seed data has one parent (`parent_1`) and two children (`child_1`, `child_2`).
- `Dashboard.tsx` currently **hardcodes** lookups for `child_1` and `child_2` by ID when rendering score cards and reward redemption state.
- `RoleSelector.tsx` also hardcodes display labels for `child_1` / `child_2`.
- If you change the number of children or move to dynamic child rendering, update these hardcoded assumptions together.
- Parent-only capabilities currently include score management, chart visibility, settings, backup/restore, cleanup, and member/item management.

### Scoring model
`ScoreRecord.pointsChange` is always the **signed integer** applied to a child's score (positive = earned, negative = deducted or redeemed). When creating a record from a `ScoreItem`, apply the sign: `item.type === 'POSITIVE' ? item.points : -item.points`. Reward redemptions also create a `ScoreRecord` with a negative `pointsChange`.

### Cloud sync model
- Every Firebase account owns exactly one Firestore document at `userStates/{uid}`.
- Different devices only see the same family data when they sign in with the **same Firebase account**.
- First-time migration path: if cloud data does not exist yet, the app uploads the current local IndexedDB snapshot.
- `firebaseConfigError` in `App.tsx` blocks the app with a setup screen if required Firebase env vars are missing.

## Key Conventions

### Tailwind CSS via CDN
Tailwind is loaded from CDN in `index.html` — **it is not an npm dependency**. The custom theme (color palette, fonts, animations) is configured inside a `<script>` block in `index.html`, not in a `tailwind.config.js` file. Do not try to add a separate config file.

### Custom color palette (`nook-*`)
All UI uses the Animal Crossing–inspired palette defined in `index.html`:
- `nook-cream`, `nook-beige`, `nook-brown` — backgrounds and text
- `nook-green` / `nook-greenDark`, `nook-blue` / `nook-blueDark` — action colors
- `nook-orange` / `nook-orangeDark`, `nook-yellow`, `nook-red`, `nook-paper`

### Path alias
`@` resolves to the project root (not `src/`), configured in `vite.config.ts`.

### Language
UI text, JSDoc comments, and `console.log` messages are in **Traditional Chinese (zh-TW)**.

### Button style
`Button` component variants use an "AC squishy" style: `border-b-4` + `active:border-b-0 active:translate-y-[4px]`. Match this pattern for any custom buttons not using the `Button` component.

### IDs and timestamps
All entity IDs are set with `Date.now().toString()`. Timestamps are Unix ms (`Date.now()`).

### Database schema changes
Increment the version number in `FamilyPointsDB.constructor` whenever you modify the schema. Add a `.upgrade()` migration if existing data must be transformed.

### Firebase environment variables
This project expects the following Vite env vars:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

If a task touches onboarding, setup docs, or auth flow, keep these exact variable names.

### Deployment assumptions
- `vite.config.ts` uses `base: '/Familypoints-Pages/'` for GitHub Pages.
- `package.json` uses `homepage: 'https://rushbq.github.io/Familypoints-Pages'`.
- Do not remove or casually change these unless the repository/deployment target changes.

### Practical editing guidance
- Prefer minimal, local changes; this project relies heavily on prop drilling rather than abstraction layers.
- Preserve the current Animal Crossing–inspired UI style and rounded, playful component shapes.
- When changing persistence logic, verify both the Firestore path and the bootstrap-from-IndexedDB flow.
- When changing child rendering logic, check `Dashboard.tsx`, `RoleSelector.tsx`, default seed data, and any logic tied to `child_1` / `child_2` together.
