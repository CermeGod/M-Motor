import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { id: "desc" },
    include: { service: true },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const {
    tieneMantenimiento, descripcionMantenimiento, costoMantenimientoAnual,
    tieneSOAT, vigenciaSOAT, tieneSeguroVehicular, coberturaSiniestro,
    ...vehicleData
  } = parsed.data;

  const vehicle = await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({ data: vehicleData });
    await tx.vehicleService.create({
      data: {
        vehicleId: v.id,
        tieneMantenimiento: tieneMantenimiento ?? false,
        descripcionMantenimiento: descripcionMantenimiento ?? null,
        costoMantenimientoAnual: costoMantenimientoAnual ?? null,
        tieneSOAT: tieneSOAT ?? false,
        vigenciaSOAT: vigenciaSOAT ? new Date(vigenciaSOAT) : null,
        tieneSeguroVehicular: tieneSeguroVehicular ?? false,
        coberturaSiniestro: coberturaSiniestro ?? null,
      },
    });
    return v;
  });

  return NextResponse.json(vehicle);
}
