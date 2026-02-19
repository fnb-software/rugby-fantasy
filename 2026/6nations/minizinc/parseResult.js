import round1 from "../data/round1";
import squads from "../data/squads";

const parseResult = ({ teamIds, captainId, round }) => {
  const allPlayers = round1.reduce((players, { match }) => {
    const squadDom = squads.find((squad) => squad.name === match.clubdom);
    const squadExt = squads.find((squad) => squad.name === match.clubext);
    return players.concat(
      match.joueursdom.map((joueur) => ({
        ...joueur,
        squad: squadDom,
      })),
      match.joueursext.map((joueur) => ({
        ...joueur,
        squad: squadExt,
      })),
    );
  }, []);
  console.log({ teamIds });
  const team = teamIds.map((id) =>
    allPlayers.find((p) => parseInt(p.id) === id),
  );
  const captain = allPlayers.find((p) => parseInt(p.id) === captainId);
  team.sort((p1, p2) => positionToInt(p1) - positionToInt(p2));
  team.splice(2, 0, team.splice(1, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  console.log({ team });
  const teamOutput = team.map((p, i) => {
    return `${i + 1}. ${p === captain ? "(c)" : ""} ${p.nom}  (${
      p.squad.abbreviation
    } - ${(p.cost || 0) / 1000000}) - ${p.points ?? "N/A"}\\`;
  });

  const teamPoints = team.reduce(
    (total, p) => total + (p.points || 0),
    captain.points,
  );

  const teamCost = team.reduce((total, p) => total + p.cost, 0) / 1000000;

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
