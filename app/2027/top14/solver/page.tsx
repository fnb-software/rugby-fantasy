import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPlayers } from '@/app/lib/players';
import { getAdminData } from '@/app/lib/adminData';
import NoPlayers from '../NoPlayers';
import Solve from './Solve';

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/2027/top14/solver');
  const isAdmin = session.user.role === 'admin';
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;
  const { currentRound } = await getAdminData();
  return (
    <Solve
      players={players}
      startRound={currentRound - 1}
      endRound={currentRound - 1}
      isAdmin={isAdmin}
    />
  );
};

export default Fantasy;
