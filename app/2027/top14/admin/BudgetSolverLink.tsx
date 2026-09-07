'use client';
import { useState } from 'react';

type SolverMode = 'points' | 'costProgression';

const BudgetSolverLink = () => {
  const [budget, setBudget] = useState('');
  const [mode, setMode] = useState<SolverMode>('points');

  const getSolverUrl = () => {
    const params = new URLSearchParams();
    if (budget) {
      params.set('budget', budget);
    }
    const queryString = params.toString();
    const basePath = mode === 'costProgression' 
      ? '/2027/top14/solver-cost-progression'
      : '/2027/top14/solver';
    return `${basePath}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="mode" className="text-sm text-gray-600">
          Solver mode:
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as SolverMode)}
          className="border rounded px-2 py-1"
        >
          <option value="points">Maximize points</option>
          <option value="costProgression">Maximize cost progression</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="budget" className="text-sm text-gray-600">
          Budget limit:
        </label>
        <input
          id="budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Optional"
          className="border rounded px-2 py-1 w-32"
        />
        <a
          href={getSolverUrl()}
          className="underline text-sm"
        >
          Open solver
        </a>
      </div>
    </div>
  );
};

export default BudgetSolverLink;
