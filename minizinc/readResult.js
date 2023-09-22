import result from './fantasy-result';
import parseResult from './parseResult';

const main = async () => {
  const teamIds = result.ids;
  const captainId = result.captain;
  parseResult({ teamIds, captainId });
};

main();
