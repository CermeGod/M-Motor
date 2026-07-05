"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; nombres: string; apellidos: string };
type Vehicle = { id: number; marca: string; modelo: string; precioVenta: number; moneda: "PEN" | "USD" };

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1 flex items-center";
const inputCls = "w-full rounded border border-slate-300 p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4FAEC7]";

const Tooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-block ml-1">
    <span className="cursor-help text-[#4FAEC7] text-[10px] font-bold border border-[#4FAEC7] rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-normal normal-case font-normal leading-relaxed">
      {text}
    </div>
  </div>
);

export default function NewCreditPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState("");
  const [clientForm, setClientForm] = useState({ dni: "", nombres: "", apellidos: "", correo: "", telefono: "" });
  const [vehicleForm, setVehicleForm] = useState({ marca: "", modelo: "", precioVenta: 0, moneda: "PEN" as "PEN" | "USD" });
  const [f, setF] = useState({
    clientId: 0, vehicleId: 0, moneda: "PEN" as "PEN" | "USD", precioVehiculo: 0,
    cuotaInicialPorcentaje: 20, cuotaBalonPorcentaje: 20, tipoTasa: "EFECTIVA" as "EFECTIVA" | "NOMINAL", tasaInteres: 12,
    capitalizacionDias: 30, plazoMeses: 36, fechaDesembolso: new Date().toISOString().slice(0, 10),
    periodoGraciaTipo: "NONE" as "NONE" | "PARTIAL" | "TOTAL", periodosGracia: 0,
    seguroDesgravamenPorcentaje: 0.05, seguroVehicularPorcentaje: 0.08, portesMontoFijo: 15, baseAnual: 360 as 360 | 365, tasaDescuentoAnual: 12,
  });

  useEffect(() => {
    Promise.all([fetch("/api/clients"), fetch("/api/vehicles"), fetch("/api/config")]).then(async ([c, v, cfg]) => {
      if (c.ok) setClients(await c.json());
      if (v.ok) setVehicles(await v.json());
      if (cfg.ok) {
        const d = await cfg.json();
        if (d) {
          setF((prev) => ({
            ...prev,
            moneda: d.defaultMoneda,
            tipoTasa: d.defaultTipoTasa,
            capitalizacionDias: d.defaultCapitalizacion,
            baseAnual: d.defaultBaseAnual,
          }));
        }
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0E3F5D]">Nueva Cotización</h1>
          <a href="/dashboard" className="text-sm underline text-slate-500 hover:text-[#0E3F5D]">Volver</a>
        </div>

        {/* Registrar Cliente y Vehículo */}
        <div className="grid gap-4 md:grid-cols-2">
          <form className="space-y-2 rounded-xl border border-slate-200 p-4 bg-slate-50" onSubmit={async (e) => { e.preventDefault(); const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clientForm) }); if (r.ok) { setMsg("Cliente guardado"); const x = await fetch("/api/clients"); setClients(await x.json()); } }}>
            <h2 className="font-semibold text-slate-700">Registrar Cliente</h2>
            <input className={inputCls} placeholder="DNI" value={clientForm.dni} onChange={(e) => setClientForm({ ...clientForm, dni: e.target.value })} />
            <input className={inputCls} placeholder="Nombres" value={clientForm.nombres} onChange={(e) => setClientForm({ ...clientForm, nombres: e.target.value })} />
            <input className={inputCls} placeholder="Apellidos" value={clientForm.apellidos} onChange={(e) => setClientForm({ ...clientForm, apellidos: e.target.value })} />
            <input className={inputCls} placeholder="Correo electrónico" value={clientForm.correo} onChange={(e) => setClientForm({ ...clientForm, correo: e.target.value })} />
            <input className={inputCls} placeholder="Teléfono" value={clientForm.telefono} onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })} />
            <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">Guardar cliente</button>
          </form>

          <form className="space-y-2 rounded-xl border border-slate-200 p-4 bg-slate-50" onSubmit={async (e) => { e.preventDefault(); const r = await fetch("/api/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vehicleForm) }); if (r.ok) { setMsg("Vehículo guardado"); const x = await fetch("/api/vehicles"); setVehicles(await x.json()); } }}>
            <h2 className="font-semibold text-slate-700">Registrar Vehículo</h2>
            <input className={inputCls} placeholder="Marca (ej: Toyota)" value={vehicleForm.marca} onChange={(e) => setVehicleForm({ ...vehicleForm, marca: e.target.value })} />
            <input className={inputCls} placeholder="Modelo (ej: Corolla 2024)" value={vehicleForm.modelo} onChange={(e) => setVehicleForm({ ...vehicleForm, modelo: e.target.value })} />
            <input className={inputCls} type="number" placeholder="Precio de venta" value={vehicleForm.precioVenta} onChange={(e) => setVehicleForm({ ...vehicleForm, precioVenta: Number(e.target.value) })} />
            <select className={inputCls} value={vehicleForm.moneda} onChange={(e) => setVehicleForm({ ...vehicleForm, moneda: e.target.value as "PEN" | "USD" })}>
              <option value="PEN">PEN — Soles</option>
              <option value="USD">USD — Dólares</option>
            </select>
            <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">Guardar vehículo</button>
          </form>
        </div>

        {/* Formulario de Cotización */}
        <form
          className="mt-6 rounded-xl border border-slate-200 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
            if (!r.ok) {
              const d = await r.json().catch(() => ({ error: "No se pudo guardar cotización" }));
              return setMsg(d.error ?? "No se pudo guardar cotización");
            }
            const d = await r.json();
            router.push(`/credits/${d.id}`);
          }}
        >
          <h2 className="mb-4 font-semibold text-slate-700">Datos de Cotización</h2>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Fila 1: Cliente, Vehículo, Precio, Moneda */}
            <div>
              <label className={labelCls}>Cliente</label>
              <select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: Number(e.target.value) })}>
                <option value={0}>— Seleccionar —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vehículo</label>
              <select className={inputCls} value={f.vehicleId} onChange={(e) => { const id = Number(e.target.value); const v = vehicles.find((x) => x.id === id); setF({ ...f, vehicleId: id, precioVehiculo: v ? Number(v.precioVenta) : 0, moneda: v?.moneda ?? "PEN" }); }}>
                <option value={0}>— Seleccionar —</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Precio del vehículo</label>
              <input className={inputCls} type="number" value={f.precioVehiculo} onChange={(e) => setF({ ...f, precioVehiculo: Number(e.target.value) })} placeholder="Ej: 45000" />
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <select className={inputCls} value={f.moneda} onChange={(e) => setF({ ...f, moneda: e.target.value as "PEN" | "USD" })}>
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>

            {/* Fila 2: Cuota inicial, Cuota balón, Tipo de tasa, Tasa de interés */}
            <div>
              <label className={labelCls}>% Cuota inicial</label>
              <input className={inputCls} type="number" value={f.cuotaInicialPorcentaje} onChange={(e) => setF({ ...f, cuotaInicialPorcentaje: Number(e.target.value) })} placeholder="Ej: 20" />
            </div>
            <div>
              <label className={labelCls}>% Cuota balón <Tooltip text="En Compra Inteligente, es el porcentaje del monto financiado que se difiere al último mes. Reduce las cuotas mensuales pero genera un pago final mayor." /></label>
              <input className={inputCls} type="number" value={f.cuotaBalonPorcentaje} onChange={(e) => setF({ ...f, cuotaBalonPorcentaje: Number(e.target.value) })} placeholder="Ej: 20" />
            </div>
            <div>
              <label className={labelCls}>Tipo de tasa</label>
              <select className={inputCls} value={f.tipoTasa} onChange={(e) => setF({ ...f, tipoTasa: e.target.value as "EFECTIVA" | "NOMINAL" })}>
                <option value="EFECTIVA">Efectiva (TEA)</option>
                <option value="NOMINAL">Nominal (TNA)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tasa de interés (%)</label>
              <input className={inputCls} type="number" value={f.tasaInteres} onChange={(e) => setF({ ...f, tasaInteres: Number(e.target.value) })} placeholder="Ej: 12" />
            </div>

            {/* Fila 3: Capitalización, Base anual, Plazo, Fecha desembolso */}
            <div>
              <label className={labelCls}>Capitalización (días) <Tooltip text="Solo aplica si la tasa es Nominal. Indica cada cuántos días se capitaliza el interés. Ejemplo: 30 = capitalización mensual." /></label>
              <input className={inputCls} type="number" value={f.capitalizacionDias} onChange={(e) => setF({ ...f, capitalizacionDias: Number(e.target.value) })} placeholder="Ej: 30" />
            </div>
            <div>
              <label className={labelCls}>Base anual <Tooltip text="Número de días que se consideran en un año para el cálculo de tasas. Usa 360 para el estándar financiero peruano (SBS) o 365 para días calendario exactos." /></label>
              <select className={inputCls} value={f.baseAnual} onChange={(e) => setF({ ...f, baseAnual: Number(e.target.value) as 360 | 365 })}>
                <option value={360}>360 días</option>
                <option value={365}>365 días</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Plazo (meses)</label>
              <input className={inputCls} type="number" value={f.plazoMeses} onChange={(e) => setF({ ...f, plazoMeses: Number(e.target.value) })} placeholder="Ej: 36" />
            </div>
            <div>
              <label className={labelCls}>Fecha de desembolso</label>
              <input className={inputCls} type="date" value={f.fechaDesembolso} onChange={(e) => setF({ ...f, fechaDesembolso: e.target.value })} />
            </div>

            {/* Fila 4: Período de gracia, Períodos, Desgravamen, Seg. vehicular */}
            <div>
              <label className={labelCls}>Período de gracia <Tooltip text="Meses iniciales donde no se amortiza capital. Parcial: pagas solo intereses. Total: no pagas nada y el interés se suma al capital (más costoso)." /></label>
              <select className={inputCls} value={f.periodoGraciaTipo} onChange={(e) => setF({ ...f, periodoGraciaTipo: e.target.value as "NONE" | "PARTIAL" | "TOTAL" })}>
                <option value="NONE">Sin período de gracia</option>
                <option value="PARTIAL">Gracia parcial (paga intereses)</option>
                <option value="TOTAL">Gracia total (capitaliza)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nº de períodos de gracia</label>
              <input className={inputCls} type="number" value={f.periodosGracia} onChange={(e) => setF({ ...f, periodosGracia: Number(e.target.value) })} placeholder="Ej: 0" />
            </div>
            <div>
              <label className={labelCls}>% Seg. desgravamen</label>
              <input className={inputCls} type="number" step="0.001" value={f.seguroDesgravamenPorcentaje} onChange={(e) => setF({ ...f, seguroDesgravamenPorcentaje: Number(e.target.value) })} placeholder="Ej: 0.05" />
            </div>
            <div>
              <label className={labelCls}>% Seg. vehicular</label>
              <input className={inputCls} type="number" step="0.001" value={f.seguroVehicularPorcentaje} onChange={(e) => setF({ ...f, seguroVehicularPorcentaje: Number(e.target.value) })} placeholder="Ej: 0.08" />
            </div>

            {/* Fila 5: Portes, COK */}
            <div>
              <label className={labelCls}>Portes (monto fijo)</label>
              <input className={inputCls} type="number" step="0.01" value={f.portesMontoFijo} onChange={(e) => setF({ ...f, portesMontoFijo: Number(e.target.value) })} placeholder="Ej: 15" />
            </div>
            <div>
              <label className={labelCls}>COK anual para VAN (%) <Tooltip text="Costo de Oportunidad del Capital. Es tu tasa de referencia para calcular el VAN. Representa el rendimiento mínimo que esperarías de una inversión alternativa." /></label>
              <input className={inputCls} type="number" step="0.01" value={f.tasaDescuentoAnual} onChange={(e) => setF({ ...f, tasaDescuentoAnual: Number(e.target.value) })} placeholder="Ej: 12" />
            </div>
          </div>

          <button className="mt-5 w-full rounded-md bg-[#0E3F5D] px-4 py-3 text-sm font-bold text-white hover:bg-[#0b324b]">
            Guardar cotización
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-amber-700">{msg}</p>}
      </div>
    </main>
  );
}
