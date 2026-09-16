import {
  getPlayerCostForRound,
  getPlayerCostNewForRound,
  getPlayerScoreForRound,
  getPlayerSubForRound,
} from "./params";

const MAX_PER_TEAM = 4;

const getDzn = (allPlayers, round = 1, budget, mode = "points") => {
  const getPlayerScore = getPlayerScoreForRound(round);
  const getPlayerCost = getPlayerCostForRound(round);
  const getPlayerCostNew = getPlayerCostNewForRound(round);
  const getPlayerSub = getPlayerSubForRound(round);
  const players = allPlayers.filter(
    (p) => getPlayerScore(p) !== undefined && getPlayerScore(p) > 0,
  );

  // Add 18 empty players for optional slots only when budget is constrained
  let allPlayersWithEmpty = players;
  if (budget !== undefined) {
    // Each empty player has the position for its corresponding slot in the team
    // team_position from fantasy.mzn: [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7]
    const team_position = [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7];
    const emptyPlayers = [];
    for (let i = 1; i <= 18; i++) {
      const slotIndex = i - 1; // 0-based index
      const position = slotIndex < 15 ? team_position[slotIndex] : 10; // Subs get position 10 (any valid position)
      emptyPlayers.push({
        id: -i,
        id_club: -1,
        id_position: position,
        valeur: 0,
      });
    }
    allPlayersWithEmpty = [...players, ...emptyPlayers];
  }

  const squadIds = Array.from(
    allPlayersWithEmpty.reduce((squads, p) => {
      squads.add(p.id_club);
      return squads;
    }, new Set([])),
  );
  let data = `Players = {${allPlayersWithEmpty.map((p) => `'${p.id}'`)}};
  cost = [${allPlayersWithEmpty.map((p) => getPlayerCost(p) * 10 || 0)}];
  value = [${allPlayersWithEmpty.map((p) => getPlayerScore(p) * 10 || 0)}];
  position = [${allPlayersWithEmpty.map((p) => p.id_position)}];
  sub = [${allPlayersWithEmpty.map((p) => (p.id < 0 ? 1 : getPlayerSub(p)))}];
  squad = [${allPlayersWithEmpty.map((p) => p.id_club)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map((id) => (id === -1 ? 18 : MAX_PER_TEAM))}];
  budget = ${budget !== undefined ? budget * 10 : -1};
  `;

  if (mode === "costProgression") {
    data += `  costNew = [${allPlayersWithEmpty.map(
      (p) => getPlayerCostNew(p) * 10 || 0,
    )}];
  `;
  }

  return data;
};

export default getDzn;
