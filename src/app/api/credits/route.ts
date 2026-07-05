import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { calculateCredit } from "@/lib/finance";
import { creditSchema, validationErrorMessage } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientIdParam = req.nextUrl.searchParams.get("clientId");
  const whereClause: any = { userId: user.userId };
  if (clientIdParam) {
    whereClause.clientId = Number(clientIdParam);
  }

  const credits = await prisma.vehicularCredit.findMany({
    where: whereClause,
    include: { client: true, vehicle: true, metrics: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(credits);
}

export async function POST(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = creditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: validationErrorMessage(parsed.error) }, { status: 400 });
  }

  const result = calculateCredit({ ...parsed.data, fechaDesembolso: new Date(parsed.data.fechaDesembolso) });

  const created = await prisma.vehicularCredit.create({
    data: {
      userId: user.userId,
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
  });

  return NextResponse.json({ id: created.id });
}
