"use client";
import { useState } from "react";
import Stats from "./Stats";

const TeamsOfTheRound = ({
  teams,
  players,
}: {
  teams: any[];
  players: any[];
}) => {
  const [round, setRound] = useState(1);
  const [tab, setTab] = useState("round");

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="text-xl font-bold">Fantasy team of the round</h1>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Array(teams.length)).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setRound(i + 1);
              setTab("round");
            }}
            className={round === i + 1 ? "font-bold" : ""}
          >
            Round {i + 1}
          </button>
        ))}
        <button
          onClick={() => setTab("stats")}
          className={tab === "stats" ? "font-bold" : ""}
        >
          Stats
        </button>
      </div>
      {tab === "round" && teams[round - 1]}
      {tab === "stats" && <Stats players={players} />}
    </div>
  );
};

export default TeamsOfTheRound;
