import { useState } from "react";

const getSlotPosition = ({ slotIndex }: { slotIndex: number }) => {
  if (slotIndex < 15) return 15 - slotIndex;
  if (slotIndex === 15) return "(S)";
  if (slotIndex >= 18) return "(R)";
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
  if (slotIndex === 15)
    return Math.max(
      player.expectedSubPoints * 3,
      player.expectedStarterPoints / 2,
    );
  if (slotIndex >= 18) return 0;
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
  const [lockedCaptainId, setLockedCaptainId] = useState<string | number | null>(null);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [hoveredOwner, setHoveredOwner] = useState<string | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  if (!players) {
    return null;
  }

  const lockedCaptainIndex = lockedCaptainId
    ? players
        .slice(0, 15)
        .findIndex((player) => player?.id === lockedCaptainId)
    : -1;
  const captainIndex =
    lockedCaptainIndex !== -1
      ? lockedCaptainIndex
      : players
          .slice(0, 15)
          .reduce(
            (bestIndex, player, index) =>
              player &&
              (bestIndex === -1 ||
                player.expectedStarterPoints >
                  players[bestIndex].expectedStarterPoints)
                ? index
                : bestIndex,
            -1,
          );

  const toggleCaptainLock = (player) => {
    setLockedCaptainId((currentId) =>
      currentId === player.id ? null : player.id,
    );
  };

  const lockPlayer = (player) => {
    setLockedPlayerIds((ids) => ids.concat([player.id]));
  };

  const unlockPlayer = (player) => {
    setLockedPlayerIds((ids) => ids.filter((id) => id !== player.id));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          placeholder="Budget"
          value={budget ?? ""}
          onChange={(e) => setBudget(e.target.value ? parseFloat(e.target.value) : undefined)}
          className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-24"
        />
        <button
          onClick={async () => {
            setStatus("solving");
            try {
              const result = await onSolveTeam({
                budget,
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
              if (result?.captainId != null) {
                setLockedCaptainId(result.captainId);
              }
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
              isHighlighted={
                (hoveredOwner !== null &&
                  player?.proprietaire?.nom === hoveredOwner) ||
                (hoveredTeam !== null && player?.trgclub === hoveredTeam)
              }
              isCaptain={slotIndex === captainIndex}
              isCaptainLocked={
                !!player && player.id === lockedCaptainId
              }
              canBeCaptain={slotIndex < 15}
              toggleCaptainLock={toggleCaptainLock}
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
          (captainIndex !== -1
            ? players[captainIndex].expectedStarterPoints
            : 0) +
          players
            .slice(16, 18)
            .reduce(
              (total, player) => total + (player?.expectedStarterPoints || 0),
              0,
            ) /
            2 +
          (players[15]
            ? Math.max(
                players[15].expectedSubPoints * 3,
                players[15].expectedStarterPoints / 2,
              )
            : 0)
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
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded cursor-default"
              onMouseEnter={() => setHoveredOwner(ownerName)}
              onMouseLeave={() => setHoveredOwner(null)}
            >
              {ownerName} - <span className="font-bold">{count}</span>
            </span>
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {(
          Object.entries(
            players
              .filter((player) => player?.trgclub)
              .reduce((countByTeam: Record<string, number>, player) => {
                const teamName = player.trgclub;
                countByTeam[teamName] = (countByTeam[teamName] || 0) + 1;
                return countByTeam;
              }, {}),
          ) as [string, number][]
        )
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([teamName, count]) => (
            <span
              key={teamName}
              className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded cursor-default"
              onMouseEnter={() => setHoveredTeam(teamName)}
              onMouseLeave={() => setHoveredTeam(null)}
            >
              {teamName} - <span className="font-bold">{count}</span>
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
  isHighlighted,
  isCaptain,
  isCaptainLocked,
  canBeCaptain,
  toggleCaptainLock,
}) => (
  <tr className={`${isLocked ? "font-bold" : ""} ${isHighlighted ? "bg-yellow-100" : ""}`}>
    <td className="">{getSlotPosition({ slotIndex })}</td>
    <td className="pl-2">{isCaptain && player ? "(c) " : ""}{player?.nom}{player?.hasTeamsheet && !player?.isTeamsheetStarter && !player?.isTeamsheetSub ? " ⚠️" : ""}</td>
    <td className="pl-5">{player?.trgclub}</td>
    <td className="pl-5 text-xs">
      {player ? (
        player.proprietaire?.id === "" ? (
          <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded font-medium">
            free
          </span>
        ) : player.offres_encours_parmoi ? (
          <span className="text-slate-400 italic" title="Pending offer">
            {player.proprietaire?.nom} ~
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
          {slotIndex < 18 &&
            (isLocked ? (
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
            ))}
          {canBeCaptain && (
            <button
              title={
                isCaptainLocked
                  ? "Unlock captain (auto-select highest scorer)"
                  : "Lock this player as captain"
              }
              onClick={() => toggleCaptainLock(player)}
              className={`px-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                isCaptainLocked
                  ? "text-white bg-amber-500 hover:bg-amber-400"
                  : "text-slate-700 bg-slate-200 hover:bg-slate-50"
              }`}
            >
              🎖️
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
          <a
            href={`https://www.allrugby.com/recherche?q=${(player.nomcomplet || player.nom).replace(/ /g, "+")}`}
            target="_blank"
            rel="noreferrer"
            title="Search on allrugby.com"
            className="px-1 py-1 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            🔍
          </a>
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
