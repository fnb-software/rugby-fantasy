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
import { useRef, useState } from "react";

const MIN_SHEETS_PER_PLAYER = 3;

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
  const chartRef = useRef();
  const starterRef = useRef();
  const subRef = useRef();

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

  const filteredOwner = owner
    ? players.filter(
        (p) => p.proprietaire.id === "" || p.proprietaire.nom === owner,
        //&&   (!p.offres_encours || p.offres_encours_parmoi),
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

  const playerWithPoints = filteredPlayers.map((p) => {
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

    return {
      ...p,
      starterAverage,
      starterMinutes,
      subAverage,
      subMinutes,
      startCount: starterPoints.startCount,
      subCount: subPoints.subCount,
      subPlayerAverage,
      starterPlayerAverage,
      expectedTeamPoints: getTeamPoints({
        isMatchHome,
        result: maxRound
          ? parseInt(isMatchHome ? match.but_dom : match.but_ext) -
            parseInt(!isMatchHome ? match.but_dom : match.but_ext)
          : TEAM_RESULTS_EXPECTED[p.club],
      }),
      starterNextRoundPoints,
      nextRoundMinutes: nextRound?.minutes,
      subNextRoundPoints,
    };
  });

  const sortedStarterPoints = sortBy(
    playerWithPoints.filter(
      (p) =>
        p.startCount >= MIN_SHEETS_PER_PLAYER &&
        !excludedStarterPlayers.includes(p.id),
    ),
    (p) =>
      -p.starterPlayerAverage - (p.expectedTeamPoints * p.starterMinutes) / 80,
  ).slice(0, 40);
  const sortedSubPoints = sortBy(
    playerWithPoints.filter(
      (p) =>
        p.subCount >= MIN_SHEETS_PER_PLAYER &&
        !excludedSubPlayers.includes(p.id),
    ),
    (p) => -p.subPlayerAverage - (p.expectedTeamPoints * p.subMinutes) / 80,
  ).slice(0, 40);

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
      <div className={`flex gap-4`}>
        <label>
          Filter by position{` `}
          <select onChange={(e) => setPosition(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allPositions.map((position) => (
              <option label={position} value={position}></option>
            ))}
          </select>
        </label>
        <label>
          Filter by owner + free{` `}
          <select onChange={(e) => setOwner(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allOwners.map((owner) => (
              <option label={owner} value={owner}></option>
            ))}
          </select>
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
      <div className={`w-full h-[500px]`}>
        <Bar
          ref={starterRef}
          onClick={onClickExcludeStarterPlayer}
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
                    data: sortedStarterPoints.map(
                      (p) => (p.expectedTeamPoints * p.nextRoundMinutes) / 80,
                    ),
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
                      (p) => (p.expectedTeamPoints * p.starterMinutes) / 80,
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
                    data: sortedSubPoints.map(
                      (p) => (p.expectedTeamPoints * p.nextRoundMinutes) / 80,
                    ),
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
                    data: sortedSubPoints.map(
                      (p) => (p.expectedTeamPoints * p.subMinutes) / 80,
                    ),
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
    </>
  );
};

const getRoundPlayerOnlyPoints = (p) => {
  const isForward = [
    "lib_3emeligne",
    "lib_2emeligne",
    "lib_pilier",
    "lib_talonneur",
  ].includes(p.position);
  const getPointsMultiplier = getStatPointsMultiplier({ isForward });
  return (r) => {
    return r.stats.reduce((totalPoints, stat) => {
      const multiplier = getPointsMultiplier(stat);
      const points = multiplier * (stat?.total || 0);
      return totalPoints + points;
    }, 0);
  };
};

const getStatPointsMultiplier =
  ({ isForward }) =>
  (stat) => {
    switch (stat.libelle) {
      case "Try":
        return isForward ? 15 : 10;
      case "Conversion":
        return 2;
      case "Penalty":
      case "Drop goal":
        return 3;
      case "Missed kick":
        return -2;
      case "Conceded penalty":
        return isForward ? -3 : -5;
      case "Yellow cards":
        return -10;
      case "lib_carton_orange":
        return -13;
      case "Red cards ":
        return -15;
      case "Tackles":
        return 1;
      case "Missed tackle":
        return -2;
      case "Line-breaks":
        return isForward ? 8 : 4;
      case "Tackle break":
        return isForward ? 4 : 2;
      case "Runs with the ball":
        return 1;
      case "Forward pass":
        return -1;
      case "Turnover won":
        return isForward ? 3 : 5;
      case "lib_critere_interception_reussie":
        return isForward ? 5 : 3;
      case "Offloads":
        return 2;
    }
    return 0;
  };

const getTeamPoints = ({ isMatchHome, result }) => {
  const resultPoints = isMatchHome
    ? getHomeResult(result)
    : getAwayResult(result);
  const scorePoints = result / 2;
  return resultPoints + scorePoints;
};
const getHomeResult = (result) => (result > 0 ? 6 : result < 0 ? -2 : 2);
const getAwayResult = (result) => (result > 0 ? 8 : result < 0 ? 0 : 4);

const TEAM_RESULTS_EXPECTED = {
  Bayonne: 5,
  Castres: 40,
  Clermont: -12,
  Lyon: -5,
  Montpellier: -20,
  Montauban: -40,
  Pau: 10,
  Perpignan: 5,
  "Racing 92": -10,
  "La Rochelle": -5,
  "Stade français": 12,
  Toulon: -5,
  Toulouse: 20,
  "Bordeaux-Bègles": 5,
};

export default Stats;
