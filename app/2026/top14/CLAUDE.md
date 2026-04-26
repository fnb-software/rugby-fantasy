Always maintain this documentation up-to-date

# app/2026/top14

Next.js routes and UI for the Top 14 fantasy app. Pulls player data via `getPlayers` (server action under [app/lib/players](../../lib/players)) and runs the MiniZinc-based solver in the browser.

Sibling folder [2026/top14/minizinc/](../../../2026/top14/minizinc/) holds the model files (`fantasy.mzn`, `fantasy_total.mzn`), DZN builders (`getDzn`, `getDznFromStats`, `getDznTotal`), parsing (`parseResult`), and shared scoring helpers (`params.ts`).

## Routes

- [page.tsx](page.tsx) — `/2026/top14`. Per-round "team of the round" tables (full rules + no-club-limit + B no-club-limit) plus a tournament-team section. Hardcoded TEAM_IDS constants live next to the page.
- [team-builder/page.tsx](team-builder/page.tsx) — `/2026/top14/team-builder`. Manual roster-building UI: expected starter/sub points charts, 21-slot roster with locks/budget/captain, auto-solve via `fantasy_total.mzn` + `getDznFromStats`, filters (team/position/owner/teamsheet), expected-results editor.
- [solver/page.tsx](solver/page.tsx) — `/2026/top14/solver`. Single-round solver using `fantasy.mzn` + `getDzn`. Round window set by `START_ROUND`/`END_ROUND` constants in [solver/Solve.tsx](solver/Solve.tsx).
- [solver-tournament/page.tsx](solver-tournament/page.tsx) — `/2026/top14/solver-tournament`. Whole-tournament solver using `fantasy_total.mzn` + `getDznTotal`.
- [layout.tsx](layout.tsx) + [NavBarRenderer.tsx](NavBarRenderer.tsx) — shared chrome.

## Components

- [TeamsOfTheRound.tsx](TeamsOfTheRound.tsx) — round-tab switcher; renders the per-round team passed in `teams[round-1]`.
- [Team.tsx](Team.tsx) — per-round team table (15 starters + supersub at index 15 + 2 subs at 16–17). Uses `getPlayerScoreForRound` / `getPlayerCostForRound` from `minizinc/params`. Score weights: starters ×2, captain ×4, supersub ×6, regular subs ×1. The two "regular subs" (indices 16–17) deduct half their score from the team total.
- [TournamentTeam.tsx](TournamentTeam.tsx) — same layout but uses `getPlayerScoreTotal` and accounts for the supersub's "as starter" portion across the season.
- [team-builder/TeamBuilder.tsx](team-builder/TeamBuilder.tsx) — the team-building view (route `/2026/top14/team-builder`). Two stacked bar charts (starters / subs) ranked by expected points; popover for add-to-team / exclude; team-results editor; embedded [SelectedPlayers.tsx](SelectedPlayers.tsx) and [WantedPlayers.tsx](WantedPlayers.tsx). Calls [solve.ts](solve.ts) with `getDznFromStats` to optimize the user's team.
- [SelectedPlayers.tsx](SelectedPlayers.tsx) — 21-slot roster (15 starters, 1 supersub, 2 subs, 3 reserves at 18–20). Lock players, lock captain, set budget, trigger solve. Reserves aren't fed to the solver — their cost is subtracted from the budget.
- [WantedPlayers.tsx](WantedPlayers.tsx) — list of players with active offers (`offres_encours`).
- [TeamResultsEditor.tsx](TeamResultsEditor.tsx) — inline editor for `teamResultsExpected` per-club score margin (used to project team points when no actual round result is available). Defaults from `TEAM_RESULTS_EXPECTED` in [statsUtil.ts](statsUtil.ts).

## Data files (handwritten)

- [bestTeams.ts](bestTeams.ts) — TEAMS[i] is the optimal team for round i+1 under full rules.
- [bestTeamsNoClubLimit.ts](bestTeamsNoClubLimit.ts) / [bestSecondTeamsNoClubLimits.ts](bestSecondTeamsNoClubLimits.ts) — same shape, no-club-limit variants.
- [teamsheets.ts](teamsheets.ts) — per-club starters/subs for the current round. Use `entryName` / `entryUncertain` helpers; mark "ou X" alternatives with `u("X")` so both candidates score and the UI flags them.

## Helpers

- [statsUtil.ts](statsUtil.ts) — `matchesName` (canonical player-name matcher, see also project-root CLAUDE.md), `POSITION_LABELS`, `getRoundPlayerOnlyPoints` (sums per-stat points for one round), `getStatPointsMultiplier` (forward/back-aware scoring table), `getTeamPoints` (home/away result + score margin), `TEAM_RESULTS_EXPECTED` defaults. Tests in [statsUtil.test.ts](statsUtil.test.ts).
- [slots.ts](slots.ts) — `POSITIONS` (the 15-starter formation) and `assignPlayerToSlot` (auto-fills the first matching empty slot, falls back to any empty starter slot).
- [solve.ts](solve.ts) — wraps `MiniZinc.init` (singleton) + `model.solve` with the `highs` solver, 3-min limit. Returns `{ teamIds, captainId }`.

## Conventions

- Roster ordering everywhere: indices 0–14 starters, 15 supersub `(S)`, 16–17 subs `(s)`, 18–20 reserves `(R)` (only in [SelectedPlayers.tsx](SelectedPlayers.tsx)).
- Scores from the API are stored ×20; divide by 20 (or 40 for per-slot weighted lines) when displaying.
- Position keys are the raw API strings (`lib_arriere`, `lib_34aile`, …); use `POSITION_LABELS` for display.
- New name-matching logic belongs in `matchesName`, not ad-hoc per call site.
