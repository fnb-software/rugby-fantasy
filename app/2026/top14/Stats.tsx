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
  return (
    <>
      <div>
        <label>
          Filter by team
          <select onChange={(e) => setClub(e.target.value)}>
            <option label={"All"} value={""}></option>
            {allClubs.map((club) => (
              <option label={club} value={club}></option>
            ))}
          </select>
        </label>
      </div>
      <div>
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

      <div>
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
    </>
  );
};

export default Stats;
