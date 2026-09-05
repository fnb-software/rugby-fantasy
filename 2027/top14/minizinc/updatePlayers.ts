import pLimit from 'p-limit';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { get, put } from '@vercel/blob';
import { matchesName } from '../../../app/2027/top14/statsUtil';
import { buildTeamsheetIndex } from '../../../extension/shared/teamsheetsIndex';

const token = process.env.TOP14_TOKEN;
if (!token) throw new Error('TOP14_TOKEN is not set');

const userId = process.env.USER_ID;
if (!userId) throw new Error('USER_ID is not set (your Google sub)');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN is not set');
}

const ROUND = '0';
const BLOB_PREFIX = process.env.BLOB_PREFIX ?? '';
const BLOB_KEY = `players/2027/${BLOB_PREFIX}${userId}.json`;

const OPTIONS = {
  headers: {
    Authorization: `Token ${token}`,
    'X-Access-Key': '740@18.23@@d50f0d9f-4343-4b7c-ba53-41852dc2ec1a',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9,fr-FR;q=0.8',
    'Content-Type': 'application/json',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    Priority: 'u=0',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
  },
  referrer: 'https://lagrandemelee.midi-olympique.fr',
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials,
};

const skipTeamsheets =
  process.argv.includes('--all') || process.argv.includes('--no-teamsheets');

const main = async () => {
  console.log(
    chalk.bold(`\nupdatePlayers — round ${ROUND} — user ${userId}\n`),
  );
  console.log(`  ${chalk.dim(`blob key: ${BLOB_KEY}`)}`);

  const teamsheetIndex = skipTeamsheets ? null : buildTeamsheetIndex();
  const existing = await loadExistingPlayers();

  let players: any[];
  let playersToUpdate: any[];
  if (teamsheetIndex && existing.length > 0) {
    players = existing;
    playersToUpdate = existing.filter((p) => {
      const entries = teamsheetIndex.get(p.club);
      return entries?.some((name) => matchesName(p, name)) ?? false;
    });
    console.log(
      `${chalk.cyan('●')} Teamsheets populated — reusing ${chalk.bold(
        existing.length,
      )} cached players, refreshing ${chalk.bold(
        playersToUpdate.length,
      )} from teamsheets`,
    );
  } else {
    const reason = skipTeamsheets
      ? 'Teamsheets optimization skipped (--all)'
      : existing.length === 0
      ? 'No cached snapshot in Blob'
      : 'Teamsheets empty';
    console.log(`${chalk.cyan('●')} ${reason} — fetching full player roster`);
    players = await fetchAllPlayers(existing.length || 700);
    playersToUpdate = players;
    console.log(`  ${chalk.dim(`Loaded ${players.length} players`)}`);
  }

  console.log(
    `${chalk.cyan('●')} Fetching stats for ${chalk.bold(
      playersToUpdate.length,
    )} players`,
  );
  const bar = new cliProgress.SingleBar(
    {
      format: `  ${chalk.cyan('{bar}')} ${chalk.bold(
        '{value}/{total}',
      )} ${chalk.dim('• {duration_formatted} elapsed • ETA {eta_formatted}')}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(playersToUpdate.length, 0);

  const limit = pLimit(10);
  const playerStatsRequests = playersToUpdate.map((player) =>
    limit(async () => {
      const result = await fetch(
        `https://lagrandemelee.midi-olympique.fr/v1/private/statsjoueur?lg=en`,
        {
          ...OPTIONS,
          method: 'POST',
          body: JSON.stringify({
            credentials: { idj: ROUND, idf: player.id, detail: true },
          }),
        },
      );
      const stats = await result.json();
      bar.increment();
      return {
        ...player,
        stats,
      };
    }),
  );
  const updatedStats = await Promise.all(playerStatsRequests);
  bar.stop();

  const updatedById = new Map(updatedStats.map((p) => [p.id, p]));
  const playerStats = players.map((p) => updatedById.get(p.id) ?? p);

  console.log(`${chalk.cyan('●')} Uploading to Blob`);
  await put(BLOB_KEY, JSON.stringify(playerStats), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
  });

  console.log(
    `${chalk.green('✓')} Wrote ${chalk.underline(BLOB_KEY)} ${chalk.dim(
      `(${players.length} players, ${updatedStats.length} refreshed)`,
    )}\n`,
  );
};

// --- helpers ---

const loadExistingPlayers = async (): Promise<any[]> => {
  try {
    const result = await get(BLOB_KEY, { access: 'private' });
    if (!result || result.statusCode !== 200) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as any[];
  } catch {
    return [];
  }
};

const fetchAllPlayers = async (estimatedTotal: number): Promise<any[]> => {
  const bar = new cliProgress.SingleBar(
    {
      format: `  ${chalk.cyan('{bar}')} ${chalk.bold('{value}')} ${chalk.dim(
        'players • {duration_formatted} elapsed',
      )}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(estimatedTotal, 0);

  const warnings: string[] = [];
  let index = 0;
  let batchedPlayers: any[] = [];
  const players: any[] = [];
  while (index === 0 || batchedPlayers.length === 10) {
    const batch = await fetch(
      `https://lagrandemelee.midi-olympique.fr/v1/private/searchjoueurs?lg=en`,
      {
        ...OPTIONS,
        method: 'POST',
        body: `{"filters":{"nom":"","club":"","position":"","budget_ok":false,"valeur_max":25,"engage":false,"partant":false,"dreamteam":false,"quota":"","idj":${ROUND},"pageIndex":${index},"pageSize":10,"loadSelect":0,"searchonly":1}}`,
      },
    );
    const response = await batch.json();
    if (response.message) warnings.push(response.message);
    batchedPlayers = response.joueurs;
    players.push(...batchedPlayers);
    if (players.length > bar.getTotal() - 50) {
      bar.setTotal(players.length + 100);
    }
    bar.update(players.length);
    index++;
  }
  bar.setTotal(players.length);
  bar.update(players.length);
  bar.stop();

  for (const m of warnings) {
    console.warn(chalk.yellow(`  ⚠ API message: ${m}`));
  }
  return players;
};

main();
