import players from '../data/players';

export const positionToInt = (p) => {
  switch (p.position[0]) {
    case 'prop':
      return 1;
    case 'hooker':
      return 2;
    case 'lock':
      return 4;
    case 'loose_forward':
      return 6;
    case 'scrum_half':
      return 9;
    case 'fly_half':
      return 10;
    case 'center':
      return 12;
    case 'outside_back':
      return 11;
  }
};

export const getPlayerTotalScore = (p: (typeof players)[number]) =>
  p.stats.totalPoints;

export const getPlayerScoreForRound =
  (round: number) => (p?: (typeof players)[number]) =>
    p?.stats.scores?.[round];

export const getMaxPlayerScore =
  (round: number) => (p: (typeof players)[number]) =>
    Math.max(
      ...Array.from(new Array(5)).map((_, i) => p.stats.scores?.[i + 1] || 0)
    );
