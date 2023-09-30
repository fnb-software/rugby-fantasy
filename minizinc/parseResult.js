import players from '../data/players';
import squads from '../data/squads';
import { getPlayerScore } from './params';

const parseResult = ({ teamIds, captainId }) => {
  const team = teamIds.map((id) => players.find((p) => p.id === id));
  const captain = players.find((p) => p.id === captainId);
  team.sort((p1, p2) => positionToInt(p1) - positionToInt(p2));
  team.splice(2, 0, team.splice(1, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  team.splice(11, 0, team.splice(14, 1)[0]);
  team.map((p, i) => {
    console.log(
      `${i + 1}. ${p === captain ? '(c)' : ''} ${p.lastName} ${p.firstName} (${
        squads.find((s) => p.squadId === s.id)?.abbreviation
      } - ${p.cost / 1000000}) - ${getPlayerScore(p) ?? 'N/A'}\\`
    );
  });

  console.log('');
  console.log(
    'Points : ',
    team.reduce(
      (total, p) => total + (getPlayerScore(p) || 0),
      getPlayerScore(captain)
    ),
    ' - Cost: ',
    team.reduce((total, p) => total + p.cost, 0) / 1000000
  );
};

const positionToInt = (p) => {
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

export default parseResult;
