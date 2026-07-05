import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword, signToken, authCookieName } from "@/lib/auth";
import jwt from "jsonwebtoken";

// ── In-memory rate limiter (resets on server restart) ──────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ── Refresh captcha helper ──────────────────────────────────────────────────
function newCaptchaResponse(baseRes: NextResponse) {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const token = jwt.sign({ answer: a + b }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
  baseRes.cookies.set("mmf_captcha", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 300 });
  return baseRes;
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limit ──────────────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo." },
      { status: 429 }
    );
  }

  // ── 2. Validate captcha ────────────────────────────────────────────────────
  const body = await req.json();
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

  // ── 3. Validate credentials ────────────────────────────────────────────────
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    res.cookies.delete("mmf_captcha");
    return res;
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) {
    const res = NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    return newCaptchaResponse(res);
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const res = NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    return newCaptchaResponse(res);
  }

  // ── 4. Success ─────────────────────────────────────────────────────────────
  clearAttempts(ip);
  await prisma.user.update({ where: { id: user.id }, data: { ultimoAcceso: new Date() } });

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(authCookieName, token, { httpOnly: true, sameSite: "lax", path: "/" });
  res.cookies.delete("mmf_captcha");
  return res;
}
