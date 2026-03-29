"use client";
import { useEffect, useState } from "react";
import fantasyModel from "../../../../2026/top14/minizinc/fantasy.mzn";
import getDzn from "../../../../2026/top14/minizinc/getDzn";
import parseResult from "../../../../2026/top14/minizinc/parseResult";
import { solve } from "../solve";

const START_ROUND = 19;
const END_ROUND = 19; // 0-based

const Solve = () => {
  const [teamResult, setTeamResult] = useState<
    ReturnType<typeof parseResult> | undefined | null
  >();

  useEffect(() => {
    const solveAllRounds = async () => {
      let log = ``;
      for (
        let currentRound = START_ROUND;
        currentRound <= END_ROUND;
        currentRound++
      ) {
        const { teamIds, captainId } = await solve({
          dznString: getDzn(currentRound),
          fantasyModel,
        });
        const teamResult = parseResult({
          teamIds,
          captainId,
          supersubId: teamIds[15],
          round: currentRound,
        });
        log += teamResult.log + `,`;
        setTeamResult(teamResult);
      }
      console.log(`[${log}]`);
    };
    solveAllRounds();
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
