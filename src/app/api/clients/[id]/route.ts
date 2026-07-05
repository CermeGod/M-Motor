import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = Number(id);
  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...parsed.data,
      fechaConsentimiento: parsed.data.consentimientoDatos ? new Date() : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = Number(id);

  // Block deletion if client has credits
  const creditCount = await prisma.vehicularCredit.count({ where: { clientId } });
  if (creditCount > 0) {
    return NextResponse.json(
      { error: "El cliente tiene cotizaciones registradas y no puede eliminarse" },
      { status: 409 }
    );
  }

  await prisma.client.delete({ where: { id: clientId } });
  return NextResponse.json({ ok: true });
}
