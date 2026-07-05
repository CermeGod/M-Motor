import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validators";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicleId = Number(id);
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

  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: vehicleId }, data: vehicleData });
    await tx.vehicleService.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        tieneMantenimiento: tieneMantenimiento ?? false,
        descripcionMantenimiento: descripcionMantenimiento ?? null,
        costoMantenimientoAnual: costoMantenimientoAnual ?? null,
        tieneSOAT: tieneSOAT ?? false,
        vigenciaSOAT: vigenciaSOAT ? new Date(vigenciaSOAT) : null,
        tieneSeguroVehicular: tieneSeguroVehicular ?? false,
        coberturaSiniestro: coberturaSiniestro ?? null,
      },
      update: {
        tieneMantenimiento: tieneMantenimiento ?? false,
        descripcionMantenimiento: descripcionMantenimiento ?? null,
        costoMantenimientoAnual: costoMantenimientoAnual ?? null,
        tieneSOAT: tieneSOAT ?? false,
        vigenciaSOAT: vigenciaSOAT ? new Date(vigenciaSOAT) : null,
        tieneSeguroVehicular: tieneSeguroVehicular ?? false,
        coberturaSiniestro: coberturaSiniestro ?? null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicleId = Number(id);

  const creditCount = await prisma.vehicularCredit.count({ where: { vehicleId } });
  if (creditCount > 0) {
    return NextResponse.json(
      { error: "El vehículo tiene cotizaciones registradas y no puede eliminarse" },
      { status: 409 }
    );
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return NextResponse.json({ ok: true });
}
