import fs from 'fs/promises';
import * as prettier from 'prettier';

const file = './data/players.js';

const main = async () => {
  const result = await fetch(
    'https://fantasy.rugbyworldcup.com/json/fantasy/players.json'
  );
  const players = await result.json();
  const code = await prettier.format(
    `export default ${JSON.stringify(players)};`,
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
