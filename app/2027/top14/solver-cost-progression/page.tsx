import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPlayers } from '@/app/lib/players';
import { getAdminData } from '@/app/lib/adminData';
import NoPlayers from '../NoPlayers';
import SolveCostProgression from './SolveCostProgression';

const CostProgression = async ({ searchParams }: { searchParams: Promise<{ budget?: string }> }) => {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/2027/top14/solver-cost-progression');
  const isAdmin = session.user.role === 'admin';
  const players = (await getPlayers(session.user.id)) as any[];
  if (players.length === 0) return <NoPlayers />;
  const { currentRound } = await getAdminData();
  const resolvedSearchParams = await searchParams;
  const budget = resolvedSearchParams.budget ? parseInt(resolvedSearchParams.budget, 10) : undefined;
  return (
    <SolveCostProgression
      players={players}
      startRound={currentRound - 1}
      endRound={currentRound - 1}
      isAdmin={isAdmin}
      budget={budget}
    />
  );
};

export default CostProgression;
