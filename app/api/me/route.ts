import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
}
