import getTeamStats from './getTeamStats';
import fs, { writeFile } from 'fs/promises';

const FILE = `./stats/statsPerTeam.md`;

const teamsToHighlight = [
  'WAL',
  'ARG',
  'IRE',
  'NZL',
  'ENG',
  'FIJ',
  'FRA',
  'RSA',
];

const main = async () => {
  const teamStats = getTeamStats();

  let output = `### Raw stats from match centers (Average per match)

**QF teams highlighted**

`;

  teamStats.forEach(({ name, type, stats }) => {
    output += `**${name}** ${type === 'positive' ? '👍' : '👎'}  
    `;
    const list = stats
      .map((stat) => {
        if (teamsToHighlight.includes(stat.teamId)) {
          return `**${stat.teamId} (${stat.value})**`;
        }
        return `${stat.teamId} (${stat.value})`;
      })
      .join(` - `);
    output += `${list}
    
`;
  });
  await writeFile(FILE, output);
};

main();
