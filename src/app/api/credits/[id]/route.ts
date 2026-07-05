import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { calculateCredit } from "@/lib/finance";
import { creditSchema, validationErrorMessage } from "@/lib/validators";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const credit = await prisma.vehicularCredit.findFirst({
    where: { id: Number(id), userId: user.userId },
    include: { client: true, vehicle: true, metrics: true, cashFlows: { orderBy: { numeroMes: "asc" } } },
  });

  if (!credit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(credit);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const creditId = Number(id);

  const current = await prisma.vehicularCredit.findFirst({ where: { id: creditId, userId: user.userId } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = creditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: validationErrorMessage(parsed.error) }, { status: 400 });
  }

  const result = calculateCredit({ ...parsed.data, fechaDesembolso: new Date(parsed.data.fechaDesembolso) });

  await prisma.$transaction([
    prisma.cashFlow.deleteMany({ where: { creditId } }),
    prisma.financialMetric.deleteMany({ where: { creditId } }),
    prisma.vehicularCredit.update({
      where: { id: creditId },
      data: {
        ...parsed.data,
        fechaDesembolso: new Date(parsed.data.fechaDesembolso),
        metrics: { create: { van: result.van, tir: result.tir, tcea: result.tcea } },
        cashFlows: {
          create: result.rows.map((r) => ({
            numeroMes: r.numeroMes,
            fechaPago: r.fechaPago,
            saldoInicial: r.saldoInicial,
            interes: r.interes,
            amortizacion: r.amortizacion,
            seguroDesgravamen: r.seguroDesgravamen,
            seguroVehicular: r.seguroVehicular,
            cuota: r.cuota,
            saldoFinal: r.saldoFinal,
          })),
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
