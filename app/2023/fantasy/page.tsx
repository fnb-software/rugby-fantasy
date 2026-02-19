import Team from './Team';
import TeamsOfTheRound from './TeamsOfTheRound';
import Solve from './solver/Solve';

const Fantasy = async () => {
  return (
    <div className="w-full">
      <TeamsOfTheRound
        teams={[
          <Team
            teamIds={[
              58, 175, 221, 244, 246, 278, 282, 311, 320, 35, 38, 236, 650, 360,
              615,
            ]}
            round={1}
            captainId={236}
          ></Team>,
          <Team
            teamIds={[
              90, 461, 571, 401, 403, 116, 248, 629, 545, 355, 356, 236, 364,
              517, 519,
            ]}
            round={2}
            captainId={517}
          ></Team>,
          <Team
            teamIds={[
              26, 109, 570, 400, 401, 183, 598, 630, 193, 99, 102, 269, 620,
              165, 484,
            ]}
            round={3}
            captainId={165}
          ></Team>,
          <Team
            teamIds={[
              61, 366, 570, 50, 401, 20, 21, 373, 608, 483, 8, 332, 492, 357,
              485,
            ]}
            round={4}
            captainId={485}
          ></Team>,
          <Team
            teamIds={[
              381, 175, 410, 112, 401, 183, 311, 436, 385, 163, 4, 393, 556,
              358, 550,
            ]}
            round={5}
            captainId={358}
          ></Team>,
          <Team
            teamIds={[
              156, 175, 187, 111, 147, 115, 150, 373, 193, 2, 357, 136, 236,
              518, 615,
            ]}
            round={6}
            captainId={175}
          ></Team>,
          <Team
            teamIds={[
              26, 526, 539, 528, 529, 116, 373, 375, 33, 353, 3, 10, 362, 4,
              357,
            ]}
            round={7}
            captainId={357}
          ></Team>,
          <Team
            teamIds={[
              121, 109, 540, 368, 370, 115, 532, 679, 32, 354, 3, 362, 524, 4,
              360,
            ]}
            round={8}
            captainId={115}
          ></Team>,
        ]}
      ></TeamsOfTheRound>
    </div>
  );
};

export default Fantasy;
