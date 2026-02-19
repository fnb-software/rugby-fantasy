import { flatMapDeep, mergeWith, sortBy } from "lodash";
import matches from "../data/matches";
import statsTypes from "./statsTypes";

const getTeamStats = (options) => {
  const teamByMatch = flatMapDeep(
    matches.slice(options?.firstIndex, options?.lastIndex),
    (m) =>
      m.teamStats.map((ts, teamIndex) => ({
        ...ts,
        teamId: m.match.teams[teamIndex].abbreviation,
      })),
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
        {},
      );
      return stats;
    },
    {},
  );

  const teamSet = Object.keys(statsAggrPerTeam).reduce((teams, teamId) => {
    teams.add(teamId);
    return teams;
  }, new Set());

  const statsMap = Object.entries(statsAggrPerTeam).reduce(
    (stats, [teamId, teamStats]) => {
      Object.entries(teamStats).forEach(([name, value]) => {
        stats[name] = (stats[name] || []).concat([{ teamId, value }]);
      });
      return stats;
    },
    {},
  );

  const filteredStats = Object.entries(statsMap).filter(([name]) => {
    if (!statsTypes[name]) {
      console.log(name);
    }
    return statsTypes[name].type !== "ignore";
  });

  const statsAllTeams = filteredStats.map(([name, teamEntries]) => {
    teamSet.forEach((teamId) => {
      if (!teamEntries.some((entry) => entry.teamId === teamId)) {
        teamEntries.push({ teamId, value: 0 });
      }
    });
    return [name, teamEntries];
  });

  return sortBy(statsAllTeams, ([n1]) => n1).map(([name, stats]) => {
    const sorted = sortBy(stats, (stat) => stat.value).reverse();
    return { name, stats: sorted, type: statsTypes[name].type };
  });
};

export default getTeamStats;
