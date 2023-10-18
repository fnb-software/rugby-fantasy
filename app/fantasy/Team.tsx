import players from '../../data/players';
import squads from '../../data/squads';
import { getPlayerScoreForRound } from '../../minizinc/params';

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
  const captain = players.find((p) => p.id === captainId);
  const getPlayerScore = getPlayerScoreForRound(round);

  const teamPoints = team.reduce(
    (total, p) => total + (getPlayerScore(p) || 0),
    getPlayerScore(captain)
  );

  const teamCost = team.reduce((total, p) => total + p.cost, 0) / 1000000;
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
            <tr key={p.id}>
              <td className="pr-2">
                {i + 1} {p === captain ? '(c)' : ''}
              </td>
              <td className="pr-5">
                {p.firstName} {p.lastName}
              </td>
              <td className="pr-5">
                {squads.find((s) => p.squadId === s.id)?.abbreviation}
              </td>
              <td className="pr-2">{p.cost / 1000000}</td>
              <td className="text-right">{getPlayerScore(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <div>
        Points: {teamPoints} - Cost: {teamCost}
      </div>
    </div>
  );
};

export default Team;
