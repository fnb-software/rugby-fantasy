import getTeamDuelStats from "@/2023/other/getTeamDuelStats";
import StatsChoice from "./StatsChoice";

const Match = async ({ params: { duel } }: { params: { duel: string } }) => {
  const team1Name = duel.slice(0, 3);
  const team2Name = duel.slice(4, 7);
  const duelCount = duel.slice(7, 8);
  const { statsPreview, stats } = getTeamDuelStats({
    team1Name,
    team2Name,
    duelCount: duelCount ? Number(duelCount) : undefined,
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
