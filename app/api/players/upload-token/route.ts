import { auth } from "@/auth";
import { blobKey } from "@/app/lib/players";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;
  const pathname = blobKey(userId);

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname,
      addRandomSuffix: false,
      allowOverwrite: true,
      validUntil: Date.now() + 60 * 60 * 1000,
    });
    return NextResponse.json({ clientToken, pathname });
  } catch (e) {
    console.error("/api/players/upload-token failed", { userId, error: e });
    const message = e instanceof Error ? e.message : "upload_token_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
