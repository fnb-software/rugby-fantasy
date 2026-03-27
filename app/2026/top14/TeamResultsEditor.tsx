type Match = {
  clubdom: string;
  clubext: string;
};

type Props = {
  matches: Match[];
  teamResultsExpected: Record<string, number>;
  onChange: (teamResultsExpected: Record<string, number>) => void;
};

const TeamResultsEditor = ({ matches, teamResultsExpected, onChange }: Props) => {
  return (
    <div className="flex flex-wrap gap-4">
      {matches.map((match) => {
        const homeResult = teamResultsExpected[match.clubdom] ?? 0;
        return (
          <div key={match.clubdom} className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2">
            <span className="font-medium">{match.clubdom}</span>
            <span className="text-slate-400">vs</span>
            <span className="font-medium">{match.clubext}</span>
            <input
              type="number"
              value={homeResult}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onChange({
                  ...teamResultsExpected,
                  [match.clubdom]: val,
                  [match.clubext]: -val,
                });
              }}
              className="w-16 border border-slate-200 rounded px-2 py-1 text-center text-sm"
            />
          </div>
        );
      })}
    </div>
  );
};

export default TeamResultsEditor;
