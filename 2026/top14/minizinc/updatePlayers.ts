import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import * as prettier from "prettier";
import pLimit from "p-limit";
import {
  TEAMSHEETS,
  entryName,
} from "../../../app/2026/top14/teamsheets";
import { matchesName } from "../../../app/2026/top14/statsUtil";

const token = process.env.TOP14_TOKEN;
if (!token) throw new Error("TOP14_TOKEN is not set");

const ROUND = "22";

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

const file = `./data/players.js`;

const main = async () => {
  const teamsheetIndex = buildTeamsheetIndex();
  const existing = teamsheetIndex ? await loadExistingPlayers() : [];

  let players: any[];
  let playersToUpdate: any[];
  if (teamsheetIndex && existing.length > 0) {
    players = existing;
    playersToUpdate = existing.filter((p) => {
      const entries = teamsheetIndex.get(p.club);
      return entries?.some((name) => matchesName(p, name)) ?? false;
    });
    console.log(
      `Teamsheets populated: skipping searchjoueurs, fetching stats for ${playersToUpdate.length}/${existing.length} players`,
    );
  } else {
    players = await fetchAllPlayers();
    playersToUpdate = players;
    console.log(
      `Teamsheets empty: fetching stats for all ${players.length} players`,
    );
  }

  const limit = pLimit(10);
  const playerStatsRequests = playersToUpdate.map((player) =>
    limit(async () => {
      const result = await fetch(
        `https://lagrandemelee.midi-olympique.fr/v1/private/statsjoueur?lg=en`,
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
  const updatedStats = await Promise.all(playerStatsRequests);
  const updatedById = new Map(updatedStats.map((p) => [p.id, p]));

  const playerStats = players.map((p) => updatedById.get(p.id) ?? p);

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

// --- helpers ---

const buildTeamsheetIndex = (): Map<string, string[]> | null => {
  const total = Object.values(TEAMSHEETS).reduce(
    (s, ts) => s + ts.starters.length + ts.subs.length,
    0,
  );
  if (total === 0) return null;
  const byClub = new Map<string, string[]>();
  for (const [club, ts] of Object.entries(TEAMSHEETS)) {
    byClub.set(club, [...ts.starters, ...ts.subs].map(entryName));
  }
  return byClub;
};

const loadExistingPlayers = async (): Promise<any[]> => {
  try {
    const url = pathToFileURL(path.resolve(file)).href;
    const mod = await import(url);
    return mod.default ?? [];
  } catch {
    return [];
  }
};

const fetchAllPlayers = async (): Promise<any[]> => {
  let index = 0;
  let batchedPlayers;
  const players: any[] = [];
  while (index === 0 || batchedPlayers.length === 10) {
    const batch = await fetch(
      `https://lagrandemelee.midi-olympique.fr/v1/private/searchjoueurs?lg=en`,
      {
        ...OPTIONS,
        method: "POST",
        body: `{"filters":{"nom":"","club":"","position":"","budget_ok":false,"valeur_max":25,"engage":false,"partant":false,"dreamteam":false,"quota":"","idj":${ROUND},"pageIndex":${index},"pageSize":10,"loadSelect":0,"searchonly":1}}`,
      },
    );
    const response = await batch.json();
    response.message && console.log(response);
    batchedPlayers = response.joueurs;
    console.log({
      index,
      length: batchedPlayers.length,
      ex: batchedPlayers[0]?.id,
    });
    players.push(...batchedPlayers);
    index++;
  }
  return players;
};

main();
