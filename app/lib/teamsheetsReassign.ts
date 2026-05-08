import { matchesName } from "../2026/top14/statsUtil";
import type { Teamsheet } from "../2026/top14/teamsheets";

export type ReassignedEntry = { name: string; uncertain: boolean };
export type ReassignedTeamsheet = {
  starters: ReassignedEntry[];
  subs: ReassignedEntry[];
};

type Player = { club: string; nom: string; nomcomplet: string };
type Match = { clubdom: string; clubext: string };

// Three-stage roster-based reassignment. The LLM sometimes mixes players
// between the two clubs of a match (most common with allrugby's three-column
// "Name | NUMBER | Name" layout). Using the player roster as ground truth:
//
//   1. Position-preserving swap: for each canonical match pair, walk both
//      teamsheets in parallel; if A[i] belongs to B AND B[i] belongs to A,
//      swap them in place. Handles clean column-flips with order preserved.
//   2. Per-player fallback: any remaining player not in their assigned club's
//      roster is moved to the canonical match partner if the partner's roster
//      matches them. Bounded to the partner so we never pull players across
//      matches.
//   3. Dedupe within each club: drop duplicate names (case/accent/punct
//      insensitive), starters wins over subs. Fixes the common LLM artefact
//      of listing the same player in two clubs (one correctly, one not).
export const reassignTeamsheets = ({
  extracted,
  players,
  matches,
}: {
  extracted: Record<string, Teamsheet>;
  players: Player[];
  matches: Match[];
}): Record<string, ReassignedTeamsheet> => {
  const extractedClubs = Object.keys(extracted);
  const rosterByClub = new Map<string, Player[]>(
    extractedClubs.map((c) => [c, players.filter((p) => p.club === c)]),
  );
  const matchPair = new Map<string, string>();
  for (const m of matches) {
    matchPair.set(m.clubdom, m.clubext);
    matchPair.set(m.clubext, m.clubdom);
  }

  const belongsTo = (name: string, club: string) =>
    (rosterByClub.get(club) ?? []).some((p) => matchesName(p, name));

  const working: Record<string, ReassignedTeamsheet> = {};
  for (const [club, ts] of Object.entries(extracted)) {
    working[club] = {
      starters: ts.starters.map(toReassignedEntry),
      subs: ts.subs.map(toReassignedEntry),
    };
  }

  for (const [a, b] of matchPair.entries()) {
    if (a >= b) continue;
    const aTs = working[a];
    const bTs = working[b];
    if (!aTs || !bTs) continue;
    swapMisplaced(aTs.starters, bTs.starters, a, b, belongsTo);
    swapMisplaced(aTs.subs, bTs.subs, a, b, belongsTo);
  }

  const correctClub = (name: string, currentClub: string): string => {
    if (belongsTo(name, currentClub)) return currentClub;
    const partner = matchPair.get(currentClub);
    if (partner && working[partner] && belongsTo(name, partner)) return partner;
    return currentClub;
  };
  const corrected: Record<string, ReassignedTeamsheet> = Object.fromEntries(
    extractedClubs.map((c) => [c, { starters: [], subs: [] }]),
  );
  type Stray = {
    target: string;
    role: "starters" | "subs";
    entry: ReassignedEntry;
  };
  const strays: Stray[] = [];
  for (const [club, ts] of Object.entries(working)) {
    for (const role of ["starters", "subs"] as const) {
      for (const e of ts[role]) {
        const target = correctClub(e.name, club);
        if (target === club) corrected[club][role].push(e);
        else strays.push({ target, role, entry: e });
      }
    }
  }
  for (const s of strays) corrected[s.target][s.role].push(s.entry);

  for (const club of extractedClubs) {
    const ts = corrected[club];
    const seen = new Set<string>();
    const keep = (e: ReassignedEntry) => {
      const k = dedupeKey(e.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    };
    ts.starters = ts.starters.filter(keep);
    ts.subs = ts.subs.filter(keep);
  }

  return corrected;
};

const toReassignedEntry = (
  e: string | { name: string; uncertain?: boolean },
): ReassignedEntry => ({
  name: typeof e === "string" ? e : e.name,
  uncertain: typeof e === "string" ? false : !!e.uncertain,
});

const swapMisplaced = (
  aArr: ReassignedEntry[],
  bArr: ReassignedEntry[],
  a: string,
  b: string,
  belongsTo: (name: string, club: string) => boolean,
) => {
  const len = Math.min(aArr.length, bArr.length);
  for (let i = 0; i < len; i++) {
    if (
      !belongsTo(aArr[i].name, a) &&
      belongsTo(aArr[i].name, b) &&
      !belongsTo(bArr[i].name, b) &&
      belongsTo(bArr[i].name, a)
    ) {
      [aArr[i], bArr[i]] = [bArr[i], aArr[i]];
    }
  }
};

const dedupeKey = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\- ]/g, "");
