import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayers } from "@/app/lib/players";
import { getAdminData } from "@/app/lib/adminData";
import Team from "./Team";
import TeamsOfTheRound from "./TeamsOfTheRound";
import TournamentTeam from "./TournamentTeam";

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/2026/top14");
  const players = (await getPlayers(session.user.id)) as any[];
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
              {teamsNoClubLimit[i] && (
                <div>
                  <h3 className="font-bold">No club limit</h3>
                  <Team
                    players={players}
                    teamIds={teamsNoClubLimit[i]!.teamIds}
                    round={i}
                    captainId={teamsNoClubLimit[i]!.captainId}
                  ></Team>
                </div>
              )}
              {teamsSecondNoClubLimit[i] && (
                <div>
                  <h3 className="font-bold">B - No club limit</h3>
                  <Team
                    players={players}
                    teamIds={teamsSecondNoClubLimit[i]!.teamIds}
                    round={i}
                    captainId={teamsSecondNoClubLimit[i]!.captainId}
                  ></Team>
                </div>
              )}
            </div>
          ) : (
            <EmptyTeam round={i}></EmptyTeam>
          ),
        )}
      ></TeamsOfTheRound>
      <br />
      <br />
      <br />
      <div>
        <h1>Team of the championship</h1>
        <TournamentTeam
          players={players}
          teamIds={[
            160, 1284, 1283, 599, 113, 957, 1082, 866, 588, 1586, 416, 890, 919,
            1016, 633, 609, 1239, 283,
          ]}
          captainId={1586}
        />
        <TeamsOfTheRound
          defaultRound={currentRound}
          teams={teams.map((team, i) =>
            team?.teamIds ? (
              <Team
                players={players}
                round={i}
                teamIds={[
                  160, 1284, 1283, 599, 113, 957, 1082, 866, 588, 1586, 416,
                  890, 919, 1016, 633, 609, 1239, 283,
                ]}
                captainId={1586}
              />
            ) : (
              <EmptyTeam round={i}></EmptyTeam>
            ),
          )}
        ></TeamsOfTheRound>
      </div>
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => "Awaiting round";

export default Fantasy;
