import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPlayers } from '@/app/lib/players';
import { getAdminData } from '@/app/lib/adminData';
import NoPlayers from './NoPlayers';
import Team from './Team';
import TeamsOfTheRound from './TeamsOfTheRound';

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/2027/top14');
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;
  const admin = await getAdminData();
  const { teams, teamsNoClubLimit, teamsSecondNoClubLimit, currentRound } =
    admin;

  return (
    <div className="w-full">
      <TeamsOfTheRound
        defaultRound={currentRound}
        teams={teams.map((team, i) =>
          team?.teamIds ? (
            <div className="flex gap-7">
              <div>
                <h3 className="font-bold">Full rules</h3>
                <Team
                  players={players}
                  teamIds={team.teamIds}
                  round={i}
                  captainId={team.captainId}
                ></Team>
              </div>
            </div>
          ) : (
            <EmptyTeam round={i}></EmptyTeam>
          ),
        )}
      ></TeamsOfTheRound>
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => 'Awaiting round';

export default Fantasy;
