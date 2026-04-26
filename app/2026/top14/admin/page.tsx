import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminData } from "@/app/lib/adminData";
import CurrentRoundEditor from "./CurrentRoundEditor";

const AdminPage = async () => {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/signin?callbackUrl=/2026/top14/admin");
  if (session.user.role !== "admin") {
    return <div className="p-6">403 — admin only.</div>;
  }
  const { currentRound } = await getAdminData();
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Top 14 admin</h1>
      <CurrentRoundEditor initial={currentRound} />
      <p className="text-sm text-gray-600">
        Best teams are saved from the{" "}
        <a className="underline" href="/2026/top14/solver">
          solver
        </a>{" "}
        page after solving a round.
      </p>
    </div>
  );
};

export default AdminPage;
