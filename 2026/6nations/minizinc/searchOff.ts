import fs from "fs/promises";
import * as prettier from "prettier";
import token from "../token.js";
import pLimit from "p-limit";
import playersOff from "../data/playersOff.js";

const ROUND = "2";

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

const main = async () => {
  const batch = await fetch(
    `https://fantasy.sixnationsrugby.com/v1/private/classementgeneral/1?lg=en`,
    {
      ...OPTIONS,
      method: "GET",
    },
  );
  const ladder = await batch.json();
  console.log(ladder.joueurs.length);
  const limit = pLimit(10);
  const playerStatsRequests = ladder.joueurs.map((joueur) =>
    limit(async () => {
      const result = await fetch(
        `https://fantasy.sixnationsrugby.com/v1/private/feuillematch/${ROUND}/${joueur.idjg}?lg=en`,
        {
          ...OPTIONS,
        },
      );
      const stats = await result.json();
      const offs = stats.feuille.postes.filter((poste) => poste.off === true);
      offs.forEach((off) => console.log(off.nom, joueur.idjg));
    }),
  );
  await Promise.all(playerStatsRequests);
  console.log("done");
};

main();
