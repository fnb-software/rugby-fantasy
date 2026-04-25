# CLAUDE.md

## Code style

### File layout: top-down readability

When a file has a clear entry point (e.g. a `main`, a default export, a route
handler), put it **near the top** of the file and push helper/utility
functions **to the end**. A reader should see the meaningful logic first and
drop into the helpers only when they need the details.

If a file accumulates more than a handful of helpers, or the helpers are
reused across files, move them to a sibling `*Util.ts` / `utils.ts` module
rather than letting the host file grow.

Notes when applying this in TypeScript / ESM:

- `const` arrow functions are not hoisted. If `main` references helpers
  defined below it, that's fine **as long as** `main()` is invoked after the
  helpers' declarations have been evaluated (i.e. the helpers sit between the
  `main` definition and the `main()` call, or use `function` declarations
  which are hoisted).
- Don't duplicate a helper that already exists. Before writing a name-matching
  / normalization / formatting helper, grep for one — e.g. `matchesName` in
  [app/2026/top14/statsUtil.ts](app/2026/top14/statsUtil.ts) is the shared
  player-name matcher and should be reused, not re-implemented.
