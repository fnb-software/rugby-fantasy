import Team from "./Team";
import TeamsOfTheRound from "./TeamsOfTheRound";
import { TEAMS_SECOND_NO_CLUB_LIMIT } from "./bestSecondTeamsNoClubLimits";
import { TEAMS } from "./bestTeams";
import { TEAMS_NO_CLUB_LIMIT } from "./bestTeamsNoClubLimit";

const Fantasy = async () => {
  return (
    <div className="w-full">
      <TeamsOfTheRound
        teams={TEAMS.map((team, i) =>
          team.teamIds ? (
            <div className="flex gap-7">
              <div>
                <h3 className="font-bold">Full rules</h3>
                <Team
                  teamIds={team.teamIds}
                  round={i}
                  captainId={team.captainId}
                ></Team>
              </div>
              <div>
                <h3 className="font-bold">No club limit</h3>
                <Team
                  teamIds={TEAMS_NO_CLUB_LIMIT[i].teamIds}
                  round={i}
                  captainId={TEAMS_NO_CLUB_LIMIT[i].captainId}
                ></Team>
              </div>
              <div>
                <h3 className="font-bold">B - No club limit</h3>
                <Team
                  teamIds={TEAMS_SECOND_NO_CLUB_LIMIT[i].teamIds}
                  round={i}
                  captainId={TEAMS_SECOND_NO_CLUB_LIMIT[i].captainId}
                ></Team>
              </div>
            </div>
          ) : (
            <EmptyTeam round={i}></EmptyTeam>
          ),
        )}
      ></TeamsOfTheRound>
      <Team
        round={17}
        teamIds={[
          70, 174, 430, 382, 1730, 354, 509, 391, 121, 457, 498, 1298, 177, 371,
          1505, 1032, 32, 491,
        ]}
        captainId={509}
      />
      <Team
        round={17}
        teamIds={[
          70, 595, 594, 382, 1730, 1032, 354, 509, 800, 457, 881, 1298, 549,
          498, 369, 1505, 1339, 997,
        ]}
        captainId={509}
      />
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => "Awaiting round";

export default Fantasy;
