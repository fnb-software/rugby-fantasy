import players from '../data/players';
import { ROUND, positionToInt } from './params';
const file = './minizinc/fantasy-data.mzn';

const MAX_PER_TEAM = 3;

const getDzn = () => {
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.squadId);
      return squads;
    }, new Set([]))
  );
  const data = `Players = {${players.map((p) => `'${p.id}'`)}};
  cost = [${players.map((p) => p.cost / 100000)}];
  value = [${players.map((p) => p.stats.scores?.[ROUND] || 0)}];
  position = [${players.map(positionToInt)}];
  squad = [${players.map((p) => p.squadId)}];
  squadIds = [${squadIds}];
  lbound = [${squadIds.map(() => 0)}];
  ubound = [${squadIds.map(() => MAX_PER_TEAM)}];
  `;
  return data;
};

export default getDzn;
