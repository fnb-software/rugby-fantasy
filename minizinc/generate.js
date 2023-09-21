import fs from 'fs/promises';
import players from '../data/players';
import { ROUND, positionToInt } from './params';
const file = './minizinc/fantasy-data.mzn';

const MAX_TEAM = 3;

const main = async () => {
  await fs.rm(file);
  await fs.appendFile(
    file,
    `Players = {${players.map((p) => `'${p.id}'`)}};\n`
  );
  await fs.appendFile(
    file,
    `cost = [${players.map((p) => p.cost / 100000)}];\n`
  );
  await fs.appendFile(
    file,
    `value = [${players.map((p) => p.stats.scores?.[ROUND] || 0)}];\n`
  );
  await fs.appendFile(file, `position = [${players.map(positionToInt)}];\n`);
  await fs.appendFile(file, `squad = [${players.map((p) => p.squadId)}];\n`);
  const squadIds = Array.from(
    players.reduce((squads, p) => {
      squads.add(p.squadId);
      return squads;
    }, new Set([]))
  );
  await fs.appendFile(file, `squadIds = [${squadIds}];\n`);
  await fs.appendFile(file, `lbound = [${squadIds.map(() => 0)}];\n`);
  await fs.appendFile(file, `ubound = [${squadIds.map(() => MAX_TEAM)}];\n`);
};

main();
