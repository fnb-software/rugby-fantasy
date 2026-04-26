import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAdmin } from "@/app/lib/adminAuth";
import { ROUNDS_PER_SEASON } from "@/app/lib/adminData";
import { getPlayers } from "@/app/lib/players";
import { extractTeamsheets } from "@/app/lib/teamsheetsExtract";
import { matchesName } from "@/app/2026/top14/statsUtil";
import rounds from "@/2026/top14/data/rounds";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { urls, round } = (body ?? {}) as {
    urls?: unknown;
    round?: unknown;
  };

  if (
    !Array.isArray(urls) ||
    urls.length === 0 ||
    !urls.every((u) => typeof u === "string" && /^https?:\/\//.test(u))
  ) {
    return NextResponse.json({ error: "invalid_urls" }, { status: 400 });
  }
  if (
    typeof round !== "number" ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > ROUNDS_PER_SEASON
  ) {
    return NextResponse.json({ error: "invalid_round" }, { status: 400 });
  }

  const roundInfo = rounds.find(
    (r) => parseInt(r.journee.numero) === round,
  );
  if (!roundInfo) {
    return NextResponse.json({ error: "round_not_in_data" }, { status: 400 });
  }
  const canonicalClubs = Array.from(
    new Set(
      roundInfo.journee.matchs.flatMap((m) => [m.clubdom, m.clubext]),
    ),
  );

  const session = await auth();
  const players = (await getPlayers(session!.user!.id)) as any[];

  let extract;
  try {
    extract = await extractTeamsheets({
      urls: urls as string[],
      canonicalClubs,
    });
  } catch (e) {
    console.error("/api/admin/teamsheets/extract failed", {
      urls,
      round,
      error: e,
    });
    const message = e instanceof Error ? e.message : "extract_failed";
    const status = message === "missing_groq_api_key" ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }

  const enriched: Record<
    string,
    {
      starters: { name: string; uncertain: boolean; matched: boolean }[];
      subs: { name: string; uncertain: boolean; matched: boolean }[];
    }
  > = {};
  for (const [club, ts] of Object.entries(extract.teamsheets)) {
    const clubPlayers = players.filter((p: any) => p.club === club);
    const tag = (e: any) => {
      const name = typeof e === "string" ? e : e.name;
      const uncertain = typeof e === "string" ? false : !!e.uncertain;
      const matched = clubPlayers.some((p: any) => matchesName(p, name));
      return { name, uncertain, matched };
    };
    enriched[club] = {
      starters: ts.starters.map(tag),
      subs: ts.subs.map(tag),
    };
  }

  return NextResponse.json({
    teamsheets: enriched,
    fetchErrors: extract.fetchErrors,
  });
}
