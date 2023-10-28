import Link from 'next/link';

const Home = () => {
  return (
    <div className="lg:w-1/2 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div>
          <h4 className="font-semibold text-xl">Finals stats preview</h4>
          <span className="text-sm text-gray-500">
            Match stats after they are played
          </span>
        </div>
        <div>
          <Link className="underline" href={`/match/NZLvRSA`}>
            🇳🇿 New Zealand vs South Africa 🇿🇦
          </Link>
        </div>
        <div>
          <Link className="underline" href={`/match/ENGvARG2`}>
            🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs Argentina 🇦🇷
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <h4 className="font-semibold text-xl">
            SF match stats (and preview)
          </h4>
          <span className="text-sm text-gray-500">
            Match stats after they are played
          </span>
        </div>
        <div>
          <Link className="underline" href={`/match/ARGvNZL`}>
            🇦🇷 Argentina vs New Zealand 🇳🇿
          </Link>
        </div>
        <div>
          <Link className="underline" href={`/match/ENGvRSA`}>
            🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs South Africa 🇿🇦
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h4 className="font-semibold text-xl">QF match stats (and preview)</h4>
        <div>
          <Link className="underline" href={`/match/WALvARG`}>
            🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales vs Argentina 🇦🇷
          </Link>
        </div>
        <div>
          <Link className="underline" href={`/match/IREvNZL`}>
            🇮🇪 Ireland vs New Zealand 🇳🇿
          </Link>
        </div>
        <div>
          <Link className="underline" href={`/match/ENGvFIJ`}>
            🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs Fidji 🇫🇯
          </Link>
        </div>
        <div>
          <Link className="underline" href={`/match/FRAvRSA`}>
            🇫🇷 France vs South Africa 🇿🇦
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
