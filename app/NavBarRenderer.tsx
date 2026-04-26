import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";

const NavBarRenderer = async () => {
  const session = await auth();
  return (
    <nav className="fixed left-0 top-0 flex w-full px-3 lg:px-20 py-2 shadow-sm items-center bg-gray-50 gap-1 lg:gap-5">
      <div className="font-semibold">
        Rugby fantasy{" "}
        <Link
          href="/2026/6nations"
          className={`rounded-sm p-1 text-gray-700 bg-cyan-500 hover:bg-cyan-6`}
        >
          6 Nations
        </Link>{" "}
        <Link
          href="/2026/top14"
          className={`rounded-sm p-1 text-gray-700 bg-green-500 hover:bg-green-6`}
        >
          Top 14
        </Link>{" "}
        <Link
          href="/2023"
          className={`rounded-sm p-1 text-gray-700 bg-purple-300 hover:bg-green-6`}
        >
          RWC 2023
        </Link>
      </div>
      {session?.user && (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
          className="ml-auto"
        >
          <button
            type="submit"
            className="rounded-sm p-1 text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            Sign out
          </button>
        </form>
      )}
    </nav>
  );
};

export default NavBarRenderer;
