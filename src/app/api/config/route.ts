import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cfg = await prisma.configuration.findUnique({ where: { userId: user.userId } });
  return NextResponse.json(cfg);
}

export async function PUT(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    defaultMoneda: "PEN" | "USD";
    defaultTipoTasa: "EFECTIVA" | "NOMINAL";
    defaultCapitalizacion: number;
    defaultBaseAnual: 360 | 365;
  };
  const cfg = await prisma.configuration.update({
    where: { userId: user.userId },
    data: body,
  });
  return NextResponse.json(cfg);
}
