import Team from "./Team";
import TeamsOfTheRound from "./TeamsOfTheRound";
import Solve from "./solver/Solve";

const Fantasy = async () => {
  return (
    <div className="w-full">
      <TeamsOfTheRound
        teams={[
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold">Within 200 budget</h3>
              <Team
                teamIds={[
                  273, 401, 962, 291, 1341, 233, 710, 1320, 352, 121, 704, 400,
                  257, 368, 964, 318,
                ]}
                round={0}
                captainId={121}
              ></Team>
            </div>
            <div>
              <h3 className="font-bold">With unlimited budget</h3>
              <Team
                teamIds={[
                  273, 208, 962, 291, 1341, 233, 710, 395, 113, 121, 704, 400,
                  257, 368, 964, 318,
                ]}
                round={0}
                captainId={121}
              ></Team>
            </div>
          </div>,
          <Team
            teamIds={[
              273, 401, 161, 1341, 1329, 233, 286, 398, 113, 117, 420, 82, 1982,
              191, 1968, 1345,
            ]}
            round={1}
            captainId={117}
          ></Team>,
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
