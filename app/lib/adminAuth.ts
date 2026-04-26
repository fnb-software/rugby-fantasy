import "server-only";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const requireAdmin = async (): Promise<NextResponse | null> => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
};
