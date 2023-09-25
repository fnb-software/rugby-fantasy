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

const ROUND = 3;

export const getPlayerScore = (p: (typeof players)[number]) =>
  //p.stats.totalPoints;
  p.stats.scores?.[ROUND];
