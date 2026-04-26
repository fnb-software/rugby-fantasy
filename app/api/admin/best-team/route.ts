import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/adminAuth";
import {
  ROUNDS_PER_SEASON,
  setAdminData,
  variantKey,
  type Variant,
} from "@/app/lib/adminData";

const VARIANTS: Variant[] = ["full", "noClubLimit", "secondNoClubLimit"];

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { variant, round, teamIds, captainId } = (body ?? {}) as {
    variant?: unknown;
    round?: unknown;
    teamIds?: unknown;
    captainId?: unknown;
  };

  if (typeof variant !== "string" || !VARIANTS.includes(variant as Variant)) {
    return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
  }
  if (
    typeof round !== "number" ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > ROUNDS_PER_SEASON
  ) {
    return NextResponse.json({ error: "invalid_round" }, { status: 400 });
  }
  if (
    !Array.isArray(teamIds) ||
    teamIds.length !== 18 ||
    !teamIds.every((id) => typeof id === "number" && Number.isInteger(id))
  ) {
    return NextResponse.json({ error: "invalid_team_ids" }, { status: 400 });
  }
  if (typeof captainId !== "number" || !Number.isInteger(captainId)) {
    return NextResponse.json({ error: "invalid_captain" }, { status: 400 });
  }

  const key = variantKey(variant as Variant);
  await setAdminData((prev) => {
    const list = [...prev[key]];
    list[round - 1] = { teamIds: teamIds as number[], captainId };
    return { ...prev, [key]: list };
  });
  return NextResponse.json({ ok: true });
}
