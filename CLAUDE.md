# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at http://localhost:3000 (host 0.0.0.0)
npm run build      # Production build to dist/
npm run preview    # Preview the production build locally
```

There is **no test runner and no linter** configured. `tsc --noEmit` runs automatically at the end of a session (`.claude/hooks/typecheck.mjs`) — don't add it to a task's steps. UI text, JSDoc comments, and `console.log` messages are in **Traditional Chinese (zh-TW)**.

**Always reply to the user in Traditional Chinese (zh-TW).**

## Architecture

A **React 19 + TypeScript + Vite** single-page app deployed as a static site to GitHub Pages. No backend server, no routing library, and **no global state manager** — `App.tsx` owns everything.

### State & data flow
- `App.tsx` is the single source of truth: it holds `useState<AppState | null>` and orchestrates Firebase auth, the Firestore subscription, loading/error UI, and persistence.
- All state mutations go through handler functions in `App.tsx` (`handleAddRecord`, `handleUpdateItems`, `handleUpdateUsers`, `handleUpdateRewardItems`, `handleUpdateGoalRewards`, `handleUpdateDiscountCards`, `handleSendMessage`, …) passed down via **prop drilling** — there is no abstraction layer. Prefer minimal, local changes.
- When a Firebase user signs in, `App.tsx` subscribes via `subscribeState()`. When `data` changes, it calls `persistData()` → `saveState()` to write the **whole normalized `AppState`** snapshot back. `lastSyncedStateRef` prevents re-writing identical state after a snapshot echoes back.

### Storage layer (`services/`) — cloud-first
- `firebase.ts` — initializes Firebase App, `auth`, and Firestore with `persistentLocalCache()`. Requires the `VITE_FIREBASE_*` env vars; missing vars set `firebaseConfigError`, which blocks the app with a setup screen.
- `storageService.ts` — the persistence facade. Firestore doc path is **`userStates/{uid}`** (one doc per Firebase account). `loadState()` reads, `subscribeState()` listens in real time, `saveState()` writes the full state with `setDoc()`. If no cloud doc exists, it bootstraps from local IndexedDB and uploads that snapshot (first-device migration path).
- `database.ts` — legacy Dexie/IndexedDB (`FamilyPointsDB`, schema, default seed data). Now used only for old-data migration, browser cache, and storage-info helpers — **not** the source of truth. Bump `this.version(N)` (and add `.upgrade()` if transforming data) when changing the schema.

### App gates & shell
1. `components/CloudLogin.tsx` — Firebase Email/Password sign-in. Nothing shows until authenticated.
2. `components/RoleSelector.tsx` — local role pick. Children log in directly; parents must enter a PIN (hardcoded as `CORRECT_PIN` in that file).
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
- `font-display` (Orbitron) is for short Latin labels in caps with wide tracking. **Never apply it to Chinese** (Orbitron has no CJK glyphs, and the tracking wrecks the fallback) and **not to score digits** — Orbitron's slashed zero reads as a symbol; scores use `font-sans` bold italic with `tabular-nums`.

### Typography scale

Weights are a hierarchy, not decoration. The app previously set almost everything to 700/900, which flattened the hierarchy and blurred small Chinese on the dark background.

| Weight | Use |
|---|---|
| `font-black` (900) | Page/section headings at `text-base`+, and score numbers. Nothing at `text-sm` or below. |
| `font-bold` (700) | Card titles, names, buttons, chips, values worth scanning. |
| `font-medium` (500) | Form labels, list labels. |
| `font-normal` (400) | Descriptions, hints, timestamps, any full sentence. |

- **Secondary text is `text-bey-dim`, a solid token — never `text-bey-ink/NN`.** Opacity below ~70% on `bey-panel` falls under 4.5:1 and fails WCAG AA. Keep opacity for borders and backgrounds only; the one exception is a deliberately disabled control.
- Secondary text is `font-normal`. Exception: Orbitron micro-labels (`font-display`) need `font-bold` to hold up at 10–11px.
- Minimum text size is `text-[10px]`, and only for Latin Orbitron labels; Chinese does not go below `text-xs`.
- Dividers on dark panels use `border-bey-steel`. A tinted border like `border-bey-cyanDark/10` is invisible here.
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
- **Never build sibling-vs-sibling PvP.** The score items include 刻意吵架/搶玩具; a sanctioned win/lose between the brothers would manufacture conflict. Co-op against a system opponent is the accepted direction — see PRODUCT.md → Roadmap.
- `Button` variants use an "AC squishy" style: `border-b-4` + `active:border-b-0 active:translate-y-[4px]`. Match this for custom buttons.
- Path alias `@` resolves to the **project root** (not `src/`), set in `vite.config.ts`.
- All entity IDs are `Date.now().toString()`; timestamps are Unix ms (`Date.now()`).
- **Never change `base` in `vite.config.ts` or `homepage` in `package.json`** unless the deploy target itself changes — they must match the GitHub Pages repo name or the deployed site breaks.
- **Never put secrets in tracked files** (CLAUDE.md, README, commit messages) — Firebase keys live in `.env.local`, which is gitignored.
