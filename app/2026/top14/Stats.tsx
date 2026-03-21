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
import { useRef, useState } from "react";

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
  const [player, setPlayer] = useState(undefined);
  const chartRef = useRef();
  const onClick = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    console.log(element);
    if (!element) {
      setPlayer(undefined);
      return;
    }
    setPlayer(playersOfTheRoundToShow[element[0].index]);
  };

  const allPlayersOfTheRound = club
    ? sortedPlayers.filter((player) => player.trgclub === club)
    : [...sortedPlayers];
  const playersOfTheRoundToShow = allPlayersOfTheRound.slice(0, 20);

  const filteredClubPlayers = club
    ? players.filter((p) => p.trgclub === club)
    : players;
  const filteredPlayers = position
    ? players.filter((p) => p.position === position)
    : players;

  const playerWithPoints = filteredPlayers.map((p) => {
    const starterPoints = p.stats.detail.reduce(
      ({ points, startCount }, round) => {
        if (round.titulaire) {
          return {
            points: points + parseFloat(round.points) * 10,
            startCount: startCount + 1,
          };
        }
        return { points, startCount };
      },
      { points: 0, startCount: 0 },
    );
    const starterAverage = starterPoints.startCount
      ? starterPoints.points / starterPoints.startCount / 10
      : 0;
    const subPoints = p.stats.detail.reduce(
      ({ points, subCount }, round) => {
        if (round.remplacant) {
          return {
            points: points + parseFloat(round.points) * 10,
            subCount: subCount + 1,
          };
        }
        return { points, subCount };
      },
      { points: 0, subCount: 0 },
    );
    const subAverage = subPoints.subCount
      ? subPoints.points / subPoints.subCount / 10
      : 0;
    return {
      ...p,
      starterAverage,
      subAverage,
      startCount: starterPoints.startCount,
      subCount: subPoints.subCount,
    };
  });

  const sortedStarterPoints = sortBy(
    playerWithPoints.filter((p) => p.startCount > 2),
    (p) => -p.starterAverage,
  ).slice(0, 40);
  const sortedSubPoints = sortBy(
    playerWithPoints.filter((p) => p.subCount > 2),
    (p) => -p.subAverage,
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
          onClick={onClick}
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
      <div>
        <label>
          Filter by position{` `}
          <select onChange={(e) => setPosition(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allPositions.map((position) => (
              <option label={position} value={position}></option>
            ))}
          </select>
        </label>
      </div>
      <div className={`w-full h-[500px]`}>
        <Bar
          data={{
            labels: sortedStarterPoints.map(
              (player) =>
                `${player.nom} - ${player.trgclub} - ${player.startCount}`,
            ),
            datasets: [
              {
                label: "Starter points",
                data: sortedStarterPoints.map((p) =>
                  Math.round(p.starterAverage),
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
      <div className={`w-full h-[500px]`}>
        <Bar
          data={{
            labels: sortedSubPoints.map(
              (player) =>
                `${player.nom} - ${player.trgclub} - ${player.subCount}`,
            ),
            datasets: [
              {
                label: "Sub points",
                data: sortedSubPoints.map((p) => Math.round(p.subAverage)),
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
    </>
  );
};

export default Stats;
