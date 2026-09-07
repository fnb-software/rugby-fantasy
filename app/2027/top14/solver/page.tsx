import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPlayers } from '@/app/lib/players';
import { getAdminData } from '@/app/lib/adminData';
import NoPlayers from '../NoPlayers';
import Solve from './Solve';

const Fantasy = async ({ searchParams }: { searchParams?: { budget?: string } }) => {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/2027/top14/solver');
  const isAdmin = session.user.role === 'admin';
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;
  const { currentRound } = await getAdminData();
  const budget = searchParams?.budget ? parseInt(searchParams.budget, 10) : undefined;
  return (
    <Solve
      players={players}
      startRound={currentRound - 1}
      endRound={currentRound - 1}
      isAdmin={isAdmin}
      budget={budget}
    />
  );
};

export default Fantasy;
