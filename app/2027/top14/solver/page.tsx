import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayers } from "@/app/lib/players";
import { getAdminData } from "@/app/lib/adminData";
import NoPlayers from "../NoPlayers";
import Solve from "./Solve";
import {
  EMPTY_PLAYER_COUNT,
  EMPTY_TEAM_POSITION,
} from "@/2027/top14/minizinc/params";

const Fantasy = async ({
  searchParams,
}: {
  searchParams: Promise<{ budget?: string; emptyPlayers?: string }>;
}) => {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/2027/top14/solver");
  const isAdmin = session.user.role === "admin";
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;
  const { currentRound } = await getAdminData();
  const resolvedSearchParams = await searchParams;
  const budget = resolvedSearchParams.budget
    ? parseInt(resolvedSearchParams.budget, 10)
    : undefined;
  const emptyPlayersEnabled = resolvedSearchParams.emptyPlayers === "true";
  // Add 18 empty players for optional slots only when budget is constrained and enabled
  let allPlayersWithEmpty = players;
  if (budget !== undefined && emptyPlayersEnabled) {
    // Each empty player has the position for its corresponding slot in the team
    // team_position from fantasy.mzn: [12, 12, 13, 11, 11, 10, 10, 10, 9, 8, 6, 6, 5, 7, 7]

    const emptyPlayers = [];
    for (let i = 1; i <= EMPTY_PLAYER_COUNT; i++) {
      const slotIndex = i - 1; // 0-based index
      const position = EMPTY_TEAM_POSITION[slotIndex];
      emptyPlayers.push({
        id: -i,
        id_club: -1,
        id_position: position,
        valeur: 0,
      });
    }
    allPlayersWithEmpty = [...players, ...emptyPlayers];
  }
  return (
    <Solve
      players={allPlayersWithEmpty}
      startRound={currentRound - 1}
      endRound={currentRound - 1}
      isAdmin={isAdmin}
      budget={budget}
    />
  );
};

export default Fantasy;
