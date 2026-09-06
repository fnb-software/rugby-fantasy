type Match = {
  clubdom: string;
  clubext: string;
};

type Props = {
  matches: Match[];
  teamResultsExpected: Record<string, number>;
  onChange: (teamResultsExpected: Record<string, number>) => void;
};

const ALLRUGBY_SLUGS: Record<string, string> = {
  Toulouse: 'stade-toulousain',
  'La Rochelle': 'la-rochelle',
  'Bordeaux-Bègles': 'union-bordeaux-begles',
  'Racing 92': 'racing-92',
  'Stade français': 'stade-francais-paris',
  Toulon: 'rugby-club-toulonnais',
  Clermont: 'asm-clermont-auvergne',
  Lyon: 'lou',
  Castres: 'castres-olympique',
  Montpellier: 'montpellier',
  Pau: 'pau',
  Bayonne: 'aviron-bayonnais',
  Perpignan: 'usap',
  Vannes: 'rcvannes',
};

const clubLink = (club: string) => {
  const slug = ALLRUGBY_SLUGS[club];
  if (!slug) return <span className="font-medium">{club}</span>;
  return (
    <a
      href={`https://www.allrugby.com/clubs/${slug}/calendrier`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-600 hover:underline"
    >
      {club}
    </a>
  );
};

const TeamResultsEditor = ({
  matches,
  teamResultsExpected,
  onChange,
}: Props) => {
  return (
    <div className="flex flex-wrap gap-4">
      {matches.map((match) => {
        const homeResult = teamResultsExpected[match.clubdom] ?? 0;
        return (
          <div
            key={match.clubdom}
            className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2"
          >
            {clubLink(match.clubdom)}
            <span className="text-slate-400">vs</span>
            {clubLink(match.clubext)}
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
