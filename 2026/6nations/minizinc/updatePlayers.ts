import fs from "fs/promises";
import * as prettier from "prettier";
import token from "../token.js";
import pLimit from "p-limit";

const ROUND = "3";
const OPTIONS = {
  headers: {
    Authorization: `Token ${token}`,
    "X-Access-Key": "600@18.23@",
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
  referrer: "https://fantasy.sixnationsrugby.com/m6n/",
  mode: "cors" as RequestMode,
  credentials: "include" as RequestCredentials,
};

const file = `./data/players.js`;

const main = async () => {
  let index = 0;
  let batchedPlayers;
  const players: any[] = [];
  while (index === 0 || batchedPlayers.length === 10) {
    console.log(index);
    const batch = await fetch(
      `https://fantasy.sixnationsrugby.com/v1/private/searchjoueurs?lg=en`,
      {
        ...OPTIONS,
        method: "POST",
        body: `{"filters":{"nom":"","club":"","position":"","budget_ok":false,"valeur_max":25,"engage":false,"partant":false,"dreamteam":false,"quota":"","idj":${ROUND},"pageIndex":${index},"pageSize":10,"loadSelect":0,"searchonly":1}}`,
      },
    );
    batchedPlayers = (await batch.json()).joueurs;
    console.log({
      index,
      length: batchedPlayers.length,
      ex: batchedPlayers[0]?.id,
    });
    players.push(...batchedPlayers);
    index++;
  }

  console.log(players.length);

  const limit = pLimit(10);
  const playerStatsRequests = players.map((player) =>
    limit(async () => {
      const result = await fetch(
        `https://fantasy.sixnationsrugby.com/v1/private/statsjoueur?lg=en`,
        {
          ...OPTIONS,
          method: "POST",
          body: JSON.stringify({
            credentials: { idj: ROUND, idf: player.id, detail: true },
          }),
        },
      );
      console.log("Player stats OK", { id: player.id });
      const stats = await result.json();
      return {
        ...player,
        stats,
      };
    }),
  );
  const playerStats = await Promise.all(playerStatsRequests);
  const code = await prettier.format(
    `export default ${JSON.stringify(playerStats)};`,
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
