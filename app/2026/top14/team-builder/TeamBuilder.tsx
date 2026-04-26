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
import { TEAMS } from "../bestTeams";
import rounds from "../../../../2026/top14/data/rounds";
import getDznFromStats from "../../../../2026/top14/minizinc/getDznFromStats";
import { useEffect, useMemo, useRef, useState } from "react";
import SelectedPlayers from "../SelectedPlayers";
import { solve } from "../solve";
import fantasyModel from "../../../../2026/top14/minizinc/fantasy_total.mzn";
import WantedPlayers from "../WantedPlayers";
import { assignPlayerToSlot } from "../slots";
import { TEAMSHEETS, entryName, entryUncertain } from "../teamsheets";
import {
  getRoundPlayerOnlyPoints,
  getTeamPoints,
  matchesName,
  POSITION_LABELS,
} from "../statsUtil";
import TeamResultsEditor from "../TeamResultsEditor";

const flatPlayers = TEAMS.map((team) => team.teamIds || []).flat();
const POSITION_ORDER = [
  "lib_arriere",
  "lib_34aile",
  "lib_34centre",
  "lib_ouverture",
  "lib_12melee",
  "lib_3emeligne",
  "lib_2emeligne",
  "lib_talonneur",
  "lib_pilier",
];
const countedPlayers = countBy(flatPlayers);

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeamBuilder = ({
  players,
  currentRound,
  initialResultsForRound,
}: {
  players: any[];
  currentRound: number;
  initialResultsForRound: Record<string, number> | null;
}) => {
  const allClubs = useMemo(
    () =>
      [
        ...new Set(
          flatPlayers.map((id) => {
            const player = players.find((p) => p.id === id);
            return player!.trgclub as string;
          }),
        ),
      ].sort(),
    [players],
  );
  const allPositions = useMemo(
    () =>
      [...new Set(players.map((p) => p.position as string))].sort(
        (a, b) =>
          (POSITION_ORDER.indexOf(a) + 1 || 99) -
          (POSITION_ORDER.indexOf(b) + 1 || 99),
      ),
    [players],
  );
  const allOwners = useMemo(
    () =>
      [...new Set(players.map((p) => p.proprietaire.nom as string))]
        .filter((owner) => owner !== undefined)
        .sort(),
    [players],
  );
  const sortedPlayers = useMemo(
    () =>
      sortBy(
        Object.keys(countedPlayers).map((id) => {
          const player = players.find((p) => p.id === parseInt(id));
          return { bestTeamCount: countedPlayers[id], ...player };
        }),
        (p) => -p.bestTeamCount,
      ),
    [players],
  );
  const sortedClubs = useMemo(() => {
    const counted = countBy(
      flatPlayers.map((id) => {
        const player = players.find((p) => p.id === id);
        return player!.trgclub;
      }),
    );
    return sortBy(
      Object.keys(counted).map((name) => ({
        bestTeamCount: counted[name],
        name,
      })),
      (c) => -c.bestTeamCount,
    );
  }, [players]);

  useEffect(() => {
    for (const [club, teamsheet] of Object.entries(TEAMSHEETS)) {
      const clubPlayers = players.filter((p) => p.club === club);
      for (const entry of [...teamsheet.starters, ...teamsheet.subs]) {
        const name = entryName(entry);
        if (!clubPlayers.some((p) => matchesName(p, name))) {
          console.warn(
            `Teamsheet player not matched in stats: ${club} / ${name}`,
          );
        }
      }
    }
  }, [players]);

  const [club, setClub] = useState("");
  const [position, setPosition] = useState("");
  const [owner, setOwner] = useState("");
  const [maxRound, setMaxRound] = useState(0);
  const [player, setPlayer] = useState<any>(undefined);
  const [excludedStarterPlayers, setExcludedStarterPlayers] = useState<
    number[]
  >([]);
  const [excludedSubPlayers, setExcludedSubPlayers] = useState<number[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | null)[]>(
    Array(21).fill(null),
  );
  const [popover, setPopover] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: undefined as { label: any } | undefined,
    playerIndex: undefined as number | undefined,
    source: undefined as "starter" | "sub" | undefined,
  });
  const [searchModal, setSearchModal] = useState<{
    visible: boolean;
    position: any;
  }>({ visible: false, position: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByTeamsheet, setFilterByTeamsheet] = useState(true);
  const [teamResultsExpected, setTeamResultsExpected] = useState<
    Record<string, number>
  >(initialResultsForRound ?? {});
  const [resultsSaveStatus, setResultsSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [resultsSaveError, setResultsSaveError] = useState<string | null>(null);

  const saveExpectedResults = async () => {
    setResultsSaveStatus("saving");
    setResultsSaveError(null);
    try {
      const res = await fetch("/api/expected-results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          round: currentRound,
          results: teamResultsExpected,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setResultsSaveStatus("saved");
    } catch (e) {
      setResultsSaveStatus("error");
      setResultsSaveError(e instanceof Error ? e.message : "save_failed");
    }
  };
  const [minSheetsPerPlayer, setMinSheetsPerPlayer] = useState(3);
  const [maxSheetsPerPlayer, setMaxSheetsPerPlayer] = useState<
    number | undefined
  >(undefined);

  const chartRef = useRef();
  const starterRef = useRef();
  const subRef = useRef();

  // Close popover if clicking outside the chart
  useEffect(() => {
    const handleClickOutside = () => setPopover({ ...popover, visible: false });
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [popover]);

  const openPopover = (
    event: React.MouseEvent,
    chart: any,
    source: "starter" | "sub",
  ) => {
    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      "nearest",
      { intersect: true },
      true,
    );
    if (points.length > 0) {
      event.nativeEvent.stopPropagation();
      const firstPoint = points[0];
      const label = chart.data.labels[firstPoint.index];
      const { offsetLeft, offsetTop } = chart.canvas;
      setPopover({
        visible: true,
        x: offsetLeft + firstPoint.element.x,
        y: offsetTop + firstPoint.element.y,
        data: { label },
        playerIndex: firstPoint.index,
        source,
      });
    } else {
      setPopover((p) => ({ ...p, visible: false }));
    }
  };

  const onClickStarterPlayer = (event) => {
    const chart = starterRef.current;
    if (!chart) return;
    openPopover(event, chart, "starter");
  };

  const onClickSubPlayer = (event) => {
    const chart = subRef.current;
    if (!chart) return;
    openPopover(event, chart, "sub");
  };

  const onClickPlayerOfTheRound = (event) => {
    if (!chartRef.current) return;
    const element = getElementAtEvent(chartRef.current, event);
    console.log(element);
    if (!element) {
      setPlayer(undefined);
      return;
    }
    setPlayer(playersOfTheRoundToShow[element[0].index]);
  };

  const onClickExcludeFromChart = () => {
    const idx = popover.playerIndex;
    if (idx === undefined) return;
    if (popover.source === "sub") {
      setExcludedSubPlayers((players) =>
        players.concat([sortedSubPoints[idx].id]),
      );
    } else {
      setExcludedStarterPlayers((players) =>
        players.concat([sortedStarterPoints[idx].id]),
      );
    }
    setPopover((p) => ({ ...p, visible: false }));
  };

  const allPlayersOfTheRound = club
    ? sortedPlayers.filter((player) => player.trgclub === club)
    : [...sortedPlayers];
  const playersOfTheRoundToShow = allPlayersOfTheRound.slice(0, 20);
  const actualOwner = owner.startsWith("free__")
    ? owner.slice("free__".length)
    : owner;
  const filteredOwner = owner
    ? owner === "__free__"
      ? players.filter((p) => p.proprietaire.id === "")
      : owner === actualOwner
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
      parseInt(round.journee.numero) === (maxRound ? maxRound + 1 : currentRound),
  );
  if (!roundInfo) {
    throw new Error(
      `Round not found ${maxRound ? maxRound + 1 : currentRound}`,
    );
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
      : 60; // Fake minutes to show expected team points
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
      : 20; // Fake minutes to show expected team points

    const expectedTeamPoints = getTeamPoints({
      isMatchHome,
      result: maxRound
        ? parseInt(isMatchHome ? match.but_dom : match.but_ext) -
          parseInt(!isMatchHome ? match.but_dom : match.but_ext)
        : teamResultsExpected[p.club] ?? 0,
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
    const starterEntry = teamsheet?.starters.find((e) =>
      matchesName(p, entryName(e)),
    );
    const subEntry = teamsheet?.subs.find((e) =>
      matchesName(p, entryName(e)),
    );
    const isTeamsheetStarter = !!starterEntry;
    const isTeamsheetSub = !!subEntry;
    const isTeamsheetUncertain =
      (!!starterEntry && entryUncertain(starterEntry)) ||
      (!!subEntry && entryUncertain(subEntry));
    const hasTeamsheet =
      (teamsheet?.starters.length ?? 0) > 0 ||
      (teamsheet?.subs.length ?? 0) > 0;

    const totalMinutes = p.stats.detail.reduce(
      (sum: number, r: any) => sum + (r.minutes ?? 0),
      0,
    );
    const getStat = (libelle: string) => {
      const action = p.stats.stats_individuelles?.find(
        (a: any) => a.libelle.trim().toLowerCase() === libelle.toLowerCase(),
      );
      if (!action || !totalMinutes) return 0;
      return Math.round((action.total / totalMinutes) * 80 * 10) / 10;
    };

    return {
      ...p,
      isTeamsheetStarter,
      isTeamsheetSub,
      isTeamsheetUncertain,
      hasTeamsheet,
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
      avgPenalties: getStat("Conceded penalty"),
      avgYellowCards: getStat("Yellow cards"),
      avgOrangeCards: getStat("lib_carton_orange"),
      avgRedCards: getStat("Red cards"),
    };
  });

  const playersWithPointsAndTeamsheet = filterByTeamsheet
    ? playersWithPoints.filter((p) => p.isTeamsheetStarter || p.isTeamsheetSub)
    : playersWithPoints;

  const sortedStarterPoints = sortBy(
    playersWithPointsAndTeamsheet.filter(
      (p) =>
        p.startCount >= minSheetsPerPlayer &&
        (maxSheetsPerPlayer === undefined ||
          p.startCount <= maxSheetsPerPlayer) &&
        !excludedStarterPlayers.includes(p.id) &&
        (!filterByTeamsheet || p.isTeamsheetStarter),
    ),
    (p) => -p.expectedStarterPoints,
  ).slice(0, 40);
  const sortedSubPoints = sortBy(
    playersWithPointsAndTeamsheet.filter(
      (p) =>
        p.subCount >= minSheetsPerPlayer &&
        (maxSheetsPerPlayer === undefined ||
          p.subCount <= maxSheetsPerPlayer) &&
        !excludedSubPlayers.includes(p.id) &&
        (!filterByTeamsheet || p.isTeamsheetSub),
    ),
    (p) => -p.expectedSubPoints,
  ).slice(0, 40);

  const selectedPlayers = selectedPlayerIds.map((id) =>
    id == null ? null : playersWithPoints.find((p) => p.id === id) ?? null,
  );

  const addPlayerToSlots = (
    ids: (number | null)[],
    player: any,
    slotIndex?: number,
  ): (number | null)[] => {
    const resolved = ids.map((id) =>
      id == null ? null : playersWithPoints.find((p) => p.id === id) ?? null,
    );
    return assignPlayerToSlot({ slots: resolved, player, slotIndex }).map(
      (p: any) => p?.id ?? null,
    );
  };

  const resolvePopoverPlayer = () => {
    const idx = popover.playerIndex;
    if (idx === undefined) return undefined;
    const list =
      popover.source === "sub" ? sortedSubPoints : sortedStarterPoints;
    return playersWithPoints.find((p) => p.id === list[idx].id);
  };

  const onClickAddStarterPlayer = () => {
    const playerWithPoints = resolvePopoverPlayer();
    if (!playerWithPoints) return;
    setSelectedPlayerIds((ids) => addPlayerToSlots(ids, playerWithPoints));
    setPopover((p) => ({ ...p, visible: false }));
  };

  const onClickAddSubPlayer = () => {
    const playerWithPoints = resolvePopoverPlayer();
    if (!playerWithPoints) return;
    setSelectedPlayerIds((ids) => {
      const emptySubIdx = [16, 17].find((i) => !ids[i]);
      return emptySubIdx !== undefined
        ? addPlayerToSlots(ids, playerWithPoints, emptySubIdx)
        : ids;
    });
    setPopover((p) => ({ ...p, visible: false }));
  };

  const onClickAddSupersub = () => {
    const playerWithPoints = resolvePopoverPlayer();
    if (!playerWithPoints) return;
    setSelectedPlayerIds((ids) => addPlayerToSlots(ids, playerWithPoints, 15));
    setPopover((p) => ({ ...p, visible: false }));
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
              <option
                label={POSITION_LABELS[position] ?? position}
                value={position}
              ></option>
            ))}
          </select>
        </label>
        <label>
          Filter by owner{` `}
          <select onChange={(e) => setOwner(e.target.value)}>
            <option label={"All"} value={""}></option>
            <option label={"Free"} value={"__free__"}></option>
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
      <div>{playersWithPointsAndTeamsheet.length} players</div>
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
        <div className="flex flex-col gap-2">
          <TeamResultsEditor
            matches={roundInfo.journee.matchs}
            teamResultsExpected={teamResultsExpected}
            onChange={(next) => {
              setTeamResultsExpected(next);
              setResultsSaveStatus("idle");
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveExpectedResults}
              disabled={resultsSaveStatus === "saving"}
              className="rounded px-3 py-1 bg-emerald-500 text-white disabled:opacity-50"
            >
              {resultsSaveStatus === "saving"
                ? "Saving…"
                : "Save expected results"}
            </button>
            {resultsSaveStatus === "saved" && (
              <span className="text-emerald-700 text-sm">Saved</span>
            )}
            {resultsSaveStatus === "error" && (
              <span className="text-red-700 text-sm">{resultsSaveError}</span>
            )}
          </div>
        </div>
      )}
      <div>
        <label>
          Min teamsheets per player{` `}
          <input
            type="number"
            min={0}
            value={minSheetsPerPlayer}
            onChange={(e) =>
              setMinSheetsPerPlayer(parseInt(e.target.value) || 0)
            }
            className="border border-slate-200 rounded px-2 py-1 w-16 text-sm"
          />
        </label>
        {` `}
        <label>
          Max{` `}
          <input
            type="number"
            min={0}
            value={maxSheetsPerPlayer ?? ""}
            onChange={(e) =>
              setMaxSheetsPerPlayer(
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
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
                `${player.nom}${player.hasTeamsheet && !player.isTeamsheetStarter && !player.isTeamsheetSub ? " ⚠️" : ""}${player.isTeamsheetUncertain ? " ❓" : ""} - ${
                  player.proprietaire?.id === ""
                    ? "🟢"
                    : player.proprietaire?.nom ?? ""
                }`,
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
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const p = sortedStarterPoints[items[0].dataIndex];
                    const f = (k: string) => k.padEnd(13);
                    return [
                      p.nom,
                      `${f("Position")}${
                        POSITION_LABELS[p.position] ?? p.position
                      }`,
                      `${f("Club")}${p.trgclub}`,
                      `${f("Owner")}${
                        p.proprietaire?.id === ""
                          ? "🟢 free"
                          : p.proprietaire?.nom ?? ""
                      }`,
                      `${f("Starts")}${p.startCount}`,
                      `${f("Avg minutes")}${Math.round(p.starterMinutes)}`,
                      ...(p.avgPenalties ? [`${f("Pen/80min")}${p.avgPenalties}`] : []),
                      ...(p.avgYellowCards ? [`${f("Yellow/80min")}${p.avgYellowCards}`] : []),
                      ...(p.avgOrangeCards ? [`${f("Orange/80min")}${p.avgOrangeCards}`] : []),
                      ...(p.avgRedCards ? [`${f("Red/80min")}${p.avgRedCards}`] : []),
                    ];
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className={`w-full h-[500px]`}>
        <Bar
          ref={subRef}
          onClick={onClickSubPlayer}
          data={{
            labels: sortedSubPoints.map(
              (player) =>
                `${player.nom}${player.hasTeamsheet && !player.isTeamsheetStarter && !player.isTeamsheetSub ? " ⚠️" : ""}${player.isTeamsheetUncertain ? " ❓" : ""} - ${
                  player.proprietaire?.id === ""
                    ? "🟢"
                    : player.proprietaire?.nom ?? ""
                }`,
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
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const p = sortedSubPoints[items[0].dataIndex];
                    const f = (k: string) => k.padEnd(13);
                    return [
                      p.nom,
                      `${f("Position")}${
                        POSITION_LABELS[p.position] ?? p.position
                      }`,
                      `${f("Club")}${p.trgclub}`,
                      `${f("Owner")}${
                        p.proprietaire?.id === ""
                          ? "🟢 free"
                          : p.proprietaire?.nom ?? ""
                      }`,
                      `${f("Subs")}${p.subCount}`,
                      `${f("Avg minutes")}${Math.round(p.subMinutes)}`,
                      ...(p.avgPenalties ? [`${f("Pen/80min")}${p.avgPenalties}`] : []),
                      ...(p.avgYellowCards ? [`${f("Yellow/80min")}${p.avgYellowCards}`] : []),
                      ...(p.avgOrangeCards ? [`${f("Orange/80min")}${p.avgOrangeCards}`] : []),
                      ...(p.avgRedCards ? [`${f("Red/80min")}${p.avgRedCards}`] : []),
                    ];
                  },
                },
              },
            },
          }}
        />
      </div>
      <div>
        <SelectedPlayers
          players={selectedPlayers}
          removePlayer={(player) => {
            setSelectedPlayerIds((ids) =>
              ids.map((id) => (id === player.id ? null : id)),
            );
          }}
          onSolveTeam={async ({ lockedPlayers, budget }) => {
            const reservePlayers = selectedPlayers
              .slice(18, 21)
              .filter((p): p is NonNullable<typeof p> => !!p);
            const reserveIds = new Set(reservePlayers.map((p) => p.id));
            const teamLockedPlayers = lockedPlayers.filter(
              ({ index }) => index < 18,
            );
            const adjustedBudget =
              budget != null
                ? budget -
                  reservePlayers.reduce((sum, p) => sum + (p.valeur || 0), 0)
                : undefined;
            const { teamIds, captainId } = await solve({
              fantasyModel,
              dznString: getDznFromStats({
                maxCost: adjustedBudget,
                players: playersWithPointsAndTeamsheet
                  .filter((p) => !reserveIds.has(p.id))
                  .map((p) => {
                    const teamsheet = TEAMSHEETS[p.club];
                    const hasTeamsheet =
                      (teamsheet?.starters.length ?? 0) > 0 ||
                      (teamsheet?.subs.length ?? 0) > 0;
                    return {
                      ...p,
                      expectedStarterPoints:
                        excludedStarterPlayers.includes(p.id) ||
                        (filterByTeamsheet &&
                          hasTeamsheet &&
                          !p.isTeamsheetStarter)
                          ? 0
                          : p.expectedStarterPoints,
                      expectedSubPoints:
                        excludedSubPlayers.includes(p.id) ||
                        (filterByTeamsheet && hasTeamsheet && !p.isTeamsheetSub)
                          ? 0
                          : p.expectedSubPoints,
                    };
                  }),
                lockedPlayers: teamLockedPlayers,
                reservePlayers,
              }),
            });
            const reserveSlots: (number | null)[] = [
              ...reservePlayers.map((p) => p.id),
              ...Array(3 - reservePlayers.length).fill(null),
            ];
            setSelectedPlayerIds([
              ...teamIds.map((id: number) => id ?? null),
              ...reserveSlots,
            ]);
            return { captainId };
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
              (player) =>
                `${player.nom} - ${
                  player.proprietaire?.id === ""
                    ? "🟢"
                    : player.proprietaire?.nom ?? ""
                }`,
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
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const p = playersOfTheRoundToShow[items[0].dataIndex];
                    const f = (k: string) => k.padEnd(13);
                    return [
                      p.nom,
                      `${f("Position")}${
                        POSITION_LABELS[p.position] ?? p.position
                      }`,
                      `${f("Club")}${p.trgclub}`,
                      `${f("Owner")}${
                        p.proprietaire?.id === ""
                          ? "🟢 free"
                          : p.proprietaire?.nom ?? ""
                      }`,
                    ];
                  },
                },
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
              onClick={() => onClickAddStarterPlayer()}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Add to team
            </button>

            <button
              onClick={() => onClickAddSubPlayer()}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Add to team subs
            </button>

            <button
              onClick={() => onClickAddSupersub()}
              className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              Set as supersub
            </button>

            <button
              onClick={() => onClickExcludeFromChart()}
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
              {(typeof searchModal.position === "number" &&
              searchModal.position >= 18
                ? playersWithPoints
                : playersWithPointsAndTeamsheet)
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

export default TeamBuilder;
