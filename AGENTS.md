# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at http://localhost:3000 (host 0.0.0.0)
npm run build      # Production build to dist/
npm run preview    # Preview the production build locally
npm run deploy     # Build + publish dist/ to GitHub Pages (predeploy runs the build)
```

There is **no test runner and no linter** configured. UI text, JSDoc comments, and `console.log` messages are in **Traditional Chinese (zh-TW)**.

**Always reply to the user in Traditional Chinese (zh-TW).**

## Architecture

A **React 19 + TypeScript + Vite** single-page app deployed as a static site to GitHub Pages. No backend server, no routing library, and **no global state manager** — `App.tsx` owns everything.

### State & data flow
- `App.tsx` is the single source of truth: it holds `useState<AppState | null>` and orchestrates Firebase auth, the Firestore subscription, loading/error UI, and persistence.
- All state mutations go through handler functions in `App.tsx` (`handleAddRecord`, `handleUpdateItems`, `handleUpdateUsers`, `handleUpdateRewardItems`, `handleUpdateGoalRewards`, `handleUpdateDiscountCards`, `handleSendMessage`, …) passed down via **prop drilling** — there is no abstraction layer. Prefer minimal, local changes.
- When a Firebase user signs in, `App.tsx` subscribes via `subscribeState()`. When `data` changes, it calls `persistData()` → `saveState()` to write the **whole normalized `AppState`** snapshot back. `lastSyncedStateRef` prevents re-writing identical state after a snapshot echoes back.

### Storage layer (`services/`) — cloud-first
- `firebase.ts` — initializes Firebase App, `auth`, and Firestore with `persistentLocalCache()`. Requires the `VITE_FIREBASE_*` env vars (see below); missing vars set `firebaseConfigError`, which blocks the app with a setup screen.
- `storageService.ts` — the persistence facade. Firestore doc path is **`userStates/{uid}`** (one doc per Firebase account). `loadState()` reads, `subscribeState()` listens in real time, `saveState()` writes the full state with `setDoc()`. If no cloud doc exists, it bootstraps from local IndexedDB and uploads that snapshot (first-device migration path).
- `database.ts` — legacy Dexie/IndexedDB (`FamilyPointsDB`, schema, default seed data). Now used only for old-data migration, browser cache, and storage-info helpers — **not** the source of truth. Bump `this.version(N)` (and add `.upgrade()` if transforming data) when changing the schema.

### App gates & shell
1. `components/CloudLogin.tsx` — Firebase Email/Password sign-in. Nothing shows until authenticated.
2. `components/RoleSelector.tsx` — local role pick. Children log in directly; parents must enter PIN **`080987`** (hardcoded `CORRECT_PIN`).
3. `components/Dashboard.tsx` — main shell with tab navigation; renders modal overlays like `ActionLogger` and `RewardRedeemer`.
4. `components/SettingsPanel.tsx` — parent-only admin: backup/restore, cleanup, member/score-item/reward-item/goal editing.
- `components/ui/` — shared primitives (`Button`, `Card`, `ConfirmationModal`). `components/Icons.tsx` re-exports from `lucide-react`.

### Domain model (`types.ts`)
- Two roles: `UserRole.PARENT` and `UserRole.CHILD`. Seed data has one parent (`parent_1`) and two children (`child_1`, `child_2`). `Dashboard.tsx` and `RoleSelector.tsx` **hardcode `child_1` / `child_2`** by ID — if you change the number of children or move to dynamic rendering, update these and the seed data **together**.
- `ScoreRecord.pointsChange` is always the **signed integer** applied to a child's score. When creating a record from a `ScoreItem`, apply the sign: `item.type === 'POSITIVE' ? item.points : -item.points`. Reward redemptions also produce a `ScoreRecord` with negative `pointsChange`.
- `AppState` aggregates: `users`, `scoreItems`, `rewardItems`, `records`, `messages`, `goalRewards`, `discountCards`, `rewardCards`, `stampCards`. `GoalReward` (categorized targets, `YYYY-MM-DD` dates, status) can issue a `DiscountCard` ("五折卡") on achievement.
- **Card systems** (all managed by parents in `SettingsPanel`, displayed on the overview):
  - `DiscountCard` ("五折卡") — issued by achieving a `GoalReward`; consumed in `RewardRedeemer` to halve a redemption cost.
  - `RewardCard` ("獎勵卡") — issued ad-hoc for special achievements; the reward is **bound at issue time** (either an existing `RewardItem` snapshot or a custom label/icon). Redeemed **for free** (writes a `pointsChange: 0` record), then marked `REDEEMED`.
  - `StampCard` ("集點卡") — a parent-stamped punch card **fully independent of points** (never touches score). Parent adjusts `stamps` up to `targetStamps`; when full, redeems for a physical gift and marks `REDEEMED`.
  - All three follow the same `onUpdate<X>Cards((items) => items)` updater-prop pattern threaded `App.tsx` → `Dashboard` → `SettingsPanel`.

## Conventions

- **Tailwind is loaded via CDN in `index.html`, not npm.** The custom theme (the Animal-Crossing `nook-*` palette, `Zen Maru Gothic` font, `animate-pop`, stripes/leaf-pattern/tape-effect styles) is configured in a `<script>`/`<style>` block in `index.html` — there is **no `tailwind.config.js`**; do not add one. Match the `nook-*` colors and rounded, playful shapes.
- `Button` variants use an "AC squishy" style: `border-b-4` + `active:border-b-0 active:translate-y-[4px]`. Match this for custom buttons.
- Path alias `@` resolves to the **project root** (not `src/`), set in `vite.config.ts`.
- All entity IDs are `Date.now().toString()`; timestamps are Unix ms (`Date.now()`).

## Firebase env vars (`.env.local`)

Exact names expected by `firebase.ts` — keep them if touching onboarding/setup/auth:
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

Firestore security rule restricts each user to their own doc: `match /userStates/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }`.

## Deployment (GitHub Pages)

`vite.config.ts` uses `base: '/Familypoints-Pages/'` and `package.json` has `homepage: 'https://rushbq.github.io/Familypoints-Pages'`. Don't change these unless the repo/deploy target changes. Deploy with `npm run deploy` (publishes the `gh-pages` branch). See `github_pages_sop.md` for the full SOP.
