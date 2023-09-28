import getTeamStats from './getTeamStats';

const main = async () => {
  const teamStats = getTeamStats();

  teamStats.forEach(({ name, stats }) => {
    console.log(`**${name}**`);
    const list = stats
      .map((stat) => `${stat.teamId} (${stat.value})`)
      .join(` - `);
    console.log(`  ${list}`);
    console.log(``);
  });
};

main();
