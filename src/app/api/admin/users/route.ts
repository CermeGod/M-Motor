import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user || !requireAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, role: true, email: true, createdAt: true, ultimoAcceso: true },
  });
  return NextResponse.json(users);
}
