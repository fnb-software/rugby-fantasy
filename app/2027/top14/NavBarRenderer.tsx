import Link from 'next/link';
import { auth } from '@/auth';

const NavBarRenderer = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  return (
    <nav className="fixed left-0 top-0 flex w-full px-3 lg:px-20 py-2 shadow-sm items-center bg-gray-50 gap-1 lg:gap-5">
      <div className="font-semibold">
        Top 14 26/27{' '}
        <Link
          href="/2027/top14"
          className={`rounded-sm p-1 text-gray-700 bg-cyan-500 hover:bg-cyan-6`}
        >
          fantasy
        </Link>{' '}
        <Link
          href="/2027/top14/team-builder"
          className={`rounded-sm p-1 text-gray-700 bg-emerald-500 hover:bg-emerald-6`}
        >
          team builder
        </Link>
        {isAdmin && (
          <>
            {' '}
            <Link
              href="/2027/top14/admin"
              className={`rounded-sm p-1 text-gray-700 bg-amber-400 hover:bg-amber-500`}
            >
              admin
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBarRenderer;
