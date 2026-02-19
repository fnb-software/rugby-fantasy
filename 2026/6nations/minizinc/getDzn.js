import allPlayers from "../data/players";
import {
  getPlayerCostForRound,
  getPlayerScoreForRound,
  getPlayerSubForRound,
} from "./params";

const MAX_PER_TEAM = 4;

const getDzn = (round = 1) => {
  const getPlayerScore = getPlayerScoreForRound(round);
  const getPlayerSub = getPlayerSubForRound(round);
  const players = allPlayers.filter(
    (p) => getPlayerScore(p) !== undefined && getPlayerScore(p) > 0,
  );
  //const players = players1.filter((p) => p.squadId !== 14); // No scots
  //const players = players1.filter((p) => p.cost <= 7000000); // No star
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.id_club);
      return squads;
    }, new Set([])),
  );
  const data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => getPlayerCostForRound(p) * 10 || 0)}];
  value = [${players.map((p) => getPlayerScore(p) || 0)}];
  position = [${players.map((p) => p.id_position)}];
  sub = [${players.map((p) => getPlayerSub(p))}];
  squad = [${players.map((p) => p.id_club)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  `;
  console.log(data);
  return data;
};

export default getDzn;
