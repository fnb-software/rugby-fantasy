import Link from 'next/link';

const Home = () => {
  return (
    <div className="lg:w-1/2 flex flex-col gap-4">
      <h4 className="font-semibold">QF matches stats</h4>
      <div>
        <Link className="underline" href={`/qf/WALvARG`}>
          Wales vs Argentina
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/qf/IREvNZL`}>
          Ireland vs New Zealand
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/qf/ENGvFIJ`}>
          England vs Fidji
        </Link>
      </div>
      <div>
        <Link className="underline" href={`/qf/FRAvRSA`}>
          France vs South Africa
        </Link>
      </div>
    </div>
  );
};

export default Home;
