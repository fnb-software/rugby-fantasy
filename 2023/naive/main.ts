import players from "../data/players";
import squads from "../data/squads";
import knapsack from "./knapsack";

const POSITIONS = [
  { name: "prop", number: 2 },
  { name: "hooker", number: 1 },
  { name: "lock", number: 2 },
  { name: "loose_forward", number: 3 },
  { name: "scrum_half", number: 1 },
  { name: "fly_half", number: 1 },
  { name: "center", number: 2 },
  { name: "outside_back", number: 3 },
];

const BUDGET = 100000000;

const ROUND = 2;

const main = async () => {
  /*   const results = await fetch(
    'https://fantasy.rugbyworldcup.com/json/fantasy/players.json'
  );

  const players = await results.json(); */

  const pb = players.reduce((k, p) => {
    k[p.id] = [p.cost, p.stats.scores?.[ROUND] || 0];
    return k;
  }, {});
  console.log("start");

  const [ids] = knapsack(pb, BUDGET);
  console.log("done", ids);

  /* const team = POSITIONS.reduce((team, position) => {
    const playerAtPosition = players.filter(
      (player) => player.position[0] === position.name
    );
    const sortedByRoundScore = lodash.sortBy(
      playerAtPosition,
      (p) => p.stats.scores?.[ROUND] || 0
    );
    const topPlayers = sortedByRoundScore.slice(-position.number);
    return team.concat(topPlayers);
  }, []); */

  const team = ids.map((id) => players.find((p) => p.id === Number(id)));

  team.map((p) => {
    console.log(
      `${p.lastName} ${p.firstName} - ${p.position[0]} (${squads.find(
        (s) => p.squadId === s.id,
      )?.abbreviation}) - ${p.stats.scores[ROUND]} - ${p.cost / 1000000}`,
    );
  });
  console.log(
    "Points : ",
    team.reduce((total, p) => total + p.stats.scores[ROUND], 0),
    " - Cost: ",
    team.reduce((total, p) => total + p.cost, 0) / 1000000,
  );
};

main();
