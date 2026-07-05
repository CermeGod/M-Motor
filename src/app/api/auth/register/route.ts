import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, signToken, authCookieName } from "@/lib/auth";
import jwt from "jsonwebtoken";

function newCaptchaResponse(baseRes: NextResponse) {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const token = jwt.sign({ answer: a + b }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
  baseRes.cookies.set("mmf_captcha", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 });
  return baseRes;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ── 1. Validate captcha ────────────────────────────────────────────────────
  const captchaToken = req.cookies.get("mmf_captcha")?.value;
  if (!captchaToken) {
    const res = NextResponse.json({ error: "Captcha expirado. Recarga la página.", captchaExpired: true }, { status: 400 });
    return newCaptchaResponse(res);
  }

  let captchaPayload: { answer: number } | null = null;
  try {
    captchaPayload = jwt.verify(captchaToken, process.env.JWT_SECRET as string) as { answer: number };
  } catch {
    const res = NextResponse.json({ error: "Captcha expirado. Recarga la página.", captchaExpired: true }, { status: 400 });
    return newCaptchaResponse(res);
  }

  const userAnswer = Number(body.captchaAnswer);
  if (isNaN(userAnswer) || userAnswer !== captchaPayload.answer) {
    const res = NextResponse.json({ error: "Respuesta incorrecta. Intenta de nuevo.", captchaWrong: true }, { status: 400 });
    return newCaptchaResponse(res);
  }

  // ── 2. Validate input ──────────────────────────────────────────────────────
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Datos inválidos (Asegúrate de llenar todos los campos correctamente)" },
      { status: 400 },
    );
    return newCaptchaResponse(res);
  }

  const exists = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (exists) {
    const res = NextResponse.json({ error: "Usuario ya existe" }, { status: 409 });
    return newCaptchaResponse(res);
  }

  // ── 3. Create user ─────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      email: parsed.data.email,
      telefono: parsed.data.telefono,
      passwordHash: await hashPassword(parsed.data.password),
      configuration: { create: {} },
    },
  });

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(authCookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  res.cookies.delete("mmf_captcha");
  return res;
}
