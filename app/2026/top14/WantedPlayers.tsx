const WantedPlayers = ({ players, owners, excludePlayer, setBidWinner }) => {
  if (!players) {
    return null;
  }
  const wantedPlayers = players.filter((p) => p.offres_encours);

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>Sheets</th>
            <th>Score</th>
            <th>Bid winner</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {wantedPlayers.map((player) => {
            return (
              <Player
                key={player.id}
                player={player}
                score={player.expectedStarterPoints}
                owners={owners}
                excludePlayer={excludePlayer}
                setBidWinner={setBidWinner}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Player = ({ player, score, owners, excludePlayer, setBidWinner }) => {
  const currentOwnerKey =
    player.proprietaire?.id === ""
      ? "__free__"
      : player.proprietaire?.nom ?? "__free__";
  return (
    <tr>
      <td className="">
        {player.offres_encours_nb}{" "}
        {player.offres_encours_parmoi &&
          (player.offres_encours_nb === 1 ? "✅" : "⚡")}
      </td>
      <td className="pl-2">{player.nom}</td>
      <td className="pl-2">{player.position}</td>
      <td className="pl-5">{player.trgclub}</td>
      <td className="pl-7 text-right">
        {player.startCount}/{player.subCount}
      </td>
      <td className="text-right pl-5">{(score || 0).toFixed(1)}</td>
      <td className="pl-5">
        <select
          value={currentOwnerKey}
          onChange={(e) => setBidWinner(player.id, e.target.value)}
          className="border border-slate-200 rounded px-1 py-0.5 text-xs"
        >
          <option value="__free__">Free</option>
          {owners.map((o: string) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="pl-1">
        <button
          title="Exclude from stats"
          onClick={() => excludePlayer(player)}
          className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          🚫
        </button>
      </td>
    </tr>
  );
};

export default WantedPlayers;
