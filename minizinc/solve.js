import fs from 'fs/promises';
import * as MiniZinc from 'minizinc';
import path from 'path';
import getDzn from './getDzn';
import parseResult from './parseResult';

const main = async () => {
  try {
    MiniZinc.init({
      minizinc: 'minizinc',
    });

    const model = new MiniZinc.Model();
    const modelString = await fs.readFile(
      path.resolve('./minizinc/fantasy.mzn')
    );
    model.addString(modelString);
    model.addDznString(getDzn());

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
    console.log(result.solution.output.json);
    parseResult(result.solution.output.json);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
