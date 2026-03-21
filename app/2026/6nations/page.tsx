import Team from "./Team";
import TeamsOfTheRound from "./TeamsOfTheRound";
import TournamentTeam from "./TournamentTeam";
import Solve from "./solver/Solve";

const Fantasy = async () => {
  return (
    <div className="w-full flex flex-col gap-4">
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
          <Team
            teamIds={[
              161, 324, 263, 291, 1257, 351, 249, 1279, 283, 83, 108, 314, 703,
              191, 1968, 1273,
            ]}
            round={2}
            captainId={283}
          ></Team>,

          <Team
            teamIds={[
              161, 338, 218, 291, 682, 286, 1320, 1273, 113, 705, 704, 400, 257,
              191, 100, 1331,
            ]}
            round={3}
            captainId={286}
          ></Team>,
          <Team
            teamIds={[
              149, 338, 184, 369, 145, 182, 28, 351, 113, 117, 704, 400, 257,
              368, 100, 1374,
            ]}
            round={4}
            captainId={704}
          ></Team>,
        ]}
      ></TeamsOfTheRound>
      <div>
        <h2 className="font-bold">Team of the Tournament</h2>
        <TournamentTeam
          teamIds={[
            342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400, 257, 704,
            191, 318,
          ]}
          captainId={704}
        ></TournamentTeam>
        <div>
          <TeamsOfTheRound
            teams={[
              <Team
                teamIds={[
                  342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400,
                  257, 704, 191, 318,
                ]}
                captainId={704}
                round={0}
              ></Team>,
              <Team
                teamIds={[
                  342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400,
                  257, 704, 191, 318,
                ]}
                captainId={704}
                round={1}
              ></Team>,
              <Team
                teamIds={[
                  342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400,
                  257, 704, 191, 318,
                ]}
                captainId={704}
                round={2}
              ></Team>,

              <Team
                teamIds={[
                  342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400,
                  257, 704, 191, 318,
                ]}
                captainId={704}
                round={3}
              ></Team>,
              <Team
                teamIds={[
                  342, 338, 161, 291, 369, 182, 28, 351, 113, 117, 108, 400,
                  257, 704, 191, 318,
                ]}
                captainId={704}
                round={4}
              ></Team>,
            ]}
          ></TeamsOfTheRound>
        </div>
      </div>
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => "Awaiting round";

export default Fantasy;
