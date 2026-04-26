import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/adminAuth";
import { ROUNDS_PER_SEASON, setAdminData } from "@/app/lib/adminData";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const currentRound = (body as { currentRound?: unknown })?.currentRound;
  if (
    typeof currentRound !== "number" ||
    !Number.isInteger(currentRound) ||
    currentRound < 1 ||
    currentRound > ROUNDS_PER_SEASON
  ) {
    return NextResponse.json({ error: "invalid_round" }, { status: 400 });
  }

  const next = await setAdminData((prev) => ({ ...prev, currentRound }));
  return NextResponse.json({ ok: true, currentRound: next.currentRound });
}
