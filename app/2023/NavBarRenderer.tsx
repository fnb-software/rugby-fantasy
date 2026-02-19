import Image from "next/image";
import Link from "next/link";

const NavBarRenderer = () => {
  return (
    <nav className="fixed left-0 top-0 flex w-full px-3 lg:px-20 py-2 shadow-sm items-center bg-gray-50 gap-1 lg:gap-5">
      <div className="font-semibold">
        RWC 2023{" "}
        <Link
          href="/2023"
          className={`rounded-sm p-1 text-gray-700 bg-cyan-500 hover:bg-cyan-6`}
        >
          stats
        </Link>{" "}
        &{" "}
        <Link
          href="/2023/fantasy"
          className={`rounded-sm p-1 text-gray-700 bg-green-500 hover:bg-green-6`}
        >
          fantasy
        </Link>
      </div>
    </nav>
  );
};

export default NavBarRenderer;
