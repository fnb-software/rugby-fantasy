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
              186, 1332, 1027, 113, 30, 548, 658, 1571, 842, 1239, 416, 1056,
              1507, 207, 80, 928, 957, 369,
            ]}
            round={16}
            captainId={80}
          ></Team>,

          <EmptyTeam round={17}></EmptyTeam>,
          <EmptyTeam round={18}></EmptyTeam>,
          <EmptyTeam round={19}></EmptyTeam>,
          <EmptyTeam round={20}></EmptyTeam>,
        ]}
      ></TeamsOfTheRound>
    </div>
  );
};

const EmptyTeam = (props: { round: number }) => "Awaiting round";

export default Fantasy;
