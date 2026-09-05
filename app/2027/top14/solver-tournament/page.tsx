import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPlayers } from '@/app/lib/players';
import Solve from './Solve';

const Fantasy = async () => {
  const session = await auth();
  if (!session?.user?.id)
    redirect('/signin?callbackUrl=/2027/top14/solver-tournament');
  const players = (await getPlayers(session.user.id)) as any[];
  return <Solve players={players} />;
};

export default Fantasy;
