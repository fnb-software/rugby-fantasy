"use client";
import { useState } from "react";

const ROUND_OFFSET = 15;

const TeamsOfTheRound = ({ teams }: { teams: any[] }) => {
  const [round, setRound] = useState(1);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="text-xl font-bold">Fantasy team of the round</h1>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Array(5)).map((_, i) => (
          <button
            key={i}
            onClick={() => setRound(i + 1)}
            className={round === i + 1 ? "font-bold" : ""}
          >
            Round {i + ROUND_OFFSET + 1}
          </button>
        ))}
      </div>
      {teams[round - 1]}
    </div>
  );
};

export default TeamsOfTheRound;
