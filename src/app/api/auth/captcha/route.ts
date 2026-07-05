import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const answer = a + b;
  const token = jwt.sign({ answer }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
  const res = NextResponse.json({ question: `¿Cuánto es ${a} + ${b}?` });
  res.cookies.set("mmf_captcha", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return res;
}
