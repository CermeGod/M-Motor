import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, signToken, authCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Usuario mínimo 3 caracteres y contraseña mínimo 6 caracteres" },
      { status: 400 },
    );
  }
  const exists = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (exists) return NextResponse.json({ error: "Usuario ya existe" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      configuration: { create: {} },
    },
  });
  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
