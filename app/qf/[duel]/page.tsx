import getTeamDuelStats from '@/other/getTeamDuelStats';
import SortableStats from './SortableStats';

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
      <SortableStats
        team1Name={team1Name}
        team2Name={team2Name}
        statRanks={statRanks}
      />
    </div>
  );
};

export default Match;
