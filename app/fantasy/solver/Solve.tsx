'use client';
import * as MiniZinc from 'minizinc';
import { useEffect, useState } from 'react';
import fantasyModel from '../../../minizinc/fantasy.mzn';
import getDzn from '../../../minizinc/getDzn';
import parseResult from '../../../minizinc/parseResult';

const ROUND = 6;

const Solve = () => {
  const [teamResult, setTeamResult] = useState<
    ReturnType<typeof parseResult> | undefined | null
  >();

  useEffect(() => {
    MiniZinc.init({
      workerURL: 'http://localhost:3000/minizinc-worker.js',
    })
      .then(() => {
        const model = new MiniZinc.Model();
        model.addString(fantasyModel);
        model.addDznString(getDzn(ROUND));
        return model.solve({
          options: {
            solver: 'highs',
            'time-limit': 3 * 60000,
            statistics: true,
          },
        });
      })
      .then((result) => {
        if (!result.solution) {
          setTeamResult(null);
          return;
        }
        const resultData = result.solution.output.json;
        if (!resultData) {
          setTeamResult(null);
          return;
        }
        const teamIds = resultData.team.map(({ e }) => Number(e));
        const captainId = Number(resultData.captain.e);
        const teamResult = parseResult({ teamIds, captainId, round: ROUND });
        setTeamResult(teamResult);
        teamResult.teamOutput.forEach((s) => console.log(s));
      });
  }, []);

  if (teamResult === undefined) {
    return 'Solving....';
  }

  if (teamResult === null) {
    return 'No solution';
  }

  return (
    <div>
      <div>
        <h1>Team</h1>
        {teamResult.teamOutput.map((s) => (
          <div>{s}</div>
        ))}
      </div>
      <div>
        Points: {teamResult.points} - Cost: {teamResult.cost}
      </div>
    </div>
  );
};

export default Solve;
