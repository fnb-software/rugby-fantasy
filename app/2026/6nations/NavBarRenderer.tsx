import Image from "next/image";
import Link from "next/link";

const NavBarRenderer = () => {
  return (
    <nav className="fixed left-0 top-0 flex w-full px-3 lg:px-20 py-2 shadow-sm items-center bg-gray-50 gap-1 lg:gap-5">
      <div className="font-semibold">
        6 Nations 2026{" "}
        <Link
          href="/2026"
          className={`rounded-sm p-1 text-gray-700 bg-cyan-500 hover:bg-cyan-6`}
        >
          fantasy
        </Link>
      </div>
    </nav>
  );
};

export default NavBarRenderer;
