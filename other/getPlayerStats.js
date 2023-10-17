import { flatMapDeep, mergeWith, sortBy } from 'lodash';
import matches from '../data/matches';
import statsTypes from './statsTypes';

const getPlayerStats = () => {
  const playersByMatch = flatMapDeep(matches, (m) =>
    m.teamStats.map((ts, teamIndex) =>
      ts.playerStats.map((ps) => ({
        ...ps,
        matchId: m.match.matchId,
        matchDescription: m.match.description,
        teamId: m.match.teams[teamIndex].abbreviation,
      }))
    )
  );

  const statsPerPlayer = playersByMatch.reduce((stats, playerMatch) => {
    stats[playerMatch.player.id] = (stats[playerMatch.player.id] || []).concat([
      playerMatch.stats,
    ]);
    return stats;
  }, {});

  const statsAggrPerPlayer = Object.entries(statsPerPlayer).reduce(
    (stats, [playerId, playerStats]) => {
      stats[playerId] = mergeWith({}, ...playerStats, (s1Value, s2Value) => {
        return (s1Value ?? 0) + (s2Value ?? 0);
      });
      stats[playerId] = Object.entries(stats[playerId]).reduce(
        (stats, [key, value]) => {
          stats[key] = value;
          return stats;
        },
        {}
      );
      stats[playerId].MatchesPlayed = playerStats.length;
      return stats;
    },
    {}
  );

  return {
    playersByMatch,
    playersAggr: Object.entries(statsAggrPerPlayer).map(
      ([playerId, stats]) => ({
        ...playersByMatch.find((p) => p.player.id === playerId),
        stats,
      })
    ),
  };
};

export default getPlayerStats;
