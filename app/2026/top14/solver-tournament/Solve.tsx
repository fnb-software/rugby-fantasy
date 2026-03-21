"use client";
import * as MiniZinc from "minizinc";
import { useEffect, useState } from "react";
import fantasyModel from "../../../../2026/top14/minizinc/fantasy_total.mzn";
import getDzn from "../../../../2026/top14/minizinc/getDznTotal";
import parseResult from "../../../../2026/top14/minizinc/parseResult";

const START_ROUND = 18;
const END_ROUND = 18; // 0-based

const solver = MiniZinc.init({
  workerURL: "http://localhost:3000/minizinc-worker.js",
});
const Solve = () => {
  const [teamResult, setTeamResult] = useState<
    ReturnType<typeof parseResult> | undefined | null
  >();

  useEffect(() => {
    let log = ``;
    solver.then(async () => {
      const model = new MiniZinc.Model();
      model.addString(fantasyModel);
      model.addDznString(getDzn());
      const result = await model.solve({
        options: {
          solver: "highs",
          "time-limit": 3 * 60000,
          statistics: true,
        },
      });
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
      const teamResult = parseResult({
        teamIds,
        captainId,
        supersubId: teamIds[15],
        round: 1,
      });
      log += teamResult.log + `,`;
      console.log(log);
      setTeamResult(teamResult);
    });
  }, []);

  if (teamResult === undefined) {
    return "Solving....";
  }

  if (teamResult === null) {
    return "No solution";
  }

  return (
    <div>
      <div>
        <h1>Team</h1>
        {teamResult.teamOutput.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>
      <div>
        Points: {teamResult.points / 20} - Cost: {teamResult.cost}
      </div>
    </div>
  );
};

export default Solve;
