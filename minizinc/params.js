export const ROUND = 1;

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
