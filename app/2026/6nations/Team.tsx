import players from "../../../2026/6nations/data/players";
import {
  getPlayerCostForRound,
  getPlayerScoreForRound,
  getPlayerCostNewForRound,
} from "../../../2026/6nations/minizinc/params";

const Team = ({
  teamIds,
  round,
  captainId,
}: {
  teamIds: number[];
  round: number;
  captainId: number;
}) => {
  const team = teamIds.map((id) => players.find((p) => p.id === id));
  const captain = team.find((p) => p?.id === captainId);
  const supersub = team[15];
  const getPlayerScore = getPlayerScoreForRound(round);
  const getPlayerCost = getPlayerCostForRound(round);
  const getPlayerCostNew = getPlayerCostNewForRound(round);

  const teamPoints = team.reduce(
    (total, p) => total + (getPlayerScore(p) || 0),
    getPlayerScore(captain) + 2 * getPlayerScore(supersub),
  );

  const teamCost =
    team.reduce((total, p) => total + 10 * (getPlayerCost(p) || 0), 0) / 10;
  const teamCostNew =
    team.reduce((total, p) => total + 10 * (getPlayerCostNew(p) || 0), 0) / 10;
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th></th>
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
                {i === 15 ? "(s)" : i + 1} {p === captain ? "(c)" : ""}
              </td>
              <td className="pr-5">{p?.nom}</td>
              <td className="pr-5">{p?.trgclub}</td>
              <td className="pr-2">{getPlayerCost(p)}</td>
              <td className="text-right">
                {getPlayerScore(p) * (i === 15 ? 3 : p === captain ? 2 : 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <div>
        Points: {teamPoints} - Cost: {teamCost} - Budget gained:{" "}
        {(teamCostNew * 10 - teamCost * 10) / 10}
      </div>
    </div>
  );
};

export default Team;
