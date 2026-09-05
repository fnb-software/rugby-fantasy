// Returns a copy of `player` with `expectedStarterPoints` / `expectedSubPoints`
// adjusted for the solver: zeroed for explicit exclusions, and (when the
// teamsheet filter is on) reshaped so a player only contributes points where
// the teamsheet says they'll actually play.
//
// Subtle case: a teamsheet sub picked into a fantasy starter slot will only
// play real-life sub minutes, so we score them on sub stats rather than
// starter stats — otherwise the solver would either dismiss them (0) or
// overestimate them (full starter projection).
export const getSolverPlayer = ({
  player,
  hasTeamsheet,
  filterByTeamsheet,
  excludedAsStarter,
  excludedAsSub,
}: {
  player: {
    isTeamsheetStarter: boolean;
    isTeamsheetSub: boolean;
    expectedStarterPoints: number;
    expectedSubPoints: number;
    [k: string]: any;
  };
  hasTeamsheet: boolean;
  filterByTeamsheet: boolean;
  excludedAsStarter: boolean;
  excludedAsSub: boolean;
}) => {
  const teamsheetExcludesAsStarter =
    filterByTeamsheet && hasTeamsheet && !player.isTeamsheetStarter;
  const teamsheetExcludesAsSub =
    filterByTeamsheet && hasTeamsheet && !player.isTeamsheetSub;
  return {
    ...player,
    expectedStarterPoints: excludedAsStarter
      ? 0
      : teamsheetExcludesAsStarter
        ? player.isTeamsheetSub
          ? player.expectedSubPoints
          : 0
        : player.expectedStarterPoints,
    expectedSubPoints:
      excludedAsSub || teamsheetExcludesAsSub ? 0 : player.expectedSubPoints,
  };
};
