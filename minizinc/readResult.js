import players from '../data/players';
import result from './fantasy-result';

const main = async () => {
  const team = result.ids.map((id) => players.find((p) => p.id === id));
  const captain = players.find((p) => p.id === result.captain);
  result({ team, captain });
};

main();
