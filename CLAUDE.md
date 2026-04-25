# CLAUDE.md

## Code style

- **Top-down layout**: entry point (main, default export, handler) at the top; helpers at the bottom. Move helpers to a sibling `*Util.ts` / `utils.ts` once they grow or get reused.
- **Reuse helpers**: grep before writing a new name/normalization/formatting helper. E.g. `matchesName` in [app/2026/top14/statsUtil.ts](app/2026/top14/statsUtil.ts) is the shared player-name matcher.
