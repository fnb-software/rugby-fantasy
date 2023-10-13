import Image from 'next/image';
import Link from 'next/link';

const NavBarRenderer = () => {
  return (
    <nav className="fixed left-0 top-0 flex w-full px-3 lg:px-20 py-2 shadow-sm items-center bg-gray-50 gap-1 lg:gap-5">
      <Link
        href="/"
        className="font-semibold hover:cursor-pointer flex items-center gap-1 lg:gap-5"
      >
        RWC 2023 stats & fantasy
      </Link>
    </nav>
  );
};

export default NavBarRenderer;
