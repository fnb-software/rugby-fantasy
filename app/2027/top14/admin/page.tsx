import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAdminData } from '@/app/lib/adminData';
import { getPlayers } from '@/app/lib/players';
import rounds from '@/2027/top14/data/rounds';
import CurrentRoundEditor from './CurrentRoundEditor';
import NoPlayers from '../NoPlayers';
import TeamsheetsEditor from './TeamsheetsEditor';

const AdminPage = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect('/signin?callbackUrl=/2027/top14/admin');
  if (session.user.role !== 'admin') {
    return <div className="p-6">403 — admin only.</div>;
  }
  const admin = await getAdminData();
  const { currentRound } = admin;
  const roundInfo = rounds.find(
    (r) => parseInt(r.journee.numero) === currentRound,
  );
  const clubs = roundInfo
    ? Array.from(
        new Set(
          roundInfo.journee.matchs.flatMap((m) => [m.clubdom, m.clubext]),
        ),
      )
    : [];
  const players = (await getPlayers(session.user.id)) as {
    nom: string;
    nomcomplet: string;
    club: string;
  }[];
  const savedTeamsheets = admin.teamsheets[String(currentRound)] ?? {};
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Top 14 admin</h1>
      {players.length === 0 && <NoPlayers variant="banner" />}
      <CurrentRoundEditor initial={currentRound} />
      <p className="text-sm text-gray-600">
        Best teams are saved from the{' '}
        <a className="underline" href="/2027/top14/solver">
          solver
        </a>{' '}
        page after solving a round.
      </p>
      <TeamsheetsEditor
        round={currentRound}
        clubs={clubs}
        players={players}
        initial={savedTeamsheets}
      />
    </div>
  );
};

export default AdminPage;
