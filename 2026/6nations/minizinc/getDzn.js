import squads from "../data/squads";
import round1 from "../data/round1";

const MAX_PER_TEAM = 4;

const getDzn = (round = 1) => {
  const allPlayers = round1.reduce((players, { match }) => {
    const squadDom = squads.find((squad) => squad.name === match.clubdom);
    const squadExt = squads.find((squad) => squad.name === match.clubext);
    return players.concat(
      match.joueursdom.map((joueur) => ({
        ...joueur,
        squadId: squadDom.id,
      })),
      match.joueursext.map((joueur) => ({
        ...joueur,
        squadId: squadExt.id,
      })),
    );
  }, []);
  const players = allPlayers.filter((p) => p.points !== undefined);
  //const players = players1.filter((p) => p.squadId !== 14); // No scots
  //const players = players1.filter((p) => p.cost <= 7000000); // No star
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.squadId);
      return squads;
    }, new Set([])),
  );
  const data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => p.cost / 100000 || 0)}];
  value = [${players.map((p) => p.points || 0)}];
  position = [${players.map((p) => p.position)}];
  squad = [${players.map((p) => p.squadId)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  `;
  return data;
};

export default getDzn;
