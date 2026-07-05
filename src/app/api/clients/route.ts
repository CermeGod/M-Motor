import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clients = await prisma.client.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { credits: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = await prisma.client.create({
    data: {
      ...parsed.data,
      fechaConsentimiento: parsed.data.consentimientoDatos ? new Date() : null,
    },
  });
  return NextResponse.json(data);
}
