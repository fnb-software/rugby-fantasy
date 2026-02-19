import fs from "fs/promises";
import * as prettier from "prettier";
import token from "../token.js";

const ROUND = 1;
const OPTIONS = {
  headers: {
    Authorization: `Token ${token}`,
    "X-Access-Key": "600@18.23@",
  },
};

const file = `./data/round${ROUND}.js`;

const main = async () => {
  const roundResult = await fetch(
    "https://fantasy.sixnationsrugby.com/v1/private/journeecalendrier/2?lg=en",
    OPTIONS,
  );
  const round = await roundResult.json();
  console.log(round);
  const playedMatchIds = round.journee.matchs.map((match) => match.id);
  const matchStats = await Promise.all(
    playedMatchIds.map(async (id) => {
      const result = await fetch(
        `https://fantasy.sixnationsrugby.com/v1/private/match/${id}?lg=en`,
        OPTIONS,
      );
      return await result.json();
    }),
  );
  const code = await prettier.format(
    `export default ${JSON.stringify(matchStats)};`,
    {
      singleQuote: true,
      semi: true,
      trailingComma: "es5",
      parser: "babel",
    },
  );
  await fs.writeFile(file, code);
};

main();
