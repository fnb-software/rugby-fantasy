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
      <ul className="flex flex-col gap-1">
        {team.map((p, i) => (
          <li key={p.id}>
            {i + 1}. {p === captain ? '(c)' : ''} {p.firstName} {p.lastName} (
            {squads.find((s) => p.squadId === s.id)?.abbreviation} -{' '}
            {p.cost / 1000000}) - {getPlayerScore(p)}
          </li>
        ))}
      </ul>
      <br />
      <div>
        Points: {teamPoints} - Cost: {teamCost}
      </div>
    </div>
  );
};

export default Team;
