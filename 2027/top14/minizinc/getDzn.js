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
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.id_club);
      return squads;
    }, new Set([])),
  );
  let data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => getPlayerCost(p) * 10 || 0)}];
  value = [${players.map((p) => getPlayerScore(p) * 10 || 0)}];
  position = [${players.map((p) => p.id_position)}];
  sub = [${players.map((p) => getPlayerSub(p))}];
  squad = [${players.map((p) => p.id_club)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  budget = ${budget !== undefined ? budget * 10 : -1};
  `;

  if (mode === "costProgression") {
    data += `  costNew = [${players.map((p) => getPlayerCostNew(p) * 10 || 0)}];
  `;
  }

  return data;
};

export default getDzn;
