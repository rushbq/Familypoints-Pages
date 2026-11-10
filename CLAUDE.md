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
3. `components/Dashboard.tsx` — main shell with tab navigation (`activeTab` state, no router); renders modal overlays like `ActionLogger` and `RewardRedeemer`.
   - Tabs: `overview`（首頁）, `bey`（陀螺工房：`BeyBoss` above `BeyForge`）, `log`, `settings` (parent only), plus two home sub-pages that are not in the nav: `garden`（`FamilyGarden`）and `album`（植物圖鑑）. Flow is 首頁 → 花園 → 圖鑑; the album's back button returns to `garden`. The 首頁 nav item counts as active on `overview`, `garden` and `album`. `<main>` scrolls back to the top on every tab change.
   - The desktop sidebar (`lg`+, i.e. landscape iPad) shows a visible `text-xs` label under each icon; icon-only was too hard for the children to find.
   - `FamilyGarden` does not embed the album; it calls `onOpenAlbum` and Dashboard switches to `album`.
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
- **Visual style: 戰鬥陀螺・競技場（STADIUM）**, a dark arena theme. Surfaces go `bey-deep` (page) → `bey-panel` (card) → `bey-paper` (raised/input), separated by `bey-steel` borders rather than shadows. Text is `bey-ink`, secondary `bey-dim`.
- **Every accent owns exactly one role.** `bey-cyan` = system primary (active tab, confirm, focus ring, progress, app logo); `bey-lime` = positive/加分; `bey-red` = 扣分/danger; `bey-yellow` = 裁判席/獎勵卡/陽光; `bey-blue` = navigation/info; `bey-purple` and `bey-orange` are **reserved for team identity and nothing else**.
- **Team colours: child index 0 `bey-purple`, index 1 `bey-orange`** — used for the top border, the bey SVG, the score and the `glow-*` on ScoreCard, ChildHomeSummary, BeyForge and RoleSelector. **Never give a child `bey-cyan`**: cyan means "this is the active control", so a cyan team reads as UI chrome rather than as that child. The app logo in the login page and nav stays cyan because it is branding, not a team.
- **On any filled accent (`bey-cyan`, `bey-lime`, `bey-yellow`, `bey-orange`, `bey-red`, `bey-blue`) use `text-bey-void`, never `text-white`.** White measures 2.60:1 on orange, 3.27 on red and 3.30 on blue — all below AA. The `*Dark` tokens are for bottom borders and rings only, not text.
- **The score is the hero of the child's home page.** `ChildHomeSummary` renders it at `text-6xl`/`text-7xl` in the team colour, above everything else; the encouragement line sits on the right of the name row (no avatar), not under the score. Then `ChildSummaryList` — one card of 48px rows (目標／收藏／本週／指南), each a one-line summary that expands in place, one open at a time; 目標 and 收藏 rows only appear when there is something in them. Last come `CollectionTiles`: two small entry cards (陀螺工房 → `bey`, 花園 → `garden`). The goal is that a phone shows the whole home page without scrolling — details live behind a tap or on their own page, never expanded by default.
- A collection tile gets a `border-bey-cyan` and a cyan dot **only when there is something to do** (a forge draw, the boss ready today, a watering available, a bloomed plant waiting for a new seed); otherwise it stays `bey-steel`/`bey-dim`. The parent home shows only the garden tile (stage only — watering is the children's job); parents reach the forge from the nav. This is a points app — when the forge button was the biggest, brightest thing on the page, the points read as a footnote.
- **`bey-lime` means 加分 and only 加分.** Forging, assembling and other game actions use `bey-cyan` (system action); a lime button that does not add points dilutes the one cue the children actually read.
- **An accent fill means "this one is active".** A control that is coloured whether or not it is selected (e.g. every sidebar icon on its own tile) kills the signal — colour the active one, keep the rest on `bey-paper`/`bey-dim`.
- **Score-item categories (學業／活動／日常) carry no hue.** They are labels, not status, so they use a neutral `bg-bey-paper text-bey-dim border-bey-steel` chip; tinting them collided with the team colours and with cyan-means-active.
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
- **Minimum tap target is 44px**, which is what `Button`'s base and every size (`sm` included) give you. Icon-only controls get `h-11 w-11`, not `h-7 w-7` — both children use this on a phone.
- **Every modal closes on Esc and on a backdrop click, and carries `role="dialog"` + `aria-modal`.** Follow the inline `useEffect` keydown pattern already in `GardenAlbum`/`BeyBossBattle`; do not add a half-dismissable dialog.
- Dividers on dark panels use `border-bey-steel`. A tinted border like `border-bey-cyanDark/10` is invisible here.
- **Three silhouettes, three meanings — never share one shape.** `components/ArenaMark.tsx` (a hexagonal arena badge, always cyan, never animated) is the brand: nav logo and login. `BeyTop variant="boss"` (a seven-spike star with one longer horn and a static eye) is the enemy. Plain `BeyTop` is a child's bey. When all three were the same ring, colour was the only thing telling them apart, and the nav logo read as a loading spinner.
- `components/BeyTop.tsx` is the original spinning-top SVG (concentric blade ring + gear + core). Pass `bladeId`/`ratchetId`/`bitId` to draw a specific build, or just `color` for a plain team-colored top. All Beyblade-style art must stay original — no official logos, characters, or product renders.
- **Rotation is an event, not decoration.** `BeyTop`'s `speed` defaults to `idle`: a top on display (nav logo, avatar, score card, the MY BEYS shelf, the boss on a weekday) stays still. `fast` is only for something happening right now — forging, assembling, a battle — and `launch` is the one-shot spin-up-and-settle used on entry screens (login, role picker). Six perpetually turning rings read as six loading spinners, and they drown out the animations that carry meaning.
- The blade ring is radially symmetric, so rotation would read as flicker rather than motion. Blade index 0 carries a white highlight overlay as the **marker blade** — keep it when editing `renderBlades`, or spinning tops go back to shimmering.
- Each `BeyTop` instance seeds its own random: spinning ones get a jittered duration and negative delay so they never phase-lock, and idle ones **with parts** rest at a random angle so a shelf of tops looks like separate objects. Tops without parts are brand marks and stay at angle 0.

### Collection modules

The app has two deliberately contrasting collection loops, both fed by parent-awarded positive points but with **separate, non-competing counters**, plus a weekend boss fight on top of the forge:

| | 家庭花園 (`familyGarden`) | 陀螺工房 (`beyForge`) |
|---|---|---|
| Currency | 陽光 — 20 pts per watering | 鋼料 — 25 pts per forge draw |
| Ownership | **Shared**, both children grow one plant | **Per-child**, own parts and beys |
| Loop | Water 5× → bloom → species enters 圖鑑 | Draw parts → assemble blade+ratchet+bit → bey |
| Logic | `services/gardenUtils.ts` | `services/beyUtils.ts` (mirrors the garden's shape) |

- A positive record feeds **both** counters in `App.tsx` `handleAddRecord` — they never consume each other.
- Rare parts drop from milestones, detected by **before/after comparison** inside `handleUpdateGoalRewards` / `handleUpdateStampCards` / `handleUpdateRewardCards`. `SettingsPanel` knows nothing about the forge; keep it that way.
- Part definitions live in `services/beyData.ts` (14 blades × 11 ratchets × 11 bits = 1694 combinations). Adding a part is a data-only change; the SVG is parameterized by `shape`/`bladeCount`/`ratchetStyle`/`bitStyle`.
- **Never build sibling-vs-sibling PvP.** The score items include 刻意吵架/搶玩具; a sanctioned win/lose between the brothers would manufacture conflict. Co-op against a system opponent is the accepted direction.

#### Weekly boss (`beyBoss`, `services/beyBossUtils.ts`)

- **Open on Saturday and Sunday only**, one attempt per day. Weekdays show the boss's stats and a countdown with the button locked, so the week is spent forging toward a known weakness.
- The week's boss is **derived from the date** (`getWeekKey` → `getBossForWeek`), since there is no server. 12 bosses, so a quarter before one repeats.
- Team stats are the **sum** of the lineup's beys, so a weak bey is still a net gain. Three rounds compare attack, then defense, then stamina; the higher value wins with a 20% upset chance; two round wins take the battle.
- Both children in the lineup → full boss; a win gives each of them the boss's **exclusive part** and clears the week. One child → boss stats ×0.6; a win gives a normal rare part but **deliberately does not clear the week**, otherwise whoever plays first burns the other's shot at the exclusive part.
- `BeyRarity` has a `BOSS` tier that `drawBeyPart` and `grantBeyPart` both exclude. A new boss part goes in `BOSS_PARTS` with a boss's `rewardPartId` pointing at it — never into the common or rare pools.
- Parents see the panel read-only; the boss is the children's business.
- The battle modal (`BeyBossBattle`) is portalled to `document.body` — inside `<main>`'s `z-10` it sat under the header and bottom nav. Its backdrop click closes only after the show is `done`, so a stray tap can't skip the once-a-day battle.
- The arena show is a top-down Canvas: `services/beyArenaScript.ts` is the timeline (pure data: enter, per-round impact time, HP), and `components/BeyArenaCanvas.tsx` is the **only** drawing layer. The round rows reveal at each round's `impactMs`, so text and collisions line up. Tops are `BeyTop` rendered to SVG images, so the arena shows the children's own builds and the boss keeps its silhouette (its eye is redrawn unrotated on top). Swapping to Phaser later means rewriting that one file behind the same props. Canvas colours are hex values from `index.html`, not Tailwind classes.

### Known parked code

`components/SecretMailbox.tsx` is intentionally unreferenced — the mailbox UI was hidden in `a9c9cae`, not abandoned. `AppState.messages` and the `onSendMessage` / `onMarkMessageRead` props exist to keep it restorable. **Do not delete it as dead code**; removing it means removing the field from the stored state too, which is a data-model decision.
- The boss renders with **its own `colorSet`**, not a team colour — otherwise it reads as one of the children's beys. It spins slowly on weekdays and fast only on battle days, so a locked card does not feel urgent.
- Rules live in `components/BeyRulesModal.tsx`, written for an elementary-school reader: short sentences, second person, concrete numbers, no jargon. The numbers are interpolated from the balance constants (`DEFAULT_SCRAP_PER_DRAW`, `DUPLICATE_SCRAP_REFUND`, `UPSET_CHANCE`, `WEAKENED_MULTIPLIER`), so retuning balance never leaves the copy lying.
- `Button` variants use an "AC squishy" style: `border-b-4` + `active:border-b-0 active:translate-y-[4px]`. Match this for custom buttons.
- Path alias `@` resolves to the **project root** (not `src/`), set in `vite.config.ts`.
- All entity IDs are `Date.now().toString()`; timestamps are Unix ms (`Date.now()`).
- **Never change `base` in `vite.config.ts` or `homepage` in `package.json`** unless the deploy target itself changes — they must match the GitHub Pages repo name or the deployed site breaks.
- **Never put secrets in tracked files** (CLAUDE.md, README, commit messages) — Firebase keys live in `.env.local`, which is gitignored.
