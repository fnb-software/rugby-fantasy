import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/lib/adminAuth';
import { ROUNDS_PER_SEASON, setAdminData } from '@/app/lib/adminData';
import type { Teamsheet, TeamsheetEntry } from '@/app/2027/top14/teamsheets';
import rounds from '@/2027/top14/data/rounds';

const normalizeEntry = (e: unknown): TeamsheetEntry | null => {
  if (typeof e === 'string') {
    const name = e.trim();
    return name ? name : null;
  }
  if (e && typeof e === 'object' && 'name' in e) {
    const name = String((e as { name: unknown }).name ?? '').trim();
    if (!name) return null;
    const uncertain = !!(e as { uncertain?: unknown }).uncertain;
    return { name, uncertain };
  }
  return null;
};

const normalizeTeamsheet = (ts: unknown): Teamsheet | null => {
  if (!ts || typeof ts !== 'object') return null;
  const { starters, subs } = ts as { starters?: unknown; subs?: unknown };
  if (!Array.isArray(starters) || !Array.isArray(subs)) return null;
  return {
    starters: starters
      .map(normalizeEntry)
      .filter((e): e is TeamsheetEntry => e !== null),
    subs: subs
      .map(normalizeEntry)
      .filter((e): e is TeamsheetEntry => e !== null),
  };
};

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { round, teamsheets } = (body ?? {}) as {
    round?: unknown;
    teamsheets?: unknown;
  };

  if (
    typeof round !== 'number' ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > ROUNDS_PER_SEASON
  ) {
    return NextResponse.json({ error: 'invalid_round' }, { status: 400 });
  }
  if (
    !teamsheets ||
    typeof teamsheets !== 'object' ||
    Array.isArray(teamsheets)
  ) {
    return NextResponse.json({ error: 'invalid_teamsheets' }, { status: 400 });
  }

  const roundInfo = rounds.find((r) => parseInt(r.journee.numero) === round);
  if (!roundInfo) {
    return NextResponse.json({ error: 'round_not_in_data' }, { status: 400 });
  }
  const allowed = new Set(
    roundInfo.journee.matchs.flatMap((m) => [m.clubdom, m.clubext]),
  );

  const cleaned: Record<string, Teamsheet> = {};
  for (const [club, ts] of Object.entries(
    teamsheets as Record<string, unknown>,
  )) {
    if (!allowed.has(club)) continue;
    const norm = normalizeTeamsheet(ts);
    if (!norm) continue;
    cleaned[club] = norm;
  }

  await setAdminData((prev) => ({
    ...prev,
    teamsheets: { ...prev.teamsheets, [String(round)]: cleaned },
  }));

  return NextResponse.json({ ok: true, count: Object.keys(cleaned).length });
}
