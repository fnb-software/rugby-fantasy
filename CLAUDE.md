# CLAUDE.md

## Code style

- **Top-down layout**: entry point (main, default export, handler) at the top; helpers at the bottom. Move helpers to a sibling `*Util.ts` / `utils.ts` once they grow or get reused.
- **Reuse helpers**: grep before writing a new name/normalization/formatting helper. E.g. `matchesName` in [app/2026/top14/statsUtil.ts](app/2026/top14/statsUtil.ts) is the shared player-name matcher.

## Tests

- Runner: Node's built-in `node:test` + `node:assert/strict`, executed via `npx tsx --test <path>`. There is no `npm test` script. Tests live next to source as `*.test.ts` (e.g. [app/2026/top14/statsUtil.test.ts](app/2026/top14/statsUtil.test.ts), [2026/top14/minizinc/getDznFromStats.test.ts](2026/top14/minizinc/getDznFromStats.test.ts), [app/2026/top14/team-builder/getSolverPlayer.test.ts](app/2026/top14/team-builder/getSolverPlayer.test.ts)).
- Worth a test: non-obvious invariants that a future edit could silently break — solver-pool shape, scoring/branching matrices, name/normalization helpers. Don't test: trivial getters, React rendering, anything that's just calling another tested function.
- Prefer extracting a pure function from a component over mocking the component — see [app/2026/top14/team-builder/getSolverPlayer.ts](app/2026/top14/team-builder/getSolverPlayer.ts) carved out of [TeamBuilder.tsx](app/2026/top14/team-builder/TeamBuilder.tsx).
- Style: `describe`/`it`, one assertion focus per `it`, a small `makeX(overrides)` factory at the top instead of repeating fixtures. Name the test after the behavior, not the function ("teamsheet sub is scored on sub points when used as a starter").
- Importing `.js` ESM from a `.ts` test works because `tsconfig` has `allowJs` + `moduleResolution: bundler` — keep the `.js` extension in the import specifier.
