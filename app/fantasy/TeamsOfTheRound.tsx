'use client';
import { useState } from 'react';

const TeamsOfTheRound = ({ teams }: { teams: any[] }) => {
  const [round, setRound] = useState(6);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="text-xl font-bold">Fantasy team of the round</h1>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Array(5)).map((_, i) => (
          <button
            key={i}
            onClick={() => setRound(i + 1)}
            className={round === i + 1 ? 'font-bold' : ''}
          >
            Round {i + 1}
          </button>
        ))}
        <button
          className={round === 6 ? 'font-bold' : ''}
          onClick={() => setRound(6)}
        >
          QF
        </button>
      </div>
      {teams[round - 1]}
    </div>
  );
};

export default TeamsOfTheRound;