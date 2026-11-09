import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayers } from "@/app/lib/players";
import NoPlayers from "../NoPlayers";
import TournamentTeam from "../TournamentTeam";

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/2026/top14");
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;

  return (
    <div className="w-full">
      <div>
        <h1>Team of the championship</h1>
        <TournamentTeam
          players={players}
          teamIds={[
            1513, 1530, 207, 294, 1765, 1586, 529, 958, 183, 113, 599, 174, 562,
            315, 250, 411, 1339, 1526,
          ]}
          captainId={958}
        />
      </div>
    </div>
  );
};

export default Fantasy;
