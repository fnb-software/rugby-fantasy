import { flatMapDeep, maxBy, sortBy, sum } from 'lodash';
import matches from '../data/matches';

const main = async () => {
  const playersByMatch = flatMapDeep(matches, (m) =>
    m.teamStats.map((ts, teamIndex) =>
      ts.playerStats.map((ps) => ({
        ...ps,
        matchId: m.match.matchId,
        matchDescription: m.match.description,
        player: {
          ...ps.player,
          teamAbbr: m.match.teams[teamIndex].abbreviation,
        },
      }))
    )
  );
  const getKickerScore = (p) =>
    2 * (p.stats.Conversions || 0) +
    -(p.stats.MissedConversions || 0) +
    3 * (p.stats.Penalties || 0) +
    -(p.stats.MissedPenalties || 0) +
    3 * (p.stats.DropGoals || 0) +
    -(p.stats.MissedDropGoals || 0);

  const getDefenderScore = (p) =>
    4 * (p.stats.TurnoverWon || 0) +
    5 * (p.stats.CollectionInterception || 0) +
    1 * (p.stats.Tackles || 0) +
    -(p.stats.MissedTackles || 0);

  const getTryScore = (p) =>
    15 * (p.stats.Tries || 0) + 9 * (p.stats.TryAssists || 0);

  const getErrorsScore = (p) =>
    -10 * (p.stats.RedCards || 0) +
    -9 * (p.stats.YellowCards || 0) +
    -(p.stats.PenaltiesConceded || 0) +
    -(p.stats.TurnoverForwardPass || 0) +
    -(p.stats.TurnoverKnockOn || 0);

  const getAttackerScore = (p) =>
    2 * (p.stats.DefendersBeaten || 0) +
    2 * (p.stats.Offload || 0) +
    7 * (p.stats.CleanBreaks || 0) +
    Math.floor((1 / 10) * (p.stats.Metres || 0)) +
    5 * (p.stats.CarriesSupport || 0);

  const getLineoutScore = (p) =>
    5 * (p.stats.LineoutWonSteal || 0) + 1 * (p.stats.LineoutWonOwnThrow || 0);

  const isFrontRow = (p) =>
    ['1', '2', '3', '16', '17', '18'].includes(p.number);
  const getScrumScore = (p) =>
    isFrontRow(p) ? 3 * (p.stats.ScrumsWonOutright || 0) : 0;

  const getPlayerScore = (p) =>
    getKickerScore(p) +
    getTryScore(p) +
    getDefenderScore(p) +
    getAttackerScore(p) +
    getLineoutScore(p) +
    getErrorsScore(p) +
    getScrumScore(p);

  const playerMap = playersByMatch.reduce((playerMap, p) => {
    if (!playerMap[p.player.id]) {
      playerMap[p.player.id] = {
        player: p.player,
        scoresByNumber: {},
        bestPosition: '',
      };
    }
    playerMap[p.player.id].scoresByNumber[p.number] =
      (playerMap[p.player.id].scoresByNumber[p.number] || 0) +
      getPlayerScore(p);
    playerMap[p.player.id].bestPosition = maxBy(
      Object.entries(playerMap[p.player.id].scoresByNumber),
      ([_, score]) => score
    )[0];
    return playerMap;
  }, {});

  const players = Object.values(playerMap);

  console.log(players.slice(0, 10));

  Array.from(new Array(3)).forEach((_, teamNumber) => {
    console.log(`#${teamNumber + 1} Team`);
    Array.from(new Array(23)).forEach((_, positionNumber) => {
      const playersOnPosition = players.filter(
        (p) => p.bestPosition == positionNumber + 1
      );
      const ps = sortBy(playersOnPosition, (p) =>
        sum(Object.values(p.scoresByNumber))
      )
        .slice(-(teamNumber + 1))
        .reverse();
      const p = ps[teamNumber];
      console.log(
        `${positionNumber + 1}. ${p.player.name.display} (${
          p.player.teamAbbr
        })  `
      );
    });
    console.log(``);
  });
};

main();
