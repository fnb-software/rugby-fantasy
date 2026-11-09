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
            315, 562, 250, 174, 599, 958, 183, 113, 529, 1586, 1765, 294, 1530,
            207, 1513, 411, 1339, 1526,
          ]}
          captainId={958}
        />
      </div>
    </div>
  );
};

export default Fantasy;
