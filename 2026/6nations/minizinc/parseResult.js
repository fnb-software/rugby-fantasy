import players from "../data/players";
import { getPlayerCostForRound, getPlayerScoreForRound } from "./params";

const parseResult = ({ teamIds, captainId, supersubId, round }) => {
  const getPlayerScore = getPlayerScoreForRound(round);
  const getPlayerCost = getPlayerCostForRound(round);
  const team = teamIds.map((id) => players.find((p) => p.id === id));
  const captain = players.find((p) => p.id === captainId);
  const supersub = players.find((p) => p.id === supersubId);
  team.sort((p1, p2) => positionToInt(p1) - positionToInt(p2));
  team.splice(2, 0, team.splice(1, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  console.log({ team });
  const teamOutput = team.map((p, i) => {
    return `${i + 1}. ${p === supersub ? "(s)" : p === captain ? "(c)" : ""} ${
      p.nom
    }  (${p.trgclub} - ${getPlayerCost(p) || 0}) - ${
      getPlayerScore(p) * (p == supersub ? 3 : p === captain ? 2 : 1) ?? "N/A"
    }\\`;
  });

  const teamPoints = team.reduce(
    (total, p) => total + (getPlayerScore(p) || 0),
    getPlayerScore(captain) + 2 * getPlayerScore(supersub),
  );

  const teamCost = team.reduce((total, p) => total + getPlayerCost(p), 0);
  console.log(teamPoints);
  return {
    team,
    teamOutput,
    points: teamPoints,
    cost: teamCost,
  };
};

const positionToInt = (p) => {
  switch (p.position) {
    case 12:
      return 1;
    case 13:
      return 2;
    case 11:
      return 4;
    case 10:
      return 6;
    case 9:
      return 9;
    case 8:
      return 10;
    case 7:
      return 12;
    case 6:
      return 11;
  }
};

export default parseResult;
