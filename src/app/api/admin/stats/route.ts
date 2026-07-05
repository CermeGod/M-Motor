import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user || !requireAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalClients, totalCredits, creditAgg] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.vehicularCredit.count(),
    prisma.vehicularCredit.groupBy({
      by: ["moneda"],
      _sum: { precioVehiculo: true },
    }),
  ]);

  const totalFinanciado = creditAgg.reduce(
    (acc, row) => ({ ...acc, [row.moneda]: Number(row._sum.precioVehiculo ?? 0) }),
    {} as Record<string, number>
  );

  return NextResponse.json({ totalUsers, totalClients, totalCredits, totalFinanciado });
}
