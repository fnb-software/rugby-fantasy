import result from './fantasy-result';
import parseResult from './parseResult';

const ROUND = 1;

const main = async () => {
  const teamIds = result.ids;
  const captainId = result.captain;
  const result = parseResult({ teamIds, captainId, round: ROUND });
  result.teamOutput.forEach((s) => console.log(s));
  console.log('');
  console.log('Points : ', result.points, ' - Cost: ', result.cost);
};

main();
