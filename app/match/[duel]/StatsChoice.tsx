'use client';
import { useState } from 'react';
import SortableStatsPreview from './SortableStatsPreview';
import MatchStats from './MatchStats';

const StatsChoice = ({
  team1Name,
  team2Name,
  statsPreview,
  stats,
}: {
  team1Name: string;
  team2Name: string;
  statsPreview: any;
  stats: any;
}) => {
  const [statsToShow, setStatsToShow] = useState(stats ? 'stats' : 'preview');

  if (statsToShow === 'preview') {
    return (
      <div>
        <h1 className="text-xl">
          Stats preview: {team1Name} vs {team2Name} (average per match)
        </h1>
        {stats && (
          <button
            className="underline  text-sm"
            onClick={() => setStatsToShow('stats')}
          >
            See match stats instead
          </button>
        )}
        <SortableStatsPreview
          team1Name={team1Name}
          team2Name={team2Name}
          statRanks={statsPreview}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl">
        Match stats: {team1Name} vs {team2Name}
      </h1>
      <button
        className="underline text-sm"
        onClick={() => setStatsToShow('preview')}
      >
        See match stats preview instead
      </button>
      <MatchStats
        team1Name={team1Name}
        team2Name={team2Name}
        statRanks={statsPreview}
        stats={stats}
      />
    </div>
  );
};

export default StatsChoice;
