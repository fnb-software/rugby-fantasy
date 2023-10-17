import getTeamDuelStats from '@/other/getTeamDuelStats';
import StatsChoice from './StatsChoice';

const Match = async ({ params: { duel } }: { params: { duel: string } }) => {
  const team1Name = duel.slice(0, 3);
  const team2Name = duel.slice(4, 7);
  const { statsPreview, stats } = getTeamDuelStats({
    team1Name,
    team2Name,
  });
  return (
    <div className="lg:w-1/2 ">
      <StatsChoice
        team1Name={team1Name}
        team2Name={team2Name}
        statsPreview={statsPreview}
        stats={stats}
      />
    </div>
  );
};

export default Match;
