"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { exportPdf } from "@/lib/exportPdf";

type Row = {
  id: number;
  numeroMes: number;
  fechaPago: string;
  saldoInicial: string;
  interes: string;
  amortizacion: string;
  seguroDesgravamen: string;
  seguroVehicular: string;
  cuota: string;
  saldoFinal: string;
};
type Detail = {
  id: number;
  client: { nombres: string; apellidos: string };
  metrics?: { van: string; tir: string; tcea: string };
  tasaDescuentoAnual: string;
  baseAnual: number;
  cashFlows: Row[];
};

export default function CreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/credits/${id}`).then((r) => r.json()).then((d: Detail) => setData(d));
  }, [id]);

  if (!data) return <main className="p-6">Cargando...</main>;
  return (
    <main className="mx-auto max-w-6xl p-6">
      <a className="text-sm underline" href="/dashboard">Volver</a>
      <a className="ml-4 text-sm underline" href={`/credits/${id}/edit`}>Editar</a>
      <button className="ml-4 text-sm underline text-blue-600" onClick={() => exportPdf(data)}>Exportar PDF</button>
      <h1 className="mt-2 text-2xl font-semibold">Cotización #{data.id}</h1>
      <p className="text-gray-600">Cliente: {data.client.nombres} {data.client.apellidos}</p>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded border p-3">VAN: {data.metrics?.van}</div>
        <div className="rounded border p-3">TIR (%): {data.metrics?.tir}</div>
        <div className="rounded border p-3">TCEA (%): {data.metrics?.tcea}</div>
      </div>
      <p className="mt-3 text-sm text-slate-600">Supuestos: base anual {data.baseAnual}, COK anual para VAN {data.tasaDescuentoAnual}%.</p>
      <div className="mt-6 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th>Mes</th>
              <th>Fecha pago</th>
              <th>Saldo Inicial</th>
              <th>Interés</th>
              <th>Amortización</th>
              <th>Seg. Desgrav.</th>
              <th>Seg. Vehicular</th>
              <th>Cuota</th>
              <th>Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            {data.cashFlows.map((r) => (
              <tr key={r.id} className="border-b">
                <td>{r.numeroMes}</td>
                <td>{new Date(r.fechaPago).toISOString().slice(0, 10)}</td>
                <td>{r.saldoInicial}</td>
                <td>{r.interes}</td>
                <td>{r.amortizacion}</td>
                <td>{r.seguroDesgravamen}</td>
                <td>{r.seguroVehicular}</td>
                <td>{r.cuota}</td>
                <td>{r.saldoFinal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
