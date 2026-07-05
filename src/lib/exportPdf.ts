import jsPDF from "jspdf";
import "jspdf-autotable";

export function exportPdf(credit: any) {
  const doc = new jsPDF();
  const fmt = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 2 });
  const fmtP = (n: number) => Number(n).toFixed(2);
  
  // Title
  doc.setFontSize(18);
  doc.text("M-Motors Finance App", 14, 20);
  doc.setFontSize(14);
  doc.text("Plan de Pagos — Compra Inteligente", 14, 30);
  
  // Client and Vehicle
  doc.setFontSize(10);
  doc.text(`Cliente: ${credit.client.nombres} ${credit.client.apellidos}`, 14, 45);
  doc.text(`DNI: ${credit.client.dni}`, 14, 52);
  doc.text(`Vehículo: ${credit.vehicle.marca} ${credit.vehicle.modelo}`, 100, 45);
  doc.text(`Moneda: ${credit.moneda}`, 100, 52);

  // Params
  doc.text(`Precio Venta: ${fmt(Number(credit.precioVehiculo))}`, 14, 65);
  doc.text(`Cuota Inicial: ${fmtP(credit.cuotaInicialPorcentaje)}%`, 14, 72);
  doc.text(`Cuota Balón: ${fmtP(credit.cuotaBalonPorcentaje)}%`, 14, 79);
  doc.text(`Tasa ${credit.tipoTasa}: ${fmtP(credit.tasaInteres)}%`, 100, 65);
  doc.text(`Plazo: ${credit.plazoMeses} meses`, 100, 72);
  doc.text(`Gracia: ${credit.periodoGraciaTipo} (${credit.periodosGracia} meses)`, 100, 79);

  // Metrics
  if (credit.metrics) {
    doc.text(`TCEA: ${fmtP(credit.metrics.tcea)}%`, 14, 92);
    doc.text(`TIR Mensual: ${fmtP(credit.metrics.tir)}%`, 100, 92);
    doc.text(`VAN: ${fmt(Number(credit.metrics.van))}`, 14, 99);
  }

  // Table
  const tableData = credit.cashFlows.map((cf: any) => [
    cf.numeroMes,
    new Date(cf.fechaPago).toLocaleDateString("es-PE"),
    fmt(Number(cf.saldoInicial)),
    fmt(Number(cf.interes)),
    fmt(Number(cf.amortizacion)),
    fmt(Number(cf.seguroDesgravamen)),
    fmt(Number(cf.seguroVehicular)),
    fmt(Number(cf.cuota)),
    fmt(Number(cf.saldoFinal)),
  ]);

  (doc as any).autoTable({
    startY: 105,
    head: [["Mes", "Fecha", "S. Inicial", "Interés", "Amortización", "Seg.Desg", "Seg.Vehicular", "Cuota", "S. Final"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 63, 93] },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(8);
  doc.text("Documento generado conforme a Res. SBS N.° 3274-2017", 14, finalY + 15);

  doc.save(`Cotizacion_${credit.id}_${credit.client.nombres}.pdf`);
}
