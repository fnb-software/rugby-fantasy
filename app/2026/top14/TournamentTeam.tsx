import {
  getPlayerScoreTotal,
  getPlayerSubTotal,
} from "../../../2026/top14/minizinc/params";

const TournamentTeam = ({
  players,
  teamIds,
  captainId,
}: {
  players: any[];
  teamIds: number[];
  captainId: number;
}) => {
  const team = teamIds.map((id) => players.find((p) => p.id === id));
  const captain = team.find((p) => p?.id === captainId);
  const supersub = team[15];
  const sub1 = team[16];
  const sub2 = team[17];
  const getPlayerScore = getPlayerScoreTotal();
  const getPlayerSub = getPlayerSubTotal();

  const supersubPointsAsStarter =
    getPlayerScore(supersub) - getPlayerSub(supersub);
  const supersubPointOffset =
    3 * getPlayerSub(supersub) -
    getPlayerScore(supersub) +
    supersubPointsAsStarter / 2;

  const teamPoints =
    team.reduce(
      (total, p) => total + (getPlayerScore(p) || 0),
      getPlayerScore(captain) +
        supersubPointOffset -
        getPlayerScore(sub1) / 2 -
        getPlayerScore(sub2) / 2,
    ) / 20;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {team.map((p, i) => (
            <tr key={p?.id}>
              <td className="pr-2">
                {i > 15 ? "(s)" : i === 15 ? "(S)" : i + 1}{" "}
                {p === captain ? "(c)" : ""}
              </td>
              <td className="pr-5">{p?.nom}</td>
              <td className="pr-5">{p?.trgclub}</td>
              <td className="text-right">
                {(i === 15
                  ? 6 * getPlayerSub(p) + supersubPointsAsStarter
                  : getPlayerScore(p) * (i > 15 ? 1 : p === captain ? 4 : 2)) /
                  40}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <div>Points: {teamPoints}</div>
    </div>
  );
};

export default TournamentTeam;
