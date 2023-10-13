import getTeamDuelStats from '@/other/getTeamDuelStats';
import { Bar } from 'react-chartjs-2';
import DuelChart from './DuelChart';

const Match = async ({ params: { duel } }: { params: { duel: string } }) => {
  const team1Name = duel.slice(0, 3);
  const team2Name = duel.slice(4, 7);
  const { statRanks } = getTeamDuelStats({
    team1Name,
    team2Name,
  });
  return (
    <div>
      <h1 className="text-xl">
        QF stats: {team1Name} vs {team2Name} (average per match)
      </h1>
      {statRanks.map(({ name, stats }) => (
        <div key={name} className="my-3">
          <div id={name} className="invisible relative -top-14" />
          <a className="font-semibold" href={`#${name}`}>
            {name}
          </a>
          <DuelChart
            team1Name={team1Name}
            team2Name={team2Name}
            name={name}
            stats={stats}
          ></DuelChart>
        </div>
      ))}
    </div>
  );
};

export default Match;
