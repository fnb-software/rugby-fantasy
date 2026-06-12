import "server-only";
import { get, put } from "@vercel/blob";
import { revalidateTag, unstable_cache } from "next/cache";
import { TEAMS } from "@/app/2026/top14/bestTeams";
import { TEAMS_NO_CLUB_LIMIT } from "@/app/2026/top14/bestTeamsNoClubLimit";
import { TEAMS_SECOND_NO_CLUB_LIMIT } from "@/app/2026/top14/bestSecondTeamsNoClubLimits";
import { TEAMSHEETS, type Teamsheet } from "@/app/2026/top14/teamsheets";

export type Best = { teamIds: number[]; captainId: number } | null;

export type Variant = "full" | "noClubLimit" | "secondNoClubLimit";

export type RoundTeamsheets = Record<string, Teamsheet>;

export type AdminData = {
  currentRound: number;
  teams: Best[];
  teamsNoClubLimit: Best[];
  teamsSecondNoClubLimit: Best[];
  teamsheets: Record<string, RoundTeamsheets>;
};

export const ADMIN_BLOB_KEY = "top14-2026/admin.json";
export const ADMIN_TAG = "admin:top14-2026";
export const ROUNDS_PER_SEASON = 29;

const padRounds = (arr: ReadonlyArray<Best>): Best[] => {
  const out: Best[] = arr.slice(0, ROUNDS_PER_SEASON) as Best[];
  while (out.length < ROUNDS_PER_SEASON) out.push(null);
  return out;
};

const seed = (): AdminData => ({
  currentRound: 1,
  teams: padRounds(TEAMS as Best[]),
  teamsNoClubLimit: padRounds(TEAMS_NO_CLUB_LIMIT as Best[]),
  teamsSecondNoClubLimit: padRounds(TEAMS_SECOND_NO_CLUB_LIMIT as Best[]),
  teamsheets: { "1": { ...TEAMSHEETS } },
});

const fetchFromBlob = async (): Promise<AdminData> => {
  const result = await get(ADMIN_BLOB_KEY, { access: "public" });
  if (!result || result.statusCode !== 200) return seed();
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as Partial<AdminData>;
  return { ...seed(), ...parsed };
};

export const getAdminData = (): Promise<AdminData> =>
  unstable_cache(fetchFromBlob, ["admin", ADMIN_BLOB_KEY], {
    tags: [ADMIN_TAG],
  })();

export const setAdminData = async (
  updater: (prev: AdminData) => AdminData,
): Promise<AdminData> => {
  const prev = await fetchFromBlob();
  const next = updater(prev);
  await put(ADMIN_BLOB_KEY, JSON.stringify(next), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  revalidateTag(ADMIN_TAG);
  return next;
};

export const variantKey = (
  v: Variant,
): "teams" | "teamsNoClubLimit" | "teamsSecondNoClubLimit" => {
  switch (v) {
    case "full":
      return "teams";
    case "noClubLimit":
      return "teamsNoClubLimit";
    case "secondNoClubLimit":
      return "teamsSecondNoClubLimit";
  }
};
