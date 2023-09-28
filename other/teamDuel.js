import prompts from 'prompts';
import getTeamStats from './getTeamStats';

const main = async () => {
  const teamStats = getTeamStats();
  const teams = Array.from(
    teamStats.reduce((teams, { name, stats }) => {
      stats.forEach(({ teamId }) => teams.add(teamId));
      return teams;
    }, new Set())
  ).sort();

  const { team1 } = await prompts({
    type: 'select',
    name: 'team1',
    message: 'Select first team',
    choices: teams,
  });
  const team1Name = teams[team1];

  const { team2 } = await prompts({
    type: 'select',
    name: 'team2',
    message: 'Select second team',
    choices: teams,
  });
  const team2Name = teams[team2];

  const relevantStats = teamStats.reduce((relevantStats, { name, stats }) => {
    const team1Index = stats.findIndex(({ teamId }) => teamId === team1Name);
    const team2Index = stats.findIndex(({ teamId }) => teamId === team2Name);
    if (team1Index === -1 && team2Index === -1) {
      return relevantStats;
    }
    const relevantStat = {
      name,
      stats: [
        {
          position: team1Index === -1 ? 20 : team1Index + 1,
          value: stats[team1Index]?.value ?? 0,
        },
        {
          position: team2Index === -1 ? 20 : team2Index + 1,
          value: stats[team2Index]?.value ?? 0,
        },
      ],
    };
    if (
      (team1Index === -1 && team2Index < 3) ||
      (team1Index < 3 && team2Index === -1)
    ) {
      relevantStats.push(relevantStat);
      return relevantStats;
    }
    if (team1Index === -1 || team2Index === -1) {
      return relevantStats;
    }
    if (Math.abs(team1Index - team2Index) >= 12) {
      relevantStats.push(relevantStat);
      return relevantStats;
    }
    return relevantStats;
  }, []);
  console.log(
    `###${team1Name} vs ${team2Name}: significant stats (per match)  `
  );
  relevantStats.forEach(({ name, stats: [stats1, stats2] }) => {
    console.log(`**${name}**  `);
    console.log(
      `${team1Name}: #${stats1.position} (${stats1.value}) - ${team2Name}: #${stats2.position} (${stats2.value})  `
    );
    console.log(``);
  });
};

main();
