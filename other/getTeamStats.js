import { flatMapDeep, mergeWith, sortBy } from 'lodash';
import matches from '../data/matches';

const getTeamStats = () => {
  const teamByMatch = flatMapDeep(matches, (m) =>
    m.teamStats.map((ts, teamIndex) => ({
      ...ts,
      teamId: m.match.teams[teamIndex].abbreviation,
    }))
  );

  const statsPerTeam = teamByMatch.reduce((stats, teamMatch) => {
    stats[teamMatch.teamId] = (stats[teamMatch.teamId] || []).concat([
      teamMatch.stats,
    ]);
    return stats;
  }, {});

  const statsAggrPerTeam = Object.entries(statsPerTeam).reduce(
    (stats, [teamId, teamStats]) => {
      stats[teamId] = mergeWith({}, ...teamStats, (s1Value, s2Value) => {
        return (s1Value ?? 0) + (s2Value ?? 0);
      });
      stats[teamId] = Object.entries(stats[teamId]).reduce(
        (stats, [key, value]) => {
          stats[key] = Math.round((value / teamStats.length) * 100) / 100;
          return stats;
        },
        {}
      );
      return stats;
    },
    {}
  );

  const statsMap = Object.entries(statsAggrPerTeam).reduce(
    (stats, [teamId, teamStats]) => {
      Object.entries(teamStats).forEach(([name, value]) => {
        stats[name] = (stats[name] || []).concat([{ teamId, value }]);
      });
      return stats;
    },
    {}
  );

  return sortBy(Object.entries(statsMap), ([n1]) => n1).map(([name, stats]) => {
    const sorted = sortBy(stats, (stat) => stat.value).reverse();
    return { name, stats: sorted };
  });
};

export default getTeamStats;
