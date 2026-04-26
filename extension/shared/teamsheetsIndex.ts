import { TEAMSHEETS, entryName } from "../../app/2026/top14/teamsheets";

export const buildTeamsheetIndex = (): Map<string, string[]> | null => {
  const total = Object.values(TEAMSHEETS).reduce(
    (s, ts) => s + ts.starters.length + ts.subs.length,
    0,
  );
  if (total === 0) return null;
  const byClub = new Map<string, string[]>();
  for (const [club, ts] of Object.entries(TEAMSHEETS)) {
    byClub.set(club, [...ts.starters, ...ts.subs].map(entryName));
  }
  return byClub;
};
