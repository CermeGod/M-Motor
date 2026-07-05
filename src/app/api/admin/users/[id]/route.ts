import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const roleSchema = z.object({ role: z.enum(["ADMIN", "VENDEDOR"]) });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(req);
  if (!user || !requireAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const targetId = Number(id);

  if (targetId === user.userId) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: parsed.data.role },
    select: { id: true, username: true, role: true },
  });
  return NextResponse.json(updated);
}
