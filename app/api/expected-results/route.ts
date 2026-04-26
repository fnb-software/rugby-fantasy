import { NextResponse } from "next/server";
import { put, get } from "@vercel/blob";
import { auth } from "@/auth";
import {
  expectedResultsBlobKey,
  type ExpectedResults,
} from "@/app/lib/expectedResults";
import { ROUNDS_PER_SEASON } from "@/app/lib/adminData";

const isPlainNumberRecord = (v: unknown): v is Record<string, number> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every(
    (n) => typeof n === "number" && Number.isFinite(n),
  );
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { round, results } = (body ?? {}) as {
    round?: unknown;
    results?: unknown;
  };

  if (
    typeof round !== "number" ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > ROUNDS_PER_SEASON
  ) {
    return NextResponse.json({ error: "invalid_round" }, { status: 400 });
  }
  if (!isPlainNumberRecord(results)) {
    return NextResponse.json({ error: "invalid_results" }, { status: 400 });
  }

  const key = expectedResultsBlobKey(userId);
  const existing = await get(key, { access: "private", useCache: false });
  let merged: ExpectedResults = {};
  if (existing && existing.statusCode === 200) {
    const text = await new Response(existing.stream).text();
    merged = JSON.parse(text) as ExpectedResults;
  }
  merged[String(round)] = results;

  await put(key, JSON.stringify(merged), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return NextResponse.json({ ok: true });
}
