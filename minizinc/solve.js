import fs from 'fs/promises';
import * as MiniZinc from 'minizinc';
import path from 'path';
import getDzn from './getDzn';
import parseResult from './parseResult';

const ROUND = 5;

const main = async () => {
  try {
    MiniZinc.init({
      minizinc: 'minizinc',
    });

    //const roundsIterator = Array.from(new Array(5));

    //const rounds = await Promise.all(
    //  roundsIterator.map(async (_, i) => {
    const model = new MiniZinc.Model();
    const modelString = await fs.readFile(
      path.resolve('./minizinc/fantasy.mzn')
    );
    model.addString(modelString);
    model.addDznString(getDzn(ROUND));

    const solve = model.solve({
      options: {
        solver: 'highs',
        'time-limit': 3 * 60000,
        statistics: true,
      },
    });
    setInterval(() => {
      if (solve.isRunning()) {
        console.log('Still running');
      }
    }, 5000);

    const result = await solve;
    console.log(result.statistics);
    if (!result.solution) {
      process.exit(0);
      return;
    }
    const resultData = result.solution.output.json;
    console.log(resultData);
    const teamIds = resultData.team.map(({ e }) => Number(e));
    const captainId = Number(resultData.captain.e);
    const teamResult = parseResult({ teamIds, captainId, round: ROUND });
    teamResult.teamOutput.forEach((s) => console.log(s));
    console.log('');
    console.log('Points : ', teamResult.points, ' - Cost: ', teamResult.cost);

    //return teamResult;
    //})
    //);

    /*     console.log(`
||1|2|3|4|5
|-|-|-|-|-|-|
`);

    rounds[0].teamOutput.forEach((_, i) => {
      console.log(
        `|${i + 1}.|${rounds.map((r) => r.teamOutput[i]).join('|')}|`
      );
    });

    console.log(`|Points|${rounds.map((r) => r.points).join('|')}|`);
    console.log(`|Cost|${rounds.map((r) => r.cost).join('|')}|`); */

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
