import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user || !requireAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const credits = await prisma.vehicularCredit.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      client: { select: { nombres: true, apellidos: true } },
      vehicle: { select: { marca: true, modelo: true } },
      metrics: { select: { tcea: true } },
    },
  });
  return NextResponse.json(credits);
}
