import fs from 'fs/promises';
import * as prettier from 'prettier';

const file = './data/matches.js';

const main = async () => {
  const result = await fetch(
    'https://api.wr-rims-prod.pulselive.com/rugby/v3/event/1893/schedule?language=en'
  );
  const schedule = await result.json();
  const playedMatchIds = schedule.matches
    .filter((m) => m.status === 'C')
    .map((m) => m.matchId);
  const matchStats = await Promise.all(
    playedMatchIds.map(async (id) => {
      const result = await fetch(
        `https://api.wr-rims-prod.pulselive.com/rugby/v3/match/${id}/stats?language=en`
      );
      return await result.json();
    })
  );
  const code = await prettier.format(
    `export default ${JSON.stringify(matchStats)};`,
    {
      singleQuote: true,
      semi: true,
      trailingComma: 'es5',
      parser: 'babel',
    }
  );
  await fs.writeFile(file, code);
};

main();
