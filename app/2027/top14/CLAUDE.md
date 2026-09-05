Always maintain this documentation up-to-date

# app/2027/top14

Next.js routes and UI for the Top 14 fantasy app. Pulls per-user player data via `getPlayers` ([app/lib/players](../../lib/players.ts)) and global admin data (current round, best teams, teamsheets) via `getAdminData` ([app/lib/adminData](../../lib/adminData.ts)). The MiniZinc solvers run in the browser.

Sibling folder [2027/top14/minizinc/](../../../2027/top14/minizinc/) holds the model files (`fantasy.mzn`, `fantasy_total.mzn`), DZN builders (`getDzn`, `getDznFromStats`, `getDznTotal`), parsing (`parseResult`), and shared scoring helpers (`params.ts`).

## Routes

- [page.tsx](page.tsx) — `/2027/top14`. Per-round "team of the round" tables (full rules + no-club-limit + B no-club-limit) plus a tournament-team section. Reads `teams` / `teamsNoClubLimit` / `teamsSecondNoClubLimit` and `currentRound` from `getAdminData()`; hands `defaultRound` to the round-tab switcher.
- [team-builder/page.tsx](team-builder/page.tsx) — `/2027/top14/team-builder`. Manual roster-building UI: expected starter/sub points charts, 21-slot roster with locks/budget/captain, auto-solve via `fantasy_total.mzn` + `getDznFromStats`, filters (team/position/owner/teamsheet), expected-results editor. Loads the admin's per-round teamsheets and the user's saved expected-results.
- [solver/page.tsx](solver/page.tsx) — `/2027/top14/solver`. Single-round solver using `fantasy.mzn` + `getDzn`. Round comes from `currentRound` in the admin blob (passed as `startRound`/`endRound` to `Solve.tsx`). Admins see a per-round "Save as best team" panel that POSTs to `/api/admin/best-team`.
- [solver-tournament/page.tsx](solver-tournament/page.tsx) — `/2027/top14/solver-tournament`. Whole-tournament solver using `fantasy_total.mzn` + `getDznTotal`.
- [admin/page.tsx](admin/page.tsx) — `/2027/top14/admin`. Admin-only (`session.user.role === "admin"`). Hosts the current-round editor and the AI-assisted teamsheets editor.
- [layout.tsx](layout.tsx) + [NavBarRenderer.tsx](NavBarRenderer.tsx) — shared chrome. The top-14 navbar shows an `admin` link when the session role is admin.

## Components

