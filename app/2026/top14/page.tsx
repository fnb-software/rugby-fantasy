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
              525, 118, 517, 1310, 758, 957, 1082, 1440, 588, 1239, 442, 1528,
              1229, 881, 1513, 165, 633, 1510,
            ]}
            round={15}
            captainId={1082}
          ></Team>,
          <Team
            teamIds={[
              186, 1332, 1027, 113, 30, 548, 658, 1571, 842, 605, 416, 1056,
              1507, 80, 369, 928, 957, 1239,
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
