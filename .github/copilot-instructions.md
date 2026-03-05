# Copilot Instructions — Family Points (家庭積分系統)

## Build & Dev Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build to dist/
npm run deploy     # Build + publish to GitHub Pages (runs predeploy automatically)
```

No test runner or linter is configured in this project.

## Architecture Overview

This is a **client-only** React 19 + TypeScript single-page app. There is no backend, no routing library, and no global state manager.

### Data flow
- **`App.tsx`** is the single source of truth. All app state lives here as one `AppState` object (`useState<AppState>`).
- State mutations happen exclusively through handler functions defined in `App.tsx` (e.g. `handleAddRecord`, `handleUpdateItems`) passed down as props — classic prop drilling throughout.
- Every time `data` changes, a `useEffect` in `App.tsx` automatically calls `persistData` → `saveState` to write to IndexedDB.

### Storage layer (`services/`)
- **`services/database.ts`** — defines the Dexie.js `FamilyPointsDB` class, the IndexedDB schema, and all default seed data (`INITIAL_USERS`, `INITIAL_SCORE_ITEMS`, `INITIAL_REWARD_ITEMS`). When adding a new IndexedDB table or index, bump the version number in the `this.version(N)` call.
- **`services/storageService.ts`** — thin wrapper. Exports `loadState` / `saveState` (used by `App.tsx`) and re-exports database utilities (`exportAllData`, `importAllData`, `cleanupOldRecords`, etc.).
- `saveState` writes the entire `AppState` snapshot transactionally (clear + bulkAdd for each table). LocalStorage is used only as a fallback if IndexedDB fails.

### Component structure
- **`components/Dashboard.tsx`** — main shell after login; handles tab navigation (`overview | log | messages | settings`) and renders modal overlays (`ActionLogger`, `RewardRedeemer`).
- **`components/RoleSelector.tsx`** — login screen; children log in directly, parents must enter PIN `080987` (hardcoded as `CORRECT_PIN` constant).
- **`components/ui/`** — shared primitives: `Button`, `Card`, `ConfirmationModal`.
- **`components/Icons.tsx`** — centralised re-exports from `lucide-react`.

### User / role model
Two roles defined in `types.ts`: `UserRole.PARENT` and `UserRole.CHILD`. The parent sees settings and chart tabs; children see a mailbox to write messages. Seed data has one parent (`parent_1`) and two children (`child_1`, `child_2`). `Dashboard.tsx` currently **hardcodes** lookups for `child_1` and `child_2` by ID.

### Scoring model
`ScoreRecord.pointsChange` is always the **signed integer** applied to a child's score (positive = earned, negative = deducted or redeemed). When creating a record from a `ScoreItem`, apply the sign: `item.type === 'POSITIVE' ? item.points : -item.points`. Reward redemptions also create a `ScoreRecord` with a negative `pointsChange`.

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
