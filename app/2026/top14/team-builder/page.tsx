import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayers } from "@/app/lib/players";
import TeamBuilder from "./TeamBuilder";

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/signin?callbackUrl=/2026/top14/team-builder");
  const players = (await getPlayers(session.user.id)) as any[];
  return <TeamBuilder players={players} />;
};

export default Fantasy;
