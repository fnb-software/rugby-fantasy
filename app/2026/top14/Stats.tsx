"use client";
import { Bar, getDatasetAtEvent, getElementAtEvent } from "react-chartjs-2";
import {
  CategoryScale,
  Chart,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import countBy from "lodash/countBy";
import sortBy from "lodash/sortBy";
import { TEAMS } from "./bestTeams";
import players from "../../../2026/top14/data/players";
import rounds from "../../../2026/top14/data/rounds";
import getDznFromStats from "../../../2026/top14/minizinc/getDznFromStats";
import { useEffect, useRef, useState } from "react";
import SelectedPlayers from "./SelectedPlayers";
import { solve } from "./solve";
import fantasyModel from "../../../2026/top14/minizinc/fantasy_total.mzn";
import WantedPlayers from "./WantedPlayers";
import { assignPlayerToSlot } from "./slots";
import { TEAMSHEETS } from "./teamsheets";
import {
  getRoundPlayerOnlyPoints,
  getTeamPoints,
  matchesName,
  TEAM_RESULTS_EXPECTED,
  POSITION_LABELS,
} from "./statsUtil";
import TeamResultsEditor from "./TeamResultsEditor";

const flatPlayers = TEAMS.map((team) => team.teamIds || []).flat();
const allClubs = [
  ...new Set(
    flatPlayers.map((id) => {
      const player = players.find((p) => p.id === id);
      return player.trgclub;
    }),
  ),
].sort();
const allPositions = [
  ...new Set(
    players.map((p) => {
      return p.position;
    }),
  ),
].sort();
const allOwners = [
  ...new Set(
    players.map((p) => {
      return p.proprietaire.nom;
    }),
  ),
]
  .filter((owner) => owner !== undefined)
  .sort();

const countedPlayers = countBy(flatPlayers);
const sortedPlayers = sortBy(
  Object.keys(countedPlayers).map((id) => {
    const player = players.find((p) => p.id === parseInt(id));
    return { bestTeamCount: countedPlayers[id], ...player };
  }),
  (player) => -player.bestTeamCount,
);

const countedClubs = countBy(
  flatPlayers.map((id) => {
    const player = players.find((p) => p.id === id);
    return player.trgclub;
  }),
);
const sortedClubs = sortBy(
  Object.keys(countedClubs).map((name) => {
    return { bestTeamCount: countedClubs[name], name };
  }),
  (club) => -club.bestTeamCount,
);

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Stats = () => {
  const [club, setClub] = useState("");
  const [position, setPosition] = useState("");
  const [owner, setOwner] = useState("");
  const [maxRound, setMaxRound] = useState(0);
  const [player, setPlayer] = useState(undefined);
  const [excludedStarterPlayers, setExcludedStarterPlayers] = useState([]);
  const [excludedSubPlayers, setExcludedSubPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | null)[]>(
    Array(18).fill(null),
  );
  const [popover, setPopover] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: undefined,
    event: undefined,
  });
  const [searchModal, setSearchModal] = useState<{
    visible: boolean;
    position: any;
  }>({ visible: false, position: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByTeamsheet, setFilterByTeamsheet] = useState(true);
  const [teamResultsExpected, setTeamResultsExpected] = useState<Record<string, number>>({ ...TEAM_RESULTS_EXPECTED });
  const [minSheetsPerPlayer, setMinSheetsPerPlayer] = useState(3);

  const chartRef = useRef();
  const starterRef = useRef();
  const subRef = useRef();

  // Close popover if clicking outside the chart
  useEffect(() => {
    const handleClickOutside = () => setPopover({ ...popover, visible: false });
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [popover]);

  const onClickStarterPlayer = (event) => {
    const chart = starterRef.current;
    if (!chart) return;

    // Find the element under the click
    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      "nearest",
      { intersect: true },
      true,
    );

    if (points.length > 0) {
      event.nativeEvent.stopPropagation(); // Prevent immediate closing from the window listener
      const firstPoint = points[0];
      const label = chart.data.labels[firstPoint.index];
      const value =
        chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];

      // Get position of the clicked bar
      const { offsetLeft, offsetTop } = chart.canvas;

      setPopover({
        visible: true,
        x: offsetLeft + firstPoint.element.x,
        y: offsetTop + firstPoint.element.y,
        data: { label, value },
        event,
      });
    } else {
      setPopover({ ...popover, visible: false });
    }
  };

  const onClickPlayerOfTheRound = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    console.log(element);
    if (!element) {
      setPlayer(undefined);
      return;
    }
    setPlayer(playersOfTheRoundToShow[element[0].index]);
  };

  const onClickExcludeStarterPlayer = (event) => {
    const element = getElementAtEvent(starterRef.current, event);
    if (!element) {
      return;
    }
    setExcludedStarterPlayers((players) =>
      players.concat([sortedStarterPoints[element[0].index].id]),
    );
    setPopover({ visible: false });
  };

  const onClickExcludeSubPlayer = (event) => {
    const element = getElementAtEvent(subRef.current, event);
    if (!element) {
      return;
    }
    setExcludedSubPlayers((players) =>
      players.concat([sortedSubPoints[element[0].index].id]),
    );
  };

  const allPlayersOfTheRound = club
    ? sortedPlayers.filter((player) => player.trgclub === club)
    : [...sortedPlayers];
  const playersOfTheRoundToShow = allPlayersOfTheRound.slice(0, 20);
  const actualOwner = owner.startsWith("free__")
    ? owner.slice("free__".length)
    : owner;
  const filteredOwner = owner
    ? owner === actualOwner
      ? players.filter(
          (p) => p.proprietaire.nom === owner,
          //&&   (!p.offres_encours || p.offres_encours_parmoi),
        )
      : players.filter(
          (p) => p.proprietaire.id === "" || p.proprietaire.nom === actualOwner,
        )
    : players;
  const filteredClubPlayers = club
    ? filteredOwner.filter((p) => p.trgclub === club)
    : filteredOwner;
  const filteredPlayers = position
    ? filteredClubPlayers.filter((p) => p.position === position)
    : filteredClubPlayers;

  const roundInfo = rounds.find(
    (round) =>
      parseInt(round.journee.numero) === (maxRound || TEAMS.length) + 1,
  );
  if (!roundInfo) {
    throw new Error(`Round not found ${(maxRound || TEAMS.length) + 1}`);
  }

  const playersWithPoints = filteredPlayers.map((p) => {
    const getRoundOnlyPoints = getRoundPlayerOnlyPoints(p);
    const match = roundInfo?.journee.matchs.find(
      (match) => p.club === match.clubdom || p.club === match.clubext,
    );
    if (!match) {
      throw new Error(`Match not found ${p.club}`);
    }
    const isMatchHome = p.club === match.clubdom;
    const nextRound = maxRound
      ? p.stats.detail.find((round) => round.numero === maxRound + 1)
      : undefined;
    const nextRoundPoints = nextRound && getRoundOnlyPoints(nextRound);
    const starterNextRoundPoints = nextRound?.titulaire ? nextRoundPoints : 0;
    const subNextRoundPoints = nextRound?.remplacant ? nextRoundPoints : 0;
    const starterPoints = p.stats.detail.reduce(
      ({ points, startCount, playerPoints, minutes }, round) => {
        if (round.titulaire && (!maxRound || round.numero <= maxRound)) {
          return {
            points: points + parseFloat(round.points) * 10,
            playerPoints: playerPoints + getRoundOnlyPoints(round),
            startCount: startCount + 1,
            minutes: minutes + round.minutes,
          };
        }
        return { points, startCount, playerPoints, minutes };
      },
      {
        points: 0,
        startCount: 0,
        playerPoints: 0,
        minutes: 0,
      },
    );
    const starterAverage = starterPoints.startCount
      ? starterPoints.points / starterPoints.startCount / 10
      : 0;
    const starterPlayerAverage = starterPoints.startCount
      ? starterPoints.playerPoints / starterPoints.startCount
      : 0;
    const starterMinutes = starterPoints.minutes
      ? starterPoints.minutes / starterPoints.startCount
      : 0;
    const subPoints = p.stats.detail.reduce(
      ({ points, subCount, playerPoints, minutes }, round) => {
        if (round.remplacant && (!maxRound || round.numero <= maxRound)) {
          return {
            points: points + parseFloat(round.points) * 10,
            playerPoints: playerPoints + getRoundOnlyPoints(round),
            subCount: subCount + 1,
            minutes: minutes + round.minutes,
          };
        }
        return { points, playerPoints, subCount, minutes };
      },
      {
        points: 0,
        subCount: 0,
        playerPoints: 0,
        minutes: 0,
      },
    );
    const subAverage = subPoints.subCount
      ? subPoints.points / subPoints.subCount / 10
      : 0;
    const subPlayerAverage = subPoints.subCount
      ? subPoints.playerPoints / subPoints.subCount
      : 0;
    const subMinutes = subPoints.minutes
      ? subPoints.minutes / subPoints.subCount
      : 0;

    const expectedTeamPoints = getTeamPoints({
      isMatchHome,
      result: maxRound
        ? parseInt(isMatchHome ? match.but_dom : match.but_ext) -
          parseInt(!isMatchHome ? match.but_dom : match.but_ext)
        : teamResultsExpected[p.club],
    });
    const nextRoundMinutes = nextRound?.minutes;
    const expectedStarterTeamPoints =
      (expectedTeamPoints * starterMinutes) / 80;
    const expectedStarterPoints =
      starterPlayerAverage + expectedStarterTeamPoints;
    const expectedSubTeamPoints = (expectedTeamPoints * subMinutes) / 80;
    const expectedSubPoints = subPlayerAverage + expectedSubTeamPoints;
    const actualTeamPoints = (expectedTeamPoints * nextRoundMinutes) / 80;

    const teamsheet = TEAMSHEETS[p.club];
    const isTeamsheetStarter =
      teamsheet?.starters.some((name) => matchesName(p, name)) ?? false;
    const isTeamsheetSub =
      teamsheet?.subs.some((name) => matchesName(p, name)) ?? false;

    return {
      ...p,
      isTeamsheetStarter,
      isTeamsheetSub,
      starterAverage,
      starterMinutes,
      subAverage,
      subMinutes,
      startCount: starterPoints.startCount,
      subCount: subPoints.subCount,
      subPlayerAverage,
      starterPlayerAverage,
      expectedTeamPoints,
      expectedStarterTeamPoints,
      expectedStarterPoints,
      expectedSubTeamPoints,
      expectedSubPoints,
      actualTeamPoints,
      starterNextRoundPoints,
      nextRoundMinutes,
      subNextRoundPoints,
    };
  });

  const sortedStarterPoints = sortBy(
    playersWithPoints.filter(
      (p) =>
        p.startCount >= minSheetsPerPlayer &&
        !excludedStarterPlayers.includes(p.id) &&
        (!filterByTeamsheet || p.isTeamsheetStarter),
    ),
    (p) => -p.expectedStarterPoints,
  ).slice(0, 40);
  const sortedSubPoints = sortBy(
    playersWithPoints.filter(
      (p) =>
        p.subCount >= minSheetsPerPlayer &&
        !excludedSubPlayers.includes(p.id) &&
        (!filterByTeamsheet || p.isTeamsheetSub),
    ),
    (p) => -p.expectedSubPoints,
  ).slice(0, 40);

  const selectedPlayers = selectedPlayerIds.map(
    (id) => (id == null ? null : playersWithPoints.find((p) => p.id === id) ?? null),
  );

  const addPlayerToSlots = (
    ids: (number | null)[],
    player: any,
    slotIndex?: number,
  ): (number | null)[] => {
    const resolved = ids.map(
      (id) => (id == null ? null : playersWithPoints.find((p) => p.id === id) ?? null),
    );
    return assignPlayerToSlot({ slots: resolved, player, slotIndex }).map(
      (p: any) => p?.id ?? null,
    );
  };

  const onClickAddStarterPlayer = (event) => {
    const element = getElementAtEvent(starterRef.current, event);
    if (!element) return;
    const player = sortedStarterPoints[element[0].index];
    const playerWithPoints = playersWithPoints.find((p) => p.id === player.id);
    setSelectedPlayerIds((ids) => addPlayerToSlots(ids, playerWithPoints));
    setPopover({ visible: false });
  };

  const onClickAddSubPlayer = (event) => {
    const element = getElementAtEvent(starterRef.current, event);
    if (!element) return;
    const player = sortedStarterPoints[element[0].index];
    const playerWithPoints = playersWithPoints.find((p) => p.id === player.id);
    setSelectedPlayerIds((ids) => {
      const emptySubIdx = [16, 17].find((i) => !ids[i]);
      return emptySubIdx !== undefined
        ? addPlayerToSlots(ids, playerWithPoints, emptySubIdx)
        : ids;
    });
    setPopover({ visible: false });
  };

  const onClickAddSupersub = (event) => {
    const element = getElementAtEvent(starterRef.current, event);
    if (!element) return;
    const player = sortedStarterPoints[element[0].index];
    const playerWithPoints = playersWithPoints.find((p) => p.id === player.id);
    setSelectedPlayerIds((ids) => addPlayerToSlots(ids, playerWithPoints, 15));
    setPopover({ visible: false });
  };

  return (
    <>
      <div>
        <label>
          Filter by team{` `}
          <select onChange={(e) => setClub(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allClubs.map((club) => (
              <option label={club} value={club}></option>
            ))}
          </select>
        </label>
      </div>

      <div className={`flex gap-4`}>
        <label>
          Filter by position{` `}
          <select onChange={(e) => setPosition(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allPositions.map((position) => (
              <option label={POSITION_LABELS[position] ?? position} value={position}></option>
            ))}
          </select>
        </label>
        <label>
          Filter by owner{` `}
          <select onChange={(e) => setOwner(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allOwners.map((owner) => (
              <option label={owner} value={owner}></option>
            ))}
            {allOwners.map((owner) => (
              <option
                label={`${owner} + free`}
                value={`free__${owner}`}
              ></option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={filterByTeamsheet}
            onChange={(e) => setFilterByTeamsheet(e.target.checked)}
          />
          Filter by teamsheet
        </label>
        <div className={`flex gap-4`}>
          <span>
            {excludedStarterPlayers.length} starters excluded{" "}
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
              onClick={() => setExcludedStarterPlayers([])}
            >
              Reset
            </button>
          </span>
          <span>
            {excludedSubPlayers.length} subs excluded{" "}
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
              onClick={() => setExcludedSubPlayers([])}
            >
              Reset
            </button>
          </span>
        </div>
      </div>
      <div>
        <label>
          Count stats until{` `}
          <select onChange={(e) => setMaxRound(parseInt(e.target.value))}>
            <option label={"All"} value={undefined}></option>
            {TEAMS.map((_, i) => (
              <option label={`Round ${i + 1}`} value={i + 1}></option>
            )).toReversed()}
          </select>
        </label>
      </div>
      {!maxRound && (
        <div>
          <TeamResultsEditor
            matches={roundInfo.journee.matchs}
            teamResultsExpected={teamResultsExpected}
            onChange={setTeamResultsExpected}
          />
        </div>
      )}
      <div>
        <label>
          Min teamsheets per player{` `}
          <input
            type="number"
            min={0}
            value={minSheetsPerPlayer}
            onChange={(e) => setMinSheetsPerPlayer(parseInt(e.target.value) || 0)}
            className="border border-slate-200 rounded px-2 py-1 w-16 text-sm"
          />
        </label>
      </div>
      <div className={`w-full h-[500px]`}>
        <Bar
          ref={starterRef}
          onClick={onClickStarterPlayer}
          data={{
            labels: sortedStarterPoints.map(
              (player) =>
                `${player.nom} - ${player.trgclub} - ${
                  player.startCount
                } - ${Math.round(player.starterMinutes)}`,
            ),
            datasets: maxRound
              ? [
                  {
                    label: "Max round starter player points",
                    data: sortedStarterPoints.map(
                      (p) => p.starterNextRoundPoints,
                    ),
                    borderWidth: 1,
                  },
                  {
                    label: "Actual team points",
                    data: sortedStarterPoints.map((p) => p.actualTeamPoints),
                    borderWidth: 1,
                    backgroundColor: "yellow",
                  },
                ]
              : [
                  {
                    label: "Starter player points",
                    data: sortedStarterPoints.map(
                      (p) => p.starterPlayerAverage,
                    ),
                    borderWidth: 1,
                  },
                  {
                    label: "Expected team points",
                    data: sortedStarterPoints.map(
                      (p) => p.expectedStarterTeamPoints,
                    ),
                    borderWidth: 1,
                    backgroundColor: "yellow",
                  },
                  {
                    label: "Starter team points",
                    data: sortedStarterPoints.map((p) =>
                      Math.round(p.starterAverage - p.starterPlayerAverage),
                    ),
                    borderWidth: 1,
                    backgroundColor: "purple",
                  },
                ],
          }}
          options={{
            scales: {
              x: {
                stacked: true, // Groups the bars together
              },
              y: {
                stacked: true, // Stacks the values vertically
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
      <div className={`w-full h-[500px]`}>
        <Bar
          ref={subRef}
          onClick={onClickExcludeSubPlayer}
          data={{
            labels: sortedSubPoints.map(
              (player) =>
                `${player.nom} - ${player.trgclub} - ${
                  player.subCount
                } - ${Math.round(player.subMinutes)}`,
            ),
            datasets: maxRound
              ? [
                  {
                    label: "Max round sub player points",
                    data: sortedSubPoints.map((p) => p.subNextRoundPoints),
                    borderWidth: 1,
                  },
                  {
                    label: "Actual team points",
                    data: sortedSubPoints.map((p) => p.actualTeamPoints),
                    borderWidth: 1,
                    backgroundColor: "yellow",
                  },
                ]
              : [
                  {
                    label: "Sub player points",
                    data: sortedSubPoints.map((p) => p.subPlayerAverage),
                    borderWidth: 1,
                  },
                  {
                    label: "Expected team points",
                    data: sortedSubPoints.map((p) => p.expectedSubTeamPoints),
                    borderWidth: 1,
                    backgroundColor: "yellow",
                  },
                  {
                    label: "Sub team points",
                    data: sortedSubPoints.map((p) =>
                      Math.round(p.subAverage - p.subPlayerAverage),
                    ),
                    borderWidth: 1,
                    backgroundColor: "purple",
                  },
                ],
          }}
          options={{
            scales: {
              x: {
                stacked: true, // Groups the bars together
              },
              y: {
                stacked: true, // Stacks the values vertically
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
      <div>
        <SelectedPlayers
          players={selectedPlayers}
          removePlayer={(player) => {
            setSelectedPlayerIds((ids) => ids.map((id) => (id === player.id ? null : id)));
          }}
          onSolveTeam={async ({ lockedPlayers }) => {
            const { teamIds, captainId } = await solve({
              fantasyModel,
              dznString: getDznFromStats({
                players: playersWithPoints.map((p) => {
                  const teamsheet = TEAMSHEETS[p.club];
                  const hasTeamsheet =
                    (teamsheet?.starters.length ?? 0) > 0 ||
                    (teamsheet?.subs.length ?? 0) > 0;
                  return {
                    ...p,
                    expectedStarterPoints:
                      excludedStarterPlayers.includes(p.id) ||
                      (filterByTeamsheet && hasTeamsheet && !p.isTeamsheetStarter)
                        ? 0
                        : p.expectedStarterPoints,
                    expectedSubPoints:
                      excludedSubPlayers.includes(p.id) ||
                      (filterByTeamsheet && hasTeamsheet && !p.isTeamsheetSub)
                        ? 0
                        : p.expectedSubPoints,
                  };
                }),
                lockedPlayers,
              }),
            });
            setSelectedPlayerIds(teamIds.map((id: number) => id ?? null));
          }}
          excludeStarter={(player) =>
            setExcludedStarterPlayers((players) => players.concat([player.id]))
          }
          excludeSub={(player) =>
            setExcludedSubPlayers((players) => players.concat([player.id]))
          }
          onSearchPlayer={(slotIndex) => {
            setSearchQuery("");
            setSearchModal({ visible: true, position: slotIndex });
          }}
        />
      </div>
      <div>
        <WantedPlayers
          players={playersWithPoints}
          excludePlayer={(player) =>
            setExcludedStarterPlayers((players) => players.concat([player.id]))
          }
        />
      </div>
      <div className={`w-full h-[500px]`}>
        <Bar
          ref={chartRef}
          onClick={onClickPlayerOfTheRound}
          data={{
            labels: playersOfTheRoundToShow.map(
              (player) => `${player.nom} - ${player.trgclub}`,
            ),
            datasets: [
              {
                label: "In team of the round",
                data: playersOfTheRoundToShow.map(
                  (player) => player.bestTeamCount,
                ),
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
      {player && (
        <div>
          {TEAMS.map((team, index) => {
            const inTeam = team.teamIds?.some((id) => id === player.id);
            const stats = player.stats.detail.find(
              (detail) => detail.numero === index + 1,
            );
            return { round: index + 1, inTeam, stats };
          }, [])
            .filter((round) => round.stats?.points !== undefined)
            .map((round) => {
              return (
                <div className={round.inTeam && "font-bold"}>
                  Round {round.round} - Score {round.stats.points} vs{" "}
                  {round.stats.adversaire.trg}
                </div>
              );
            })}
        </div>
      )}

      <div className={`w-full h-[500px]`}>
        <Bar
          data={{
            labels: sortedClubs.map((club) => club.name),
            datasets: [
              {
                label: "In team of the round",
                data: sortedClubs.map((club) => club.bestTeamCount),
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>
      {popover.visible && (
        <div
          className="absolute z-50 animate-in fade-in zoom-in duration-150"
          style={{
            left: popover.x,
            top: popover.y,
            transform: "translate(-50%, -120%)",
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popover
        >
          <div className="bg-white border border-slate-200 shadow-2xl rounded-xl p-3 min-w-[160px] flex flex-col gap-1">
            <div className="px-2 py-1 mb-1 border-b border-slate-100">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {popover.data.label}
              </p>
            </div>

            <button
              onClick={() => onClickAddStarterPlayer(popover.event)}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Add to team
            </button>

            <button
              onClick={() => onClickAddSubPlayer(popover.event)}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Add to team subs
            </button>

            <button
              onClick={() => onClickAddSupersub(popover.event)}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Set as supersub
            </button>

            <button
              onClick={() => onClickExcludeStarterPlayer(popover.event)}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              Exclude from chart
            </button>
          </div>

          {/* Popover Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
        </div>
      )}
      {searchModal.visible && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24"
          onClick={() => setSearchModal({ visible: false, position: null })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-96 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div className="overflow-y-auto max-h-72 flex flex-col">
              {playersWithPoints
                .filter((p) =>
                  p.nom.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .slice(0, 15)
                .map((p) => (
                  <button
                    key={p.id}
                    className="text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between"
                    onClick={() => {
                      setSelectedPlayerIds((ids) =>
                        addPlayerToSlots(ids, p, searchModal.position),
                      );
                      setSearchModal({ visible: false, position: null });
                    }}
                  >
                    <span>{p.nom}</span>
                    <span className="text-slate-400 text-xs">
                      {p.trgclub} · {POSITION_LABELS[p.position] ?? p.position}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Stats;
