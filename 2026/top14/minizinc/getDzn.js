import allPlayers from "../data/players";
import {
  getPlayerCostForRound,
  getPlayerScoreForRound,
  getPlayerSubForRound,
} from "./params";

const MAX_PER_TEAM = 40;

const getDzn = (round = 1) => {
  const getPlayerScore = getPlayerScoreForRound(round);
  const getPlayerCost = getPlayerCostForRound(round);
  const getPlayerSub = getPlayerSubForRound(round);
  const players = allPlayers.filter(
    (p) => getPlayerScore(p) !== undefined && getPlayerScore(p) > 0,
  );
  // .filter((p) => p.proprietaire.id === "" && !p.offres_encours);
  // .filter(
  //   (p) =>
  //     (p.proprietaire.id === "" || p.proprietaire.nom === "d0m3") &&
  //     (!p.offres_encours || p.offres_encours_parmoi),
  // );
  //const players = players1.filter((p) => p.squadId !== 14); // No scots
  //const players = players1.filter((p) => p.cost <= 7000000); // No star
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
