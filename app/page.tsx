import Link from 'next/link';

const Home = () => {
  return (
    <div className="lg:w-1/2 flex flex-col gap-4">
      <h4 className="font-semibold">SF matches stats preview</h4>
      <h4 className="text-sm">Match stats after they are played</h4>
      <div>
        <Link className="underline" href={`/match/ARGvNZL`}>
          Argentina vs New Zealand
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/match/ENGvRSA`}>
          England vs South Africa
        </Link>
      </div>
      <h4 className="font-semibold">
        QF matches stats preview and actual match stats
      </h4>
      <div>
        <Link className="underline" href={`/match/WALvARG`}>
          Wales vs Argentina
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/match/IREvNZL`}>
          Ireland vs New Zealand
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/match/ENGvFIJ`}>
          England vs Fidji
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/match/FRAvRSA`}>
          France vs South Africa
        </Link>
      </div>
    </div>
  );
};

export default Home;
