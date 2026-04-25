import {
  getPlayerCostForRound,
  getPlayerScoreTotal,
  getPlayerSubTotal,
} from "./params";

const MAX_PER_TEAM = 4;

const getDzn = (allPlayers) => {
  const getPlayerScore = getPlayerScoreTotal();
  const getPlayerCost = getPlayerCostForRound(4);
  const getPlayerSub = getPlayerSubTotal();
  const players = allPlayers.filter(
    (p) => getPlayerScore(p) !== undefined && getPlayerScore(p) > 0,
  );
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.id_club);
      return squads;
    }, new Set([])),
  );
  const data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => getPlayerCost(p) * 10 || 0)}];
  value = [${players.map((p) => getPlayerScore(p) * 10 || 0)}];
  position = [${players.map((p) => p.id_position)}];
  sub_value = [${players.map((p) => getPlayerSub(p) * 10 || 0)}];
  squad = [${players.map((p) => p.id_club)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  `;
  console.log(data);
  return data;
};

export default getDzn;
