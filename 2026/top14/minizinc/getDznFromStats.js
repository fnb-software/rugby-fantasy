const MAX_PER_TEAM = 4;

const getDznFromStats = ({ players: allPlayers, lockedPlayers, maxCost }) => {
  const getPlayerScore = (p) => (p.expectedStarterPoints || 0).toFixed(1);
  const getPlayerCost = (p) => p.valeur;
  const getPlayerSub = (p) => (p.expectedSubPoints || 0).toFixed(1);
  const lockedPlayerIds = new Set(lockedPlayers.map(({ player }) => player.id));
  const players = allPlayers.filter(
    (p) =>
      lockedPlayerIds.has(p.id) ||
      (getPlayerScore(p) !== undefined && getPlayerScore(p) > 0) ||
      (getPlayerSub(p) !== undefined && getPlayerSub(p) > 0),
  );
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.id_club);
      return squads;
    }, new Set([])),
  );
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
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  max_cost = ${maxCost != null ? Math.round(maxCost * 10) : 999999};
  ${lockedPlayers.length ? `team = [${team.join(",")}];` : ``}
  `;
  console.log(data);
  return data;
};

export default getDznFromStats;
