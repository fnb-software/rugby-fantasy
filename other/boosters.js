import { flatMap, flatMapDeep, sortBy } from 'lodash';
import matches from '../data/matches';
import players from '../data/players';
import getPlayerStats from './getPlayerStats';

const main = async () => {
  const { playersByMatch, playersAggr } = getPlayerStats();

  const getKickerScore = (p) =>
    2 * (p.stats.Conversions || 0) +
    -(p.stats.MissedConversions || 0) +
    3 * (p.stats.Penalties || 0) +
    -(p.stats.MissedPenalties || 0) +
    3 * (p.stats.DropGoals || 0) +
    -(p.stats.MissedDropGoals || 0);
  const superKickers = sortBy(playersByMatch, getKickerScore)
    .slice(-5)
    .reverse();
  superKickers.map((superKicker, i) => {
    console.log(
      `SuperKicker ${i + 1}: ${
        superKicker.player.name.display
      } scored ${getKickerScore(superKicker)} booster points in ${
        superKicker.matchDescription
      }`
    );
  });
  const getDefenderScore = (p) =>
    4 * (p.stats.TurnoverWon || 0) +
    5 * (p.stats.CollectionInterception || 0) +
    1 * (p.stats.Tackles || 0) +
    -(p.stats.MissedTackles || 0);
  const defensiveKings = sortBy(playersByMatch, getDefenderScore)
    .slice(-5)
    .reverse();
  defensiveKings.map((defensiveKing, i) => {
    console.log(
      `DefensiveKing ${i + 1}: ${
        defensiveKing.player.name.display
      } scored ${getDefenderScore(defensiveKing)} booster points in ${
        defensiveKing.matchDescription
      }`
    );
  });

  const getDefenderScoreBy80Minutes = (p) =>
    p.stats.MinutesPlayedTotal / p.stats.MatchesPlayed > 30
      ? Math.round(
          (getDefenderScore(p) / p.stats.MinutesPlayedTotal) * 80 * 1000
        ) / 1000
      : 0;

  const defensiveKingAgg = sortBy(playersAggr, getDefenderScoreBy80Minutes)
    .slice(-20)
    .reverse();
  defensiveKingAgg.map((defensiveKing, i) => {
    console.log(
      `DefensiveKingAgg ${i + 1}: ${
        defensiveKing.player.name.display
      } scores avg ${getDefenderScoreBy80Minutes(defensiveKing)} per 80min (${
        defensiveKing.stats.MinutesPlayedTotal
      }min in ${defensiveKing.stats.MatchesPlayed} matches)`
    );
  });

  const tripleCaptains = sortBy(
    flatMap(players, (p) =>
      Object.entries(p.stats.scores || {}).map(([round, score]) => ({
        round,
        score,
        name: p.lastName,
      }))
    ),
    (p) => p.score
  )
    .slice(-5)
    .reverse();
  tripleCaptains.map((tripleCaptain, i) => {
    console.log(
      `TripleCaptain ${i + 1}: ${tripleCaptain.name} scored ${
        tripleCaptain.score
      } booster points in round ${tripleCaptain.round}`
    );
  });
};

main();
