import * as MiniZinc from "minizinc";

let solver;

export const solve = async ({ dznString, fantasyModel }) => {
  if (!solver) {
    solver = MiniZinc.init({
      workerURL: "http://localhost:3000/minizinc-worker.js",
    });
  }
  await solver;
  const model = new MiniZinc.Model();
  model.addString(fantasyModel);
  model.addDznString(dznString);
  const result = await model.solve({
    options: {
      solver: "highs",
      "time-limit": 3 * 60000,
      statistics: true,
    },
  });
  if (!result.solution) {
    throw new Error("No solution");
  }
  const resultData = result.solution.output.json;
  if (!resultData) {
    throw new Error("No json");
  }
  const teamIds = resultData.team.map(({ e }) => Number(e));
  const captainId = Number(resultData.captain.e);
  return { teamIds, captainId };
};
