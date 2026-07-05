"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

type VehicleService = {
  tieneMantenimiento: boolean;
  descripcionMantenimiento?: string | null;
  costoMantenimientoAnual?: number | null;
  tieneSOAT: boolean;
  vigenciaSOAT?: string | null;
  tieneSeguroVehicular: boolean;
  coberturaSiniestro?: string | null;
};

type Vehicle = {
  id: number;
  marca: string;
  modelo: string;
  precioVenta: string;
  moneda: "PEN" | "USD";
  tipoMotor?: string | null;
  anio?: number | null;
  vidaUtilAnos?: number | null;
  cilindrada?: string | null;
  transmision?: string | null;
  service?: VehicleService | null;
};

const emptyForm = {
  marca: "", modelo: "", precioVenta: 0, moneda: "PEN" as "PEN" | "USD",
  tipoMotor: "", anio: new Date().getFullYear(), vidaUtilAnos: 10, cilindrada: "", transmision: "",
  tieneMantenimiento: false, descripcionMantenimiento: "", costoMantenimientoAnual: 0,
  tieneSOAT: false, vigenciaSOAT: "",
  tieneSeguroVehicular: false, coberturaSiniestro: "",
};

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";
const inputCls = "w-full rounded border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FAEC7]";

export default function CatalogPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/vehicles");
    if (res.ok) setVehicles(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(v: Vehicle) {
    setEditingId(v.id);
    setForm({
      marca: v.marca, modelo: v.modelo, precioVenta: Number(v.precioVenta), moneda: v.moneda,
      tipoMotor: v.tipoMotor ?? "", anio: v.anio ?? new Date().getFullYear(),
      vidaUtilAnos: v.vidaUtilAnos ?? 10, cilindrada: v.cilindrada ?? "", transmision: v.transmision ?? "",
      tieneMantenimiento: v.service?.tieneMantenimiento ?? false,
      descripcionMantenimiento: v.service?.descripcionMantenimiento ?? "",
      costoMantenimientoAnual: Number(v.service?.costoMantenimientoAnual ?? 0),
      tieneSOAT: v.service?.tieneSOAT ?? false,
      vigenciaSOAT: v.service?.vigenciaSOAT ? new Date(v.service.vigenciaSOAT).toISOString().slice(0, 10) : "",
      tieneSeguroVehicular: v.service?.tieneSeguroVehicular ?? false,
      coberturaSiniestro: v.service?.coberturaSiniestro ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar el vehículo "${name}"?`)) return;
    const r = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? "No se pudo eliminar"); setMsgType("err"); return; }
    setMsg("Vehículo eliminado"); setMsgType("ok");
    await load();
  }

  return (
    <main className="min-h-screen bg-[#F1F2F6] p-8 pl-12 md:pl-16">
      <AppSidebar active="catalog" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0E3F5D]">Catálogo Vehicular</h1>
            <p className="mt-2 text-sm text-slate-500">Registro de la oferta de vehículos para planes de compra inteligente.</p>
          </div>
          <a href="/dashboard" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">Volver a cotizaciones</a>
        </div>

        {/* Form */}
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
            const method = editingId ? "PUT" : "POST";
            const r = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, precioVenta: Number(form.precioVenta), anio: Number(form.anio), vidaUtilAnos: Number(form.vidaUtilAnos), costoMantenimientoAnual: Number(form.costoMantenimientoAnual) }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) { setMsg(d.error ?? "No se pudo guardar"); setMsgType("err"); return; }
            setMsg(editingId ? "Vehículo actualizado" : "Vehículo registrado");
            setMsgType("ok");
            setForm(emptyForm);
            setEditingId(null);
            await load();
          }}
        >
          <h2 className="font-semibold text-slate-700">{editingId ? `Editando vehículo #${editingId}` : "Registrar nuevo vehículo"}</h2>

          {/* Datos básicos */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0E3F5D]">Datos básicos</p>
            <div className="grid gap-3 md:grid-cols-4">
              <div><label className={labelCls}>Marca</label><input className={inputCls} placeholder="Ej: Toyota" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} required /></div>
              <div><label className={labelCls}>Modelo</label><input className={inputCls} placeholder="Ej: Corolla 2024" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} required /></div>
              <div><label className={labelCls}>Precio de venta</label><input className={inputCls} type="number" placeholder="45000" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: Number(e.target.value) })} required /></div>
              <div><label className={labelCls}>Moneda</label>
                <select className={inputCls} value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value as "PEN" | "USD" })}>
                  <option value="PEN">PEN — Soles</option>
                  <option value="USD">USD — Dólares</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ficha técnica */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0E3F5D]">Ficha técnica</p>
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <label className={labelCls}>Tipo de motor</label>
                <select className={inputCls} value={form.tipoMotor} onChange={e => setForm({ ...form, tipoMotor: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  <option>Gasolina</option>
                  <option>Eléctrico</option>
                  <option>Híbrido</option>
                  <option>Diésel</option>
                </select>
              </div>
              <div><label className={labelCls}>Año</label><input className={inputCls} type="number" min={1990} max={new Date().getFullYear() + 1} value={form.anio} onChange={e => setForm({ ...form, anio: Number(e.target.value) })} /></div>
              <div><label className={labelCls}>Vida útil (años)</label><input className={inputCls} type="number" min={1} max={30} value={form.vidaUtilAnos} onChange={e => setForm({ ...form, vidaUtilAnos: Number(e.target.value) })} /></div>
              {form.tipoMotor !== "Eléctrico" && (
                <div><label className={labelCls}>Cilindrada</label><input className={inputCls} placeholder="Ej: 1600cc" value={form.cilindrada} onChange={e => setForm({ ...form, cilindrada: e.target.value })} /></div>
              )}
              <div>
                <label className={labelCls}>Transmisión</label>
                <select className={inputCls} value={form.transmision} onChange={e => setForm({ ...form, transmision: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  <option>Manual</option>
                  <option>Automática</option>
                  <option>CVT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Servicios incluidos */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0E3F5D]">Servicios incluidos</p>
            <div className="space-y-3">
              {/* Mantenimiento */}
              <div className="rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={form.tieneMantenimiento} onChange={e => setForm({ ...form, tieneMantenimiento: e.target.checked })} />
                  <span className="text-sm font-semibold text-slate-700">¿Incluye servicio de mantenimiento?</span>
                </label>
                {form.tieneMantenimiento && (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div><label className={labelCls}>Descripción del mantenimiento</label><textarea className={inputCls} rows={2} value={form.descripcionMantenimiento} onChange={e => setForm({ ...form, descripcionMantenimiento: e.target.value })} /></div>
                    <div><label className={labelCls}>Costo anual (S/)</label><input className={inputCls} type="number" min={0} value={form.costoMantenimientoAnual} onChange={e => setForm({ ...form, costoMantenimientoAnual: Number(e.target.value) })} /></div>
                  </div>
                )}
              </div>
              {/* SOAT */}
              <div className="rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={form.tieneSOAT} onChange={e => setForm({ ...form, tieneSOAT: e.target.checked })} />
                  <span className="text-sm font-semibold text-slate-700">¿Incluye SOAT?</span>
                </label>
                {form.tieneSOAT && (
                  <div className="mt-2">
                    <label className={labelCls}>Vigencia del SOAT</label>
                    <input className={inputCls} type="date" value={form.vigenciaSOAT} onChange={e => setForm({ ...form, vigenciaSOAT: e.target.value })} />
                  </div>
                )}
              </div>
              {/* Seguro vehicular */}
              <div className="rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={form.tieneSeguroVehicular} onChange={e => setForm({ ...form, tieneSeguroVehicular: e.target.checked })} />
                  <span className="text-sm font-semibold text-slate-700">¿Incluye seguro vehicular?</span>
                </label>
                {form.tieneSeguroVehicular && (
                  <div className="mt-2">
                    <label className={labelCls}>Cobertura en caso de siniestro</label>
                    <textarea className={inputCls} rows={2} value={form.coberturaSiniestro} onChange={e => setForm({ ...form, coberturaSiniestro: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 rounded-md bg-[#0E3F5D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b324b]" type="submit">
              {editingId ? "Guardar cambios" : "Registrar vehículo"}
            </button>
            {editingId && <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button>}
          </div>
        </form>

        {msg && <p className={`mt-3 text-sm ${msgType === "ok" ? "text-[#0E3F5D]" : "text-red-600"}`}>{msg}</p>}

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#EEF0F4] text-xs font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Marca / Modelo</th>
                <th className="p-3 text-left">Motor / Año</th>
                <th className="p-3 text-left">Precio</th>
                <th className="p-3 text-center">SOAT</th>
                <th className="p-3 text-center">Seguro</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-3">#{v.id}</td>
                  <td className="p-3 font-medium">{v.marca} {v.modelo}</td>
                  <td className="p-3 text-slate-500">{v.tipoMotor ?? "—"} {v.anio ? `· ${v.anio}` : ""}</td>
                  <td className="p-3">{v.moneda} {Number(v.precioVenta).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">{v.service?.tieneSOAT ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{v.service?.tieneSeguroVehicular ? "✓" : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(v)} className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600">Editar</button>
                      <button onClick={() => handleDelete(v.id, `${v.marca} ${v.modelo}`)} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
