import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { blobKey, playersTag } from "@/app/lib/players";

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
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "expected_array" }, { status: 400 });
  }

  const json = JSON.stringify(body);
  await put(blobKey(userId), json, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  revalidateTag(playersTag(userId));

  return NextResponse.json({ ok: true, count: body.length });
}
