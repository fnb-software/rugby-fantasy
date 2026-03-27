"use client";
import { useEffect, useState } from "react";
import fantasyModel from "../../../../2026/top14/minizinc/fantasy_total.mzn";
import getDzn from "../../../../2026/top14/minizinc/getDznTotal";
import parseResult from "../../../../2026/top14/minizinc/parseResult";
import { solve } from "../solve";

const Solve = () => {
  const [teamResult, setTeamResult] = useState<
    ReturnType<typeof parseResult> | undefined | null
  >();

  useEffect(() => {
    let log = ``;
    const solveTeam = async () => {
      const { teamIds, captainId } = await solve({
        dznString: getDzn(),
        fantasyModel,
      });
      const teamResult = parseResult({
        teamIds,
        captainId,
        supersubId: teamIds[15],
        round: 1,
      });
      log += teamResult.log + `,`;
      console.log(log);
      setTeamResult(teamResult);
    };
    solveTeam();
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
