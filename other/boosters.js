import { flatMap, flatMapDeep, sortBy } from 'lodash';
import players from '../data/players';
import getPlayerStats from './getPlayerStats';

const teamsToHighlight = [
  'WAL',
  'ARG',
  'IRE',
  'NZL',
  'ENG',
  'FIJ',
  'FRA',
  'RSA',
];

const STAGE = 'knockouts'; // 'pools'

const main = async () => {
  const { playersByMatch: allPlayersByMatch, playersAggr: allPlayersAggr } =
    getPlayerStats(
      STAGE === 'knockouts' ? { firstIndex: 40 } : { lastIndex: 40 }
    );

  const playersByMatch = allPlayersByMatch.filter((p) =>
    teamsToHighlight.includes(p.teamId)
  );

  const normalize = (s) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace("'", '')
      .toLowerCase();

  const getFantasyPlayer = (p) => {
    const fantasyPlayer = players.find(
      (fantasyPlayer) =>
        normalize(fantasyPlayer.firstName + ' ' + fantasyPlayer.lastName) ===
          normalize(
            p.player.name.first.known + ' ' + p.player.name.last.known
          ) ||
        (fantasyPlayer.lastName === 'Whitelock' &&
          p.player.name.last.known === fantasyPlayer.lastName) ||
        (fantasyPlayer.lastName === 'Mbonambi' &&
          p.player.name.last.known === fantasyPlayer.lastName) ||
        (fantasyPlayer.lastName === 'Matavesi' &&
          p.player.name.last.known === fantasyPlayer.lastName) ||
        (fantasyPlayer.lastName === 'Derenalagi' &&
          p.player.name.last.known === fantasyPlayer.lastName) ||
        (fantasyPlayer.lastName === 'Ravutaumada' &&
          p.player.name.last.known === fantasyPlayer.lastName) ||
        (fantasyPlayer.lastName === 'Meli Derenalagi' &&
          p.player.name.last.known === 'Derenalagi')
    );
    if (!fantasyPlayer) {
      console.log({ fantasyPlayer, playerName: p.player.name });
    }
    return fantasyPlayer;
  };

  const playersAggr = allPlayersAggr
    .filter((p) => teamsToHighlight.includes(p.teamId))
    .map((playerAggr) => ({
      ...playerAggr,
      fantasyPlayer: getFantasyPlayer(playerAggr),
    }));

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

  const getLineoutBeast = (p) =>
    5 * (p.stats.LineoutWonOppThrow || 0) +
    1 * (p.stats.LineoutWonOwnThrow || 0);
  const lineoutStealers = sortBy(playersByMatch, getLineoutBeast)
    .slice(-3)
    .reverse();
  lineoutStealers.map((defensiveKing, i) => {
    console.log(
      `LineoutBeast ${i + 1}: ${
        defensiveKing.player.name.display
      } scored ${getLineoutBeast(defensiveKing)} lineout points in ${
        defensiveKing.matchDescription
      }`
    );
  });

  const getFantasyPlayerScore = (p) => {
    const rounds = STAGE === 'knockouts' ? { first: 6 } : { last: 5 };
    if (!p.fantasyPlayer) {
      return 0;
    }
    return Object.entries(p.fantasyPlayer.stats.scores).reduce(
      (total, [round, score]) =>
        total +
        ((rounds.first && round >= rounds.first && score) || 0) +
        ((rounds.last && round <= rounds.last && score) || 0),
      0
    );
  };

  const getPlayerScoreBy80Minutes = (p) =>
    p.stats.MinutesPlayedTotal / p.stats.MatchesPlayed > 30
      ? Math.round(
          (getFantasyPlayerScore(p) / p.stats.MinutesPlayedTotal) * 80 * 1000
        ) / 1000
      : 0;
  [
    'prop',
    'hooker',
    'lock',
    'loose_forward',
    'scrum_half',
    'fly_half',
    'center',
    'outside_back',
  ].forEach((position) => {
    const props = sortBy(
      playersAggr.filter((p) => p.fantasyPlayer?.position[0] === position),
      getPlayerScoreBy80Minutes
    )
      .slice(-3)
      .reverse();
    props.map((defensiveKing, i) => {
      console.log(
        `${position} Score ${i + 1}: ${
          defensiveKing.player.name.display
        } scores avg ${getPlayerScoreBy80Minutes(defensiveKing)} per 80min (${
          defensiveKing.stats.MinutesPlayedTotal
        }min in ${defensiveKing.stats.MatchesPlayed} matches)`
      );
    });
  });

  const getDefenderScoreBy80Minutes = (p) =>
    p.stats.MinutesPlayedTotal / p.stats.MatchesPlayed > 30
      ? Math.round(
          (getDefenderScore(p) / p.stats.MinutesPlayedTotal) * 80 * 1000
        ) / 1000
      : 0;

  const defensiveKingAgg = sortBy(playersAggr, getDefenderScoreBy80Minutes)
    .slice(-5)
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
      Object.entries(p.stats.scores || {})
        .filter(([round]) => (STAGE === 'knockouts' ? round >= 6 : round <= 5))
        .map(([round, score]) => ({
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
