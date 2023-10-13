import { sortBy } from 'lodash';
import getTeamStats from './getTeamStats';
import statsTypes from './statsTypes';

const STATS_PER_SECTION = 6;

const getTeamDuelStats = ({ team1Name, team2Name }) => {
  const teamStats = getTeamStats();
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

  return {
    statRanks,
    bestStatsTeam1,
    bestStatsTeam2,
    worstStatsTeam1,
    worstStatsTeam2,
    sortedStats,
  };
};

export default getTeamDuelStats;
