// Picks the projection that should be used for a player sitting in a fantasy
// starter slot. A teamsheet sub will only play real-life sub minutes, so when
// the teamsheet filter is engaged we score them on their sub stats rather than
// their historical starter average.
export const getEffectiveStarterPoints = ({
  filterByTeamsheet,
  hasTeamsheet,
  isTeamsheetStarter,
  isTeamsheetSub,
  expectedStarterPoints,
  expectedSubPoints,
}: {
  filterByTeamsheet: boolean;
  hasTeamsheet: boolean;
  isTeamsheetStarter: boolean;
  isTeamsheetSub: boolean;
  expectedStarterPoints: number;
  expectedSubPoints: number;
}): number => {
  const useSubAsStarter =
    filterByTeamsheet && hasTeamsheet && isTeamsheetSub && !isTeamsheetStarter;
  return useSubAsStarter ? expectedSubPoints : expectedStarterPoints;
};
