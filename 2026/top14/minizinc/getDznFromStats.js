const MAX_PER_TEAM = 10;

// From team_position = [5,6,7,7,6,8,9,10,10,10,11,11,12,13,12] in fantasy_total.mzn
const REQUIRED_POSITIONS = { 5: 1, 6: 2, 7: 2, 8: 1, 9: 1, 10: 3, 11: 2, 12: 2, 13: 1 };
// Mirrors max_per_position in fantasy_total.mzn (across the full 18-player team).
const MAX_PER_POSITION = { 5: 2, 6: 4, 7: 4, 8: 2, 9: 2, 10: 6, 11: 4, 12: 4, 13: 2 };
const POSITION_IDS = [5, 6, 7, 8, 9, 10, 11, 12, 13];
// 15 starters + supersub (slot 16) + 2 subs (slots 17-18)
const TEAM_SIZE = 18;

const getDznFromStats = ({
  players: allPlayers,
  lockedPlayers,
  maxCost,
  reservePlayers = [],
}) => {
  const getPlayerScore = (p) => (p.expectedStarterPoints || 0).toFixed(1);
  const getPlayerCost = (p) => p.valeur;
  const getPlayerSub = (p) => (p.expectedSubPoints || 0).toFixed(1);
  const lockedPlayerIds = new Set(lockedPlayers.map(({ player }) => player.id));
  const reservePlayerIds = new Set(reservePlayers.map((p) => p.id));
  const players = allPlayers.filter(
    (p) =>
      !reservePlayerIds.has(p.id) &&
      (lockedPlayerIds.has(p.id) ||
        (getPlayerScore(p) !== undefined && getPlayerScore(p) > 0) ||
        (getPlayerSub(p) !== undefined && getPlayerSub(p) > 0)),
  );

  const reserveCountByClub = {};
  const reserveCountByPosition = {};
  for (const p of reservePlayers) {
    reserveCountByClub[p.id_club] = (reserveCountByClub[p.id_club] || 0) + 1;
    reserveCountByPosition[p.id_position] =
      (reserveCountByPosition[p.id_position] || 0) + 1;
  }
  const positionCap = (pos) =>
    Math.max(0, (MAX_PER_POSITION[pos] || 0) - (reserveCountByPosition[pos] || 0));
  const adjustedMaxPerPosition = POSITION_IDS.map((pos) => positionCap(pos));

  const includedIds = new Set(players.map((p) => p.id));
  const positionCounts = {};
  for (const p of players) {
    positionCounts[p.id_position] = (positionCounts[p.id_position] || 0) + 1;
  }
  let fakeId = -1;
  let fakeClubId = -1;
  for (const [pos, required] of Object.entries(REQUIRED_POSITIONS)) {
    const posInt = parseInt(pos);
    const count = positionCounts[posInt] || 0;
    if (count < required) {
      // First, try to use real players with 0 score for this position
      const zeroCandidates = allPlayers.filter(
        (p) =>
          p.id_position === posInt &&
          !includedIds.has(p.id) &&
          !reservePlayerIds.has(p.id),
      );
      const toAdd = zeroCandidates.slice(0, required - count);
      toAdd.forEach((p) => {
        players.push(p);
        includedIds.add(p.id);
        positionCounts[posInt] = (positionCounts[posInt] || 0) + 1;
      });
      // If still not enough, add fake fillers
      const remaining = required - (positionCounts[posInt] || 0);
      if (remaining > 0) {
        console.warn(
          `Position ${pos}: only ${positionCounts[posInt]}/${required} real players, adding ${remaining} filler(s)`,
        );
        for (let i = 0; i < remaining; i++) {
          players.push({
            id: fakeId--,
            id_position: posInt,
            id_club: fakeClubId--,
            valeur: 0,
            expectedStarterPoints: 0,
            expectedSubPoints: 0,
          });
          positionCounts[posInt] = (positionCounts[posInt] || 0) + 1;
        }
      }
    }
  }

  // Ensure enough players for the sub slots (no position constraint), but
  // respect each position's cap — when the pool is exactly TEAM_SIZE the solver
  // has to pick every candidate, so an over-capped pool is infeasible.
  const subShortfall = TEAM_SIZE - players.length;
  if (subShortfall > 0) {
    const zeroCandidates = allPlayers.filter(
      (p) => !includedIds.has(p.id) && !reservePlayerIds.has(p.id),
    );
    for (const p of zeroCandidates) {
      if (players.length >= TEAM_SIZE) break;
      if ((positionCounts[p.id_position] || 0) >= positionCap(p.id_position))
        continue;
      players.push(p);
      includedIds.add(p.id);
      positionCounts[p.id_position] = (positionCounts[p.id_position] || 0) + 1;
    }
    while (players.length < TEAM_SIZE) {
      let bestPos = null;
      let bestRemaining = 0;
      for (const pos of POSITION_IDS) {
        const remaining = positionCap(pos) - (positionCounts[pos] || 0);
        if (remaining > bestRemaining) {
          bestRemaining = remaining;
          bestPos = pos;
        }
      }
      if (bestPos === null) {
        console.warn(
          `Cannot reach ${TEAM_SIZE} players: all positions at cap (likely too many reserves)`,
        );
        break;
      }
      console.warn(`Adding sub filler at position ${bestPos}`);
      players.push({
        id: fakeId--,
        id_position: bestPos,
        id_club: fakeClubId--,
        valeur: 0,
        expectedStarterPoints: 0,
        expectedSubPoints: 0,
      });
      positionCounts[bestPos] = (positionCounts[bestPos] || 0) + 1;
    }
  }
  const squadIdSet = players.reduce((squads, p) => {
    squads.add(p.id_club);
    return squads;
  }, new Set([]));
  for (const clubId of Object.keys(reserveCountByClub)) {
    squadIdSet.add(Number(clubId));
  }
  const squadIds = Array.from(squadIdSet);
  const team = Array.from({ length: 18 }).map(() => `_`);
  lockedPlayers.forEach(
    ({ player, index }) => (team[index] = `'${player.id}'`),
  );
  const data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => getPlayerCost(p) * 10 || 0)}];
  value = [${players.map((p) => getPlayerScore(p) * 10 || 0)}];
  position = [${players.map((p) => p.id_position)}];
  sub_value = [${players.map((p) => getPlayerSub(p) * 10 || 0)}];
  squad = [${players.map((p) => p.id_club)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map((id) => Math.max(0, MAX_PER_TEAM - (reserveCountByClub[id] || 0)))}];
  max_per_position = array1d(5..13, [${adjustedMaxPerPosition}]);
  max_cost = ${maxCost != null ? Math.round(maxCost * 10) : 999999};
  ${lockedPlayers.length ? `team = [${team.join(",")}];` : ``}
  `;
  console.log(data);
  return data;
};

export default getDznFromStats;
