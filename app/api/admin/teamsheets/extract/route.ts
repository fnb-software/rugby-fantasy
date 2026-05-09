import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAdmin } from "@/app/lib/adminAuth";
import { ROUNDS_PER_SEASON } from "@/app/lib/adminData";
import { getPlayers } from "@/app/lib/players";
import { extractTeamsheets } from "@/app/lib/teamsheetsExtract";
import { reassignTeamsheets } from "@/app/lib/teamsheetsReassign";
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
  const { urls, texts, round } = (body ?? {}) as {
    urls?: unknown;
    texts?: unknown;
    round?: unknown;
  };

  const urlList: string[] = Array.isArray(urls)
    ? urls.filter(
        (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
      )
    : [];
  const textList: string[] = Array.isArray(texts)
    ? texts.filter(
        (t): t is string => typeof t === "string" && t.trim().length > 0,
      )
    : [];
  if (urlList.length === 0 && textList.length === 0) {
    return NextResponse.json({ error: "no_input" }, { status: 400 });
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
  const playerSurnames = players
    .map((p: any) => {
      const full: string = typeof p?.nomcomplet === "string" ? p.nomcomplet : "";
      const i = full.lastIndexOf(" ");
      return (i >= 0 ? full.slice(i + 1) : full).trim();
    })
    .filter((s) => s.length > 0);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (msg: object) =>
        controller.enqueue(enc.encode(JSON.stringify(msg) + "\n"));

      try {
        const extract = await extractTeamsheets({
          urls: urlList,
          texts: textList,
          canonicalClubs,
          playerSurnames,
          onAttempt: (event) => send({ type: "attempt", ...event }),
        });

        const corrected = reassignTeamsheets({
          extracted: extract.teamsheets,
          players,
          matches: roundInfo.journee.matchs as any[],
        });

        const enriched: Record<
          string,
          {
            starters: { name: string; uncertain: boolean; matched: boolean }[];
            subs: { name: string; uncertain: boolean; matched: boolean }[];
          }
        > = {};
        for (const [club, ts] of Object.entries(corrected)) {
          const clubPlayers = players.filter((p: any) => p.club === club);
          const tag = (e: { name: string; uncertain: boolean }) => ({
            ...e,
            matched: clubPlayers.some((p: any) => matchesName(p, e.name)),
          });
          enriched[club] = {
            starters: ts.starters.map(tag),
            subs: ts.subs.map(tag),
          };
        }

        send({
          type: "done",
          teamsheets: enriched,
          fetchErrors: extract.fetchErrors,
        });
      } catch (e) {
        console.error("/api/admin/teamsheets/extract failed", {
          urls: urlList,
          textCount: textList.length,
          round,
          error: e,
        });
        const message = e instanceof Error ? e.message : "extract_failed";
        send({ type: "error", message });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-store",
    },
  });
}
