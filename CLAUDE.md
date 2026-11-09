# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **Tailwind is loaded via CDN in `index.html`, not npm.** The custom theme (the battle-top `bey-*` palette, `Orbitron` + `Chakra Petch` fonts, `app-bg` / `arena-pattern` / `arena-rings` / `speed-lines` / `clip-notch` / `bey-spin` / `animate-pop` styles) is configured in a `<script>`/`<style>` block in `index.html` — there is **no `tailwind.config.js`**; do not add one.
- **Visual style: 戰鬥陀螺・競技場（STADIUM）**, a dark arena theme. Surfaces go `bey-deep` (page) → `bey-panel` (card) → `bey-paper` (raised/input), separated by `bey-steel` borders rather than shadows. Text is `bey-ink`, secondary `bey-dim`. Accents: `bey-cyan` is the home team / confirm, `bey-orange` the rival team / rewards, `bey-lime` positive bursts, `bey-yellow` referee + 獎勵卡, `bey-red` deductions. Two children are rendered as opposing teams — child index 0 cyan, index 1 orange.
- **On bright fills (`bey-cyan`, `bey-lime`, `bey-yellow`) use `text-bey-void`, never `text-white`.** The `*Dark` tokens are for bottom borders and rings only, not text.
- `font-display` (Orbitron) is for short Latin labels in caps with wide tracking. **Do not use it for score digits** — Orbitron's slashed zero reads as a symbol; scores use `font-sans` bold italic with `tabular-nums`.
- `components/BeyTop.tsx` is the original spinning-top SVG (concentric blade ring + gear + core). Pass `bladeId`/`ratchetId`/`bitId` to draw a specific build, or just `color` for a plain team-colored top. All Beyblade-style art must stay original — no official logos, characters, or product renders.

### Two collection modules

The app has two deliberately contrasting collection loops, both fed by parent-awarded positive points but with **separate, non-competing counters**:

| | 家庭花園 (`familyGarden`) | 陀螺工房 (`beyForge`) |
|---|---|---|
| Currency | 陽光 — 20 pts per watering | 鋼料 — 25 pts per forge draw |
| Ownership | **Shared**, both children grow one plant | **Per-child**, own parts and beys |
| Loop | Water 5× → bloom → species enters 圖鑑 | Draw parts → assemble blade+ratchet+bit → bey |
| Logic | `services/gardenUtils.ts` | `services/beyUtils.ts` (mirrors the garden's shape) |

- A positive record feeds **both** counters in `App.tsx` `handleAddRecord` — they never consume each other.
- Rare parts drop from milestones, detected by **before/after comparison** inside `handleUpdateGoalRewards` / `handleUpdateStampCards` / `handleUpdateRewardCards`. `SettingsPanel` knows nothing about the forge; keep it that way.
- Part definitions live in `services/beyData.ts` (10 blades × 7 ratchets × 7 bits = 490 combinations). Adding a part is a data-only change; the SVG is parameterized by `shape`/`bladeCount`/`ratchetStyle`/`bitStyle`.
- Planned next step (not built): 合作打週魔王 — both children's beys team up against a system boss. `BeyBuild` already carries full stats for this. **PvP between the siblings was deliberately rejected** — the score items include 刻意吵架/搶玩具, so a sanctioned win/lose between brothers is a known risk.
- `Button` variants use an "AC squishy" style: `border-b-4` + `active:border-b-0 active:translate-y-[4px]`. Match this for custom buttons.
- Path alias `@` resolves to the **project root** (not `src/`), set in `vite.config.ts`.
- All entity IDs are `Date.now().toString()`; timestamps are Unix ms (`Date.now()`).

## Firebase env vars (`.env.local`)

Exact names expected by `firebase.ts` — keep them if touching onboarding/setup/auth:
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

Firestore security rule restricts each user to their own doc: `match /userStates/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }`.

## Deployment (GitHub Pages)

`vite.config.ts` uses `base: '/Familypoints-Pages/'` and `package.json` has `homepage: 'https://rushbq.github.io/Familypoints-Pages'`. Don't change these unless the repo/deploy target changes. Deploy with `npm run deploy` (publishes the `gh-pages` branch). See `github_pages_sop.md` for the full SOP.
</content>
</invoke>
