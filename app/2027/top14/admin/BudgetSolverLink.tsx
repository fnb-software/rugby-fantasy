'use client';
import { useState } from 'react';

const BudgetSolverLink = () => {
  const [budget, setBudget] = useState('');

  const getSolverUrl = () => {
    const params = new URLSearchParams();
    if (budget) {
      params.set('budget', budget);
    }
    const queryString = params.toString();
    return `/2027/top14/solver${queryString ? `?${queryString}` : ''}`;
  };

  return (
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
        Open solver with budget
      </a>
    </div>
  );
};

export default BudgetSolverLink;
