import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayers } from "@/app/lib/players";
import { getAdminData } from "@/app/lib/adminData";
import { getExpectedResults } from "@/app/lib/expectedResults";
import TeamBuilder from "./TeamBuilder";

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/signin?callbackUrl=/2026/top14/team-builder");
  const players = (await getPlayers(session.user.id)) as any[];
  const { currentRound } = await getAdminData();
  const expected = await getExpectedResults(session.user.id);
  const initialResultsForRound = expected[String(currentRound)] ?? null;
  return (
    <TeamBuilder
      players={players}
      currentRound={currentRound}
      initialResultsForRound={initialResultsForRound}
    />
  );
};

export default Fantasy;
