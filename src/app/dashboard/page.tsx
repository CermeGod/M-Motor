"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";

type Credit = {
  id: number;
  moneda: "PEN" | "USD";
  tipoTasa: "EFECTIVA" | "NOMINAL";
  precioVehiculo: string;
  cuotaInicialPorcentaje: string;
  client: { nombres: string; apellidos: string };
  vehicle: { marca: string; modelo: string };
  metrics?: { tcea: string };
  createdAt?: string;
};

export default function DashboardPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [moneda, setMoneda] = useState<"ALL" | "PEN" | "USD">("ALL");
  const [tipoTasa, setTipoTasa] = useState<"ALL" | "EFECTIVA" | "NOMINAL">("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const clientIdFilter = searchParams.get("clientId");
    const url = clientIdFilter ? `/api/credits?clientId=${clientIdFilter}` : "/api/credits";
    fetch(url).then((r) => r.json()).then((d: Credit[]) => setCredits(d));
  }, []);

  const filtered = useMemo(
    () =>
      credits.filter((c) => {
        const text = `${c.client.nombres} ${c.client.apellidos} ${c.vehicle.marca} ${c.vehicle.modelo}`.toLowerCase();
        const matchesText = q.trim() === "" || text.includes(q.toLowerCase());
        return (moneda === "ALL" || c.moneda === moneda) && (tipoTasa === "ALL" || c.tipoTasa === tipoTasa) && matchesText;
      }),
    [credits, moneda, tipoTasa, q],
  );

  return (
    <main className="min-h-screen bg-[#F1F2F6]">
      <AppSidebar active="dashboard" />
      <section className="p-8 pl-12 md:pl-16">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-[#0E3F5D]">Historial de cotizaciones</h1>
                <p className="mt-2 text-sm text-slate-500">Gestiona planes de compra inteligente</p>
              </div>
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-xs"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  location.href = "/login";
                }}
              >
                Salir
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_180px_220px]">
              <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={moneda} onChange={(e) => setMoneda(e.target.value as "ALL" | "PEN" | "USD")}> 
                <option value="ALL">$ Moneda</option>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
              <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={tipoTasa} onChange={(e) => setTipoTasa(e.target.value as "ALL" | "EFECTIVA" | "NOMINAL")}> 
                <option value="ALL">Tipo de tasa</option>
                <option value="EFECTIVA">Efectiva</option>
                <option value="NOMINAL">Nominal</option>
              </select>
              <Link className="rounded-md bg-[#4FAEC7] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#4298AF]" href="/credits/new">
                NUEVA COTIZACION +
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[#EEF0F4] text-xs font-bold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="p-3 text-left">ID/FECHA</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Vehículo</th>
                    <th className="p-3 text-left">Plan de pago</th>
                    <th className="p-3 text-left">Monto Financiado</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-slate-200">
                      <td className="p-3 text-xs text-slate-500">#{c.id}</td>
                      <td className="p-3">{c.client.nombres} {c.client.apellidos}</td>
                      <td className="p-3">{c.vehicle.marca} {c.vehicle.modelo}</td>
                      <td className="p-3">{c.tipoTasa}</td>
                      <td className="p-3">
                        {(Number(c.precioVehiculo) * (1 - Number(c.cuotaInicialPorcentaje) / 100)).toFixed(2)} {c.moneda}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-3">
                          <a href={`/credits/${c.id}`} className="text-slate-600 hover:text-[#0E3F5D]">👁</a>
                          <a href={`/credits/${c.id}/edit`} className="text-slate-600 hover:text-[#0E3F5D]">✎</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-slate-500" colSpan={6}>No hay cotizaciones para los filtros aplicados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex gap-4">
                <a href="/legal">Ver marco legal</a>
                <a href="/formula-engine">Ver motor de fórmulas</a>
              </div>
              <span>Total registros: {filtered.length}</span>
            </div>
          </div>
      </section>
    </main>
  );
}