- [TeamsOfTheRound.tsx](TeamsOfTheRound.tsx) — round-tab switcher; takes a `defaultRound` so `/2027/top14` opens on the admin's current round. Renders the per-round team passed in `teams[round-1]`.
- [Team.tsx](Team.tsx) — per-round team table (15 starters + supersub at index 15 + 2 subs at 16–17). Uses `getPlayerScoreForRound` / `getPlayerCostForRound` from `minizinc/params`. Score weights: starters ×2, captain ×4, supersub ×6, regular subs ×1. The two "regular subs" (indices 16–17) deduct half their score from the team total.
- [TournamentTeam.tsx](TournamentTeam.tsx) — same layout but uses `getPlayerScoreTotal` and accounts for the supersub's "as starter" portion across the season.
- [team-builder/TeamBuilder.tsx](team-builder/TeamBuilder.tsx) — the team-building view. Two stacked bar charts (starters / subs) ranked by expected points; popover for add-to-team / exclude; team-results editor; embedded [SelectedPlayers.tsx](SelectedPlayers.tsx) and [WantedPlayers.tsx](WantedPlayers.tsx). Calls [solve.ts](solve.ts) with `getDznFromStats`. Receives `currentRound`, `teamsheets` (admin blob, current round only), and `initialResultsForRound` (the user's saved expected results for that round) as props.
- [SelectedPlayers.tsx](SelectedPlayers.tsx) — 21-slot roster (15 starters, 1 supersub, 2 subs, 3 reserves at 18–20). Lock players, lock captain, set budget, trigger solve. Reserves aren't fed to the solver — their cost is subtracted from the budget, and their positions/clubs are subtracted from the per-position and per-club caps so the solver only picks what fits the remaining squad capacity.
- [WantedPlayers.tsx](WantedPlayers.tsx) — list of players with active offers (`offres_encours`).
- [TeamResultsEditor.tsx](TeamResultsEditor.tsx) — inline editor for `teamResultsExpected` per-club score margin (used to project team points when no actual round result is available). No defaults — empty entries read as 0 via `?? 0` at the call site. Persisted explicitly via the Save button (POSTs to `/api/expected-results`, scoped per user per round).
- [admin/CurrentRoundEditor.tsx](admin/CurrentRoundEditor.tsx) — single-input form for the admin's `currentRound`; POSTs to `/api/admin/round`.
- [admin/TeamsheetsEditor.tsx](admin/TeamsheetsEditor.tsx) — admin tool with a single textarea: if the first line starts with `http(s)://` the whole content is split into URLs (one per line), otherwise the entire textarea is treated as raw pasted lineup content (useful when a source is paywalled or won't fetch). Calls `/api/admin/teamsheets/extract` to parse "compositions probables", lets the admin edit/add/remove names with live `matchesName` validation against the players DB (unmatched names highlighted red), then saves via `/api/admin/teamsheets`. Per-name `uncertain` toggle for "ou X" alternatives.

## Data files

- [bestTeams.ts](bestTeams.ts) — `TEAMS[i]` is the optimal team for round i+1 under full rules. Used as the **round-1 seed** of the admin blob; at runtime `getAdminData()` is the source of truth (admins overwrite via the solver page).
- [bestTeamsNoClubLimit.ts](bestTeamsNoClubLimit.ts) / [bestSecondTeamsNoClubLimits.ts](bestSecondTeamsNoClubLimits.ts) — same shape and same seeding rule, no-club-limit variants.
- [teamsheets.ts](teamsheets.ts) — `Teamsheet` / `TeamsheetEntry` types and helpers (`entryName`, `entryUncertain`, `u()`). `TEAMSHEETS` is the **round-1 seed** of `adminData.teamsheets["1"]`. From round 2 onwards, teamsheets live in the admin blob and are edited via [admin/TeamsheetsEditor.tsx](admin/TeamsheetsEditor.tsx). "ou X" alternatives use `uncertain: true` so both candidates score and the UI flags them.

## Helpers

- [statsUtil.ts](statsUtil.ts) — `matchesName` (canonical player-name matcher, see also project-root CLAUDE.md), `POSITION_LABELS`, `getRoundPlayerOnlyPoints` (sums per-stat points for one round), `getStatPointsMultiplier` (forward/back-aware scoring table), `getTeamPoints` (home/away result + score margin). Tests in [statsUtil.test.ts](statsUtil.test.ts).
- [slots.ts](slots.ts) — `POSITIONS` (the 15-starter formation) and `assignPlayerToSlot` (auto-fills the first matching empty slot, falls back to any empty starter slot).
- [solve.ts](solve.ts) — wraps `MiniZinc.init` (singleton) + `model.solve` with the `highs` solver, 3-min limit. Returns `{ teamIds, captainId }`.

## Server libs and APIs (siblings)

- [app/lib/adminData.ts](../../lib/adminData.ts) — global admin blob (`top14-2027/admin.json`) carrying `currentRound`, three best-teams arrays, and `teamsheets: Record<roundString, Record<club, Teamsheet>>`. `getAdminData()` (cached + tag-revalidated) and `setAdminData(updater)`.
- [app/lib/adminAuth.ts](../../lib/adminAuth.ts) — `requireAdmin()` guard returning 401/403.
- [app/lib/players.ts](../../lib/players.ts) — per-user player snapshot at `players/{BLOB_PREFIX}{userId}.json`. `getPlayers(userId)` is React-`cache()`-deduped per request (no `unstable_cache` — the snapshot is too large for the data cache). Writes go via the extension hitting `/api/players/upload-token` → `@vercel/blob/client.put` directly to Blob, which bypasses Vercel's 4.5MB function payload limit. The whole app uses a single **public** Vercel Blob store (`BLOB_READ_WRITE_TOKEN`) — required because client-direct uploads only work against public stores.
- [app/lib/expectedResults.ts](../../lib/expectedResults.ts) — per-user blob `expected-results/{BLOB_PREFIX}{userId}.json` storing `Record<round, Record<club, margin>>`.
- [app/lib/teamsheetsExtract.ts](../../lib/teamsheetsExtract.ts) — server-only LLM wrapper. Takes `urls` and/or `texts`: fetches each URL and strips HTML, appends pasted texts as additional sources, then walks a provider fallback chain (Groq Llama 3.3 70B → Cerebras Qwen-3 235B → Cerebras Llama 3.1 8B → OpenRouter free models) with `response_format: json_object` and `max_tokens: 8192` (Groq overrides to 3000 to stay under its 12K TPM free-tier cap). Each provider may declare a `maxPromptBytes` and is skipped (emitting a `skip` attempt phase) when the prompt exceeds it — Groq is capped at ~32K bytes for the same TPM reason. Each attempt is reported through an optional `onAttempt` callback (used by the API route to stream live progress) with phases `start` / `success` / `fail` / `skip`; `finish_reason === "length"` and unparseable JSON are treated as provider failures so the chain falls through (Llama 3.1 8B in particular has a low free-tier output cap and silently truncates on full-round extractions). Returns `{ teamsheets, fetchErrors }`. Requires at least one of `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` — providers with no key are skipped.
- API routes:
  - `POST /api/admin/round` — set current round.
  - `POST /api/admin/best-team` — write one round's slot for a given variant.
  - `POST /api/admin/teamsheets` — replace one round's teamsheets map.
  - `POST /api/admin/teamsheets/extract` — AI-extract from a list of URLs and/or pasted text snippets (`{ urls?, texts?, round }`, at least one of `urls`/`texts` non-empty). Streams NDJSON: `{type:"attempt", phase: "start"|"success"|"fail"|"skip", provider, reason?}` events as the LLM provider chain walks each model (`skip` fires when a provider's `maxPromptBytes` is exceeded — typical for Groq on full-page extractions), then a final `{type:"done", teamsheets, fetchErrors}` (entries enriched with a `matched` flag computed via `matchesName`) or `{type:"error", message}`. After LLM extraction, players are re-assigned to the correct club using the user's roster (per `players[].club`): if a name doesn't match the LLM-assigned club's roster but uniquely matches another extracted club's roster, it is moved there (preserving starter/sub role and order). Fixes club-mixing on sources like allrugby that confuse the LLM about who plays for whom.
  - `POST /api/expected-results` — write the signed-in user's saved expected-results for one round.
  - `POST /api/players` — replace the signed-in user's player snapshot (used by the browser extension).

## Conventions

- Roster ordering everywhere: indices 0–14 starters, 15 supersub `(S)`, 16–17 subs `(s)`, 18–20 reserves `(R)` (only in [SelectedPlayers.tsx](SelectedPlayers.tsx)).
- Scores from the API are stored ×20; divide by 20 (or 40 for per-slot weighted lines) when displaying.
- Position keys are the raw API strings (`lib_arriere`, `lib_34aile`, …); use `POSITION_LABELS` for display.
- New name-matching logic belongs in `matchesName`, not ad-hoc per call site.
- Round numbers are 1-based at the storage / UI / API boundary; 0-based only inside the solver internals (`getDzn`, `parseResult`, `getPlayerScoreForRound`). Convert at the boundary, e.g. `solver/page.tsx` passes `currentRound - 1` into `Solve`.
- All blob ops use `access: "public"` (the store is public; the players blob in particular has to be public so the extension can client-upload).
- Don't pass `useCache: false` on public-blob reads — the SDK rewrites the URL to `?cache=0`, which the public CDN rejects with 400. Public blobs are served via the CDN and may briefly serve stale content (~seconds) after a `put` with `allowOverwrite: true`; that's acceptable for our admin workflow.
