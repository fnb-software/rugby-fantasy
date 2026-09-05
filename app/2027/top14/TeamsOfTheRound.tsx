"use client";
import { useState } from "react";

const TeamsOfTheRound = ({
  teams,
  defaultRound = 1,
}: {
  teams: any[];
  defaultRound?: number;
}) => {
  const [round, setRound] = useState(defaultRound);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="text-xl font-bold">Fantasy team of the round</h1>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Array(teams.length)).map((_, i) => (
          <button
            key={i}
            onClick={() => setRound(i + 1)}
            className={round === i + 1 ? "font-bold" : ""}
          >
            Round {i + 1}
          </button>
        ))}
      </div>
      {teams[round - 1]}
    </div>
  );
};

export default TeamsOfTheRound;
