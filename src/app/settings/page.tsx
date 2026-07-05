"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

export default function SettingsPage() {
  const [f, setF] = useState({ defaultMoneda: "PEN", defaultTipoTasa: "EFECTIVA", defaultCapitalizacion: 30, defaultBaseAnual: 360 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((d) => d && setF(d));
  }, []);

  return (
    <main className="min-h-screen bg-[#F1F2F6] p-8 pl-12 md:pl-16">
      <AppSidebar active="settings" />
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0E3F5D]">Configuraciones</h1>
            <p className="mt-2 text-sm text-slate-500">Preferencias por defecto para nuevas cotizaciones de crédito vehicular.</p>
          </div>
          <a href="/dashboard" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">Volver al historial</a>
        </div>

        <form
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
            setMsg(r.ok ? "Configuración guardada" : "No se pudo guardar");
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Moneda por defecto</label>
              <select className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" value={f.defaultMoneda} onChange={(e) => setF({ ...f, defaultMoneda: e.target.value })}>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo de tasa por defecto</label>
              <select className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" value={f.defaultTipoTasa} onChange={(e) => setF({ ...f, defaultTipoTasa: e.target.value })}>
                <option value="EFECTIVA">Efectiva (TEA)</option>
                <option value="NOMINAL">Nominal (TN)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Capitalización (días)</label>
              <input className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" type="number" value={f.defaultCapitalizacion} onChange={(e) => setF({ ...f, defaultCapitalizacion: Number(e.target.value) })} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Base anual</label>
              <select className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm" value={f.defaultBaseAnual} onChange={(e) => setF({ ...f, defaultBaseAnual: Number(e.target.value) })}>
                <option value={360}>360</option>
                <option value={365}>365</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">Estas opciones se aplican al crear una nueva cotización, según el marco del informe financiero.</p>
            <button className="rounded-md bg-[#0E3F5D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b324b]">Guardar cambios</button>
          </div>
        </form>

        {msg && <p className="mt-3 text-sm text-[#0E3F5D]">{msg}</p>}
      </div>
    </main>
  );
}
