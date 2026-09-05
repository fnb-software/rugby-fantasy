'use client';
import { useEffect, useState } from 'react';
import fantasyModel from '../../../../2027/top14/minizinc/fantasy.mzn';
import getDzn from '../../../../2027/top14/minizinc/getDzn';
import parseResult from '../../../../2027/top14/minizinc/parseResult';
import type { Variant } from '@/app/lib/adminData';
import { solve } from '../solve';

type SolvedRound = {
  round: number;
  teamIds: number[];
  captainId: number;
};

const Solve = ({
  players,
  startRound,
  endRound,
  isAdmin = false,
}: {
  players: any[];
  startRound: number;
  endRound: number;
  isAdmin?: boolean;
}) => {
  const [teamResult, setTeamResult] = useState<
    ReturnType<typeof parseResult> | undefined | null
  >();
  const [solved, setSolved] = useState<SolvedRound[]>([]);

  useEffect(() => {
    const solveAllRounds = async () => {
      let log = ``;
      for (
        let currentRound = startRound;
        currentRound <= endRound;
        currentRound++
      ) {
        try {
          const { teamIds, captainId } = await solve({
            dznString: getDzn(players, currentRound),
            fantasyModel,
          });
          const teamResult = parseResult({
            players,
            teamIds,
            captainId,
            supersubId: teamIds[15],
            round: currentRound,
          });
          log += teamResult.log + `,`;
          setTeamResult(teamResult);
          const sortedTeamIds = teamResult.team.map((p: any) => p.id);
          setSolved((prev) => [
            ...prev,
            { round: currentRound + 1, teamIds: sortedTeamIds, captainId },
          ]);
        } catch (e) {
          console.error(`Round ${currentRound} solve failed:`, e);
          setTeamResult(null);
          break;
        }
      }
      console.log(`[${log}]`);
    };
    solveAllRounds();
  }, [players, startRound, endRound]);

  if (teamResult === undefined) {
    return 'Solving....';
  }

  if (teamResult === null) {
    return 'No solution';
  }

  return (
    <div>
      <div>
        <h1>Team</h1>
        {teamResult.teamOutput.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>
      <div>
        Points: {teamResult.points / 20} - Cost: {teamResult.cost}
      </div>
      {isAdmin && solved.map((s) => <SaveBestTeam key={s.round} {...s} />)}
    </div>
  );
};

const SaveBestTeam = ({ round, teamIds, captainId }: SolvedRound) => {
  const [variant, setVariant] = useState<Variant>('full');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/best-team', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ variant, round, teamIds, captainId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setStatus('saved');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'save_failed');
    }
  };

  return (
    <div className="mt-4 p-2 border rounded flex items-center gap-2">
      <span className="font-semibold">Save round {round} as:</span>
      <select
        value={variant}
        onChange={(e) => setVariant(e.target.value as Variant)}
        className="border rounded px-1"
      >
        <option value="full">Full rules</option>
        <option value="noClubLimit">No club limit</option>
        <option value="secondNoClubLimit">B - No club limit</option>
      </select>
      <button
        onClick={onSave}
        disabled={status === 'saving'}
        className="rounded px-2 py-1 bg-emerald-500 text-white disabled:opacity-50"
      >
        {status === 'saving' ? 'Saving…' : 'Save best team'}
      </button>
      {status === 'saved' && <span className="text-emerald-700">Saved</span>}
      {status === 'error' && <span className="text-red-700">{error}</span>}
    </div>
  );
};

export default Solve;
