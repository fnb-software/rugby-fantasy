import prompts from 'prompts';
import getTeamStats from './getTeamStats';
import getTeamDuelStats from './getTeamDuelStats';

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

  const {
    bestStatsTeam1,
    bestStatsTeam2,
    worstStatsTeam1,
    worstStatsTeam2,
    sortedStats,
  } = getTeamDuelStats({ team1Name, team2Name });

  console.log(
    `### ${team1Name} vs ${team2Name}: stats highlights (value per match)  `
  );
  console.log(`_Data from rugby world match centers_\\`);
  console.log(``);
  console.log(`#### ${team1Name} best stats  `);
  bestStatsTeam1.forEach(({ name, stats: [stats] }) => {
    console.log(`${name}: #${stats.rank} (${stats.value})\\`);
  });
  console.log(``);

  console.log(`#### ${team1Name} worst stats  `);
  worstStatsTeam1.forEach(({ name, stats: [stats] }) => {
    console.log(`${name}: #${stats.rank} (${stats.value})\\`);
  });
  console.log(``);

  console.log(`#### ${team2Name} best stats  `);
  bestStatsTeam2.forEach(({ name, stats: [, stats] }) => {
    console.log(`${name}: #${stats.rank} (${stats.value})\\`);
  });
  console.log(``);

  console.log(`#### ${team2Name} worst stats  `);
  worstStatsTeam2.forEach(({ name, stats: [, stats] }) => {
    console.log(`${name}: #${stats.rank} (${stats.value})\\`);
  });
  console.log(``);

  console.log(`#### ${team1Name} vs ${team2Name}: largest gaps`);
  sortedStats.forEach(({ name, stats: [stats1, stats2] }) => {
    console.log(
      `${name}: ${team1Name} #${stats1.rank} (${stats1.value}) - ${team2Name} #${stats2.rank} (${stats2.value})\\`
    );
  });
};

main();
