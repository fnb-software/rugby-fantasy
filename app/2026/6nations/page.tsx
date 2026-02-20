import Team from "./Team";
import TeamsOfTheRound from "./TeamsOfTheRound";
import Solve from "./solver/Solve";

const Fantasy = async () => {
  return (
    <div className="w-full">
      <TeamsOfTheRound
        teams={[
          <Team
            teamIds={[
              273, 401, 962, 291, 1341, 233, 710, 690, 113, 121, 704, 400, 1260,
              368, 964, 318,
            ]}
            round={0}
            captainId={121}
          ></Team>,
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold">Cheapest</h3>
              <Team
                teamIds={[
                  273, 401, 161, 1341, 1329, 233, 286, 398, 352, 117, 420, 82,
                  1982, 1322, 1968, 1345,
                ]}
                round={1}
                captainId={117}
              ></Team>
            </div>
            <div>
              <h3 className="font-bold">More expensive (same points)</h3>
              <Team
                teamIds={[
                  273, 401, 161, 1341, 1329, 233, 286, 398, 113, 117, 420, 82,
                  1982, 191, 1968, 1345,
                ]}
                round={1}
                captainId={117}
              ></Team>
            </div>
          </div>,
          <EmptyTeam round={2}></EmptyTeam>,
          <EmptyTeam round={3}></EmptyTeam>,
          <EmptyTeam round={4}></EmptyTeam>,
        ]}
      ></TeamsOfTheRound>
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => "Awaiting round";

export default Fantasy;
