import { useState } from "react";

const getSlotPosition = ({ slotIndex }: { slotIndex: number }) => {
  if (slotIndex < 15) return 15 - slotIndex;
  if (slotIndex === 15) return "(S)";
  return "(s)";
};

const getSlotScore = ({
  player,
  slotIndex,
}: {
  player: any;
  slotIndex: number;
}) => {
  if (!player) return undefined;
  if (slotIndex < 15) return player.expectedStarterPoints;
  if (slotIndex === 15) return player.expectedSubPoints * 3;
  return player.expectedStarterPoints / 2;
};

const SelectedPlayers = ({
  players,
  removePlayer,
  onSolveTeam,
  excludeStarter,
  excludeSub,
  onSearchPlayer,
}) => {
  const [status, setStatus] = useState<"solving" | undefined>(undefined);
  const [lockedPlayerIds, setLockedPlayerIds] = useState<string[]>([]);
  if (!players) {
    return null;
  }

  const lockPlayer = (player) => {
    setLockedPlayerIds((ids) => ids.concat([player.id]));
  };

  const unlockPlayer = (player) => {
    setLockedPlayerIds((ids) => ids.filter((id) => id !== player.id));
  };

  return (
    <div>
      <div>
        <button
          onClick={async () => {
            setStatus("solving");
            try {
              await onSolveTeam({
                lockedPlayers: lockedPlayerIds
                  .map((id) => {
                    const index = players.findIndex(
                      (player) => player?.id === id,
                    );
                    const player = players[index];
                    return { player, index };
                  })
                  .filter(({ player }) => !!player),
              });
            } catch (e) {
              console.log("Something went wrong");
              console.error(e);
            }
            setStatus(undefined);
          }}
          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          disabled={status === "solving"}
        >
          {status === "solving" && (
            <>
              <span className="inline-block animate-spin mr-2">߷</span>
              Solving team
            </>
          )}
          {!status && <>Solve team</>}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th>Owner</th>
            <th>Sheets</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, slotIndex) => (
            <Player
              key={player?.id ?? `slot-${slotIndex}`}
              player={player}
              slotIndex={slotIndex}
              removePlayer={removePlayer}
              excludePlayer={slotIndex === 15 ? excludeSub : excludeStarter}
              isLocked={player ? lockedPlayerIds.includes(player.id) : false}
              lockPlayer={lockPlayer}
              unlockPlayer={unlockPlayer}
              onSearchPlayer={() => onSearchPlayer(slotIndex)}
            />
          ))}
        </tbody>
      </table>
      <div>
        Total:{" "}
        {(
          players
            .slice(0, 15)
            .reduce(
              (total, player) => total + (player?.expectedStarterPoints || 0),
              0,
            ) +
          players
            .slice(16, 18)
            .reduce(
              (total, player) => total + (player?.expectedStarterPoints || 0),
              0,
            ) /
            2 +
          (players[15] ? players[15].expectedSubPoints * 3 : 0)
        ).toFixed(0)}{" "}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {(
          Object.entries(
            players
              .filter(
                (player) =>
                  player?.proprietaire?.id !== "" && player?.proprietaire?.nom,
              )
              .reduce((countByOwner: Record<string, number>, player) => {
                const ownerName = player.proprietaire.nom;
                countByOwner[ownerName] = (countByOwner[ownerName] || 0) + 1;
                return countByOwner;
              }, {}),
          ) as [string, number][]
        )
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([ownerName, count]) => (
            <span
              key={ownerName}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
            >
              {ownerName} - <span className="font-bold">{count}</span>
            </span>
          ))}
      </div>
    </div>
  );
};

const Player = ({
  player,
  slotIndex,
  removePlayer,
  excludePlayer,
  isLocked,
  lockPlayer,
  unlockPlayer,
  onSearchPlayer,
}) => (
  <tr className={isLocked ? "font-bold" : ""}>
    <td className="">{getSlotPosition({ slotIndex })}</td>
    <td className="pl-2">{player?.nom}</td>
    <td className="pl-5">{player?.trgclub}</td>
    <td className="pl-5 text-xs">
      {player ? (
        player.proprietaire?.id === "" ? (
          <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded font-medium">
            free
          </span>
        ) : (
          <span className="text-slate-500">{player.proprietaire?.nom}</span>
        )
      ) : (
        ""
      )}
    </td>
    <td className="pl-7 text-right">
      {player ? `${player.startCount}/${player.subCount}` : ""}
    </td>
    <td className="text-right pl-5">
      {(getSlotScore({ player, slotIndex }) || 0).toFixed(1)}
    </td>
    <td className="pl-5">
      {player ? (
        <div className={"flex gap-2"}>
          {isLocked ? (
            <button
              title="Unlock this player from the team"
              onClick={() => unlockPlayer(player)}
              className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              🔓
            </button>
          ) : (
            <button
              title="Lock this player in the team"
              onClick={() => lockPlayer(player)}
              className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              🔒
            </button>
          )}
          <button
            title="Remove from the team"
            onClick={() => removePlayer(player)}
            className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            ⏏️
          </button>
          <button
            title="Exclude from stats"
            onClick={() => {
              excludePlayer(player);
              removePlayer(player);
            }}
            className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            🚫
          </button>
        </div>
      ) : (
        <div className={"flex gap-2"}>
          <button
            title="Add player"
            onClick={() => onSearchPlayer()}
            className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            ➕
          </button>
        </div>
      )}
    </td>
  </tr>
);

export default SelectedPlayers;
