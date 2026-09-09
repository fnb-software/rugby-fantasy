import fs from "fs/promises";
import * as prettier from "prettier";
import pLimit from "p-limit";

const token = process.env.TOP14_TOKEN;
if (!token) throw new Error("TOP14_TOKEN is not set");

const ROUND = 26;

const OPTIONS = {
  headers: {
    Authorization: `Token ${token}`,
    "X-Access-Key": "740@18.23@@d50f0d9f-4343-4b7c-ba53-41852dc2ec1a",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8",
    "Content-Type": "application/json",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    Priority: "u=0",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  },
  referrer: "https://lagrandemelee.midi-olympique.fr",
  mode: "cors" as RequestMode,
  credentials: "include" as RequestCredentials,
};

const file = `./data/rounds.js`;

const main = async () => {
  const limit = pLimit(10);
  const roundRequests = Array.from({ length: ROUND }).map((_, i) =>
    limit(async () => {
      const result = await fetch(
        `https://lagrandemelee.midi-olympique.fr/v1/private/journeecalendrier/${
          i + 1
        }?lg=en`,
        {
          ...OPTIONS,
          method: "GET",
        },
      );
      console.log("Round stats OK", { number: i + 1 });
      const stats = await result.json();
      return stats;
    }),
  );
  const roundStats = await Promise.all(roundRequests);
  const code = await prettier.format(
    `export default ${JSON.stringify(roundStats)};`,
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
