import { sortBy } from 'lodash';
import prompts from 'prompts';
import getTeamStats from './getTeamStats';
import statsTypes from './statsTypes';

const STATS_PER_SECTION = 6;

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

  const statRanks = teamStats.reduce((statRanks, { name, stats }) => {
    const stat1 = stats.find(({ teamId }) => teamId === team1Name);
    const rank1 =
      stats.filter((stat) => (stat?.value ?? 0) > (stat1?.value ?? 0)).length +
      1;
    const sameValue1 = stats.filter(
      (stat) => (stat?.value ?? 0) == (stat1?.value ?? 0)
    ).length;
    const stat2 = stats.find(({ teamId }) => teamId === team2Name);
    const rank2 =
      stats.filter((stat) => (stat?.value ?? 0) > (stat2?.value ?? 0)).length +
      1;
    const sameValue2 = stats.filter(
      (stat) => (stat?.value ?? 0) == (stat2?.value ?? 0)
    ).length;

    const statRank = {
      name,
      stats: [
        {
          rank: rank1,
          value: stat1?.value ?? 0,
          sameValue: sameValue1,
        },
        {
          rank: rank2,
          value: stat2?.value ?? 0,
          sameValue: sameValue2,
        },
      ],
    };

    statRanks.push(statRank);
    return statRanks;
  }, []);

  const getExtremeStats = ({ index, statsType, type }) => {
    const sortedStats = sortBy(
      statRanks
        .filter(({ name }) => statsTypes[name].type === statsType)
        .filter(({ stats }) => stats[index].rank > 0),
      ({ stats }) => stats[index].rank
    );
    const filteredStats = sortedStats.filter(({ stats }) => {
      return stats[index].sameValue < 3;
    });

    if (type === 'best') {
      const afterFirstIndex = filteredStats.findIndex(
        ({ stats }) => stats[index].rank > 1
      );
      return filteredStats.slice(
        0,
        Math.max(STATS_PER_SECTION, afterFirstIndex)
      );
    }
    return filteredStats.slice(-STATS_PER_SECTION).reverse();
  };

  const bestStatsTeam1 = getExtremeStats({
    index: 0,
    statsType: 'positive',
    type: 'best',
  }).concat(
    getExtremeStats({ index: 0, statsType: 'negative', type: 'worst' })
  );
  const worstStatsTeam1 = getExtremeStats({
    index: 0,
    statsType: 'negative',
    type: 'best',
  }).concat(
    getExtremeStats({ index: 0, statsType: 'positive', type: 'worst' })
  );
  const bestStatsTeam2 = getExtremeStats({
    index: 1,
    statsType: 'positive',
    type: 'best',
  }).concat(
    getExtremeStats({ index: 1, statsType: 'negative', type: 'worst' })
  );
  const worstStatsTeam2 = getExtremeStats({
    index: 1,
    statsType: 'negative',
    type: 'best',
  }).concat(
    getExtremeStats({ index: 1, statsType: 'positive', type: 'worst' })
  );

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

  const sortedStats = sortBy(statRanks, ({ stats: [stats1, stats2] }) =>
    Math.abs(
      stats1.rank -
        stats2.rank +
        (stats1.rank < stats2.rank
          ? stats1.sameValue - 1
          : 1 - stats2.sameValue)
    )
  )
    .slice(-STATS_PER_SECTION - 3)
    .reverse();

  console.log(`#### ${team1Name} vs ${team2Name}: largest gaps`);
  sortedStats.forEach(({ name, stats: [stats1, stats2] }) => {
    console.log(
      `${name}: ${team1Name} #${stats1.rank} (${stats1.value}) - ${team2Name} #${stats2.rank} (${stats2.value})\\`
    );
  });
};

main();
