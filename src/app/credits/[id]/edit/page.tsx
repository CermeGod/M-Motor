"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CreditEdit = {
  clientId: number;
  vehicleId: number;
  moneda: "PEN" | "USD";
  precioVehiculo: number;
  cuotaInicialPorcentaje: number;
  cuotaBalonPorcentaje: number;
  tipoTasa: "EFECTIVA" | "NOMINAL";
  tasaInteres: number;
  capitalizacionDias: number;
  plazoMeses: number;
  fechaDesembolso: string;
  periodoGraciaTipo: "NONE" | "PARTIAL" | "TOTAL";
  periodosGracia: number;
  seguroDesgravamenPorcentaje: number;
  seguroVehicularPorcentaje: number;
  portesMontoFijo: number;
  baseAnual: number;
  tasaDescuentoAnual: number;
};

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

export default function EditCreditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [f, setF] = useState<CreditEdit | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/credits/${id}`)
      .then((r) => r.json())
      .then((d: CreditEdit & { fechaDesembolso: string }) => {
        setF({ ...d, fechaDesembolso: new Date(d.fechaDesembolso).toISOString().slice(0, 10) });
      });
  }, [id]);

  if (!f) return <main className="p-6 text-slate-500">Cargando...</main>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      clientId: f.clientId,
      vehicleId: f.vehicleId,
      moneda: f.moneda,
      precioVehiculo: Number(f.precioVehiculo),
      cuotaInicialPorcentaje: Number(f.cuotaInicialPorcentaje),
      cuotaBalonPorcentaje: Number(f.cuotaBalonPorcentaje),
      tipoTasa: f.tipoTasa,
      tasaInteres: Number(f.tasaInteres),
      capitalizacionDias: Number(f.capitalizacionDias),
      plazoMeses: Number(f.plazoMeses),
      fechaDesembolso: f.fechaDesembolso,
      periodoGraciaTipo: f.periodoGraciaTipo,
      periodosGracia: Number(f.periodosGracia),
      seguroDesgravamenPorcentaje: Number(f.seguroDesgravamenPorcentaje),
      seguroVehicularPorcentaje: Number(f.seguroVehicularPorcentaje),
      portesMontoFijo: Number(f.portesMontoFijo),
      baseAnual: Number(f.baseAnual),
      tasaDescuentoAnual: Number(f.tasaDescuentoAnual),
    };
    const r = await fetch(`/api/credits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return setMsg("No se pudo actualizar la cotización");
    router.push(`/credits/${id}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0E3F5D]">Editar Cotización #{id}</h1>
          <a href="/dashboard" className="text-sm underline text-slate-500 hover:text-[#0E3F5D]">Volver</a>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>

          {/* Fila 1: Tasa de interés, Plazo, Fecha de desembolso */}
          <div>
            <label className={labelCls}>Tasa de interés (%)</label>
            <input className={inputCls} type="number" step="0.01" value={f.tasaInteres} onChange={(e) => setF({ ...f, tasaInteres: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Plazo (meses)</label>
            <input className={inputCls} type="number" value={f.plazoMeses} onChange={(e) => setF({ ...f, plazoMeses: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Fecha de desembolso</label>
            <input className={inputCls} type="date" value={f.fechaDesembolso} onChange={(e) => setF({ ...f, fechaDesembolso: e.target.value })} />
          </div>

          {/* Fila 2: % Cuota inicial, % Cuota balón, Tipo de tasa */}
          <div>
            <label className={labelCls}>% Cuota inicial</label>
            <input className={inputCls} type="number" step="0.01" value={f.cuotaInicialPorcentaje} onChange={(e) => setF({ ...f, cuotaInicialPorcentaje: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>% Cuota balón <Tooltip text="En Compra Inteligente, es el porcentaje del monto financiado que se difiere al último mes. Reduce las cuotas mensuales pero genera un pago final mayor." /></label>
            <input className={inputCls} type="number" step="0.01" value={f.cuotaBalonPorcentaje} onChange={(e) => setF({ ...f, cuotaBalonPorcentaje: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Tipo de tasa</label>
            <select className={inputCls} value={f.tipoTasa} onChange={(e) => setF({ ...f, tipoTasa: e.target.value as "EFECTIVA" | "NOMINAL" })}>
              <option value="EFECTIVA">Efectiva (TEA)</option>
              <option value="NOMINAL">Nominal (TNA)</option>
            </select>
          </div>

          {/* Fila 3: Capitalización, Base anual, Período de gracia */}
          <div>
            <label className={labelCls}>Capitalización (días) <Tooltip text="Solo aplica si la tasa es Nominal. Indica cada cuántos días se capitaliza el interés. Ejemplo: 30 = capitalización mensual." /></label>
            <input className={inputCls} type="number" value={f.capitalizacionDias} onChange={(e) => setF({ ...f, capitalizacionDias: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>Base anual <Tooltip text="Número de días que se consideran en un año para el cálculo de tasas. Usa 360 para el estándar financiero peruano (SBS) o 365 para días calendario exactos." /></label>
            <select className={inputCls} value={f.baseAnual} onChange={(e) => setF({ ...f, baseAnual: Number(e.target.value) })}>
              <option value={360}>360 días</option>
              <option value={365}>365 días</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Período de gracia <Tooltip text="Meses iniciales donde no se amortiza capital. Parcial: pagas solo intereses. Total: no pagas nada y el interés se suma al capital (más costoso)." /></label>
            <select className={inputCls} value={f.periodoGraciaTipo} onChange={(e) => setF({ ...f, periodoGraciaTipo: e.target.value as "NONE" | "PARTIAL" | "TOTAL" })}>
              <option value="NONE">Sin período de gracia</option>
              <option value="PARTIAL">Gracia parcial (paga intereses)</option>
              <option value="TOTAL">Gracia total (capitaliza)</option>
            </select>
          </div>

          {/* Fila 4: Nº períodos gracia, % Desgravamen, % Seg. vehicular */}
          <div>
            <label className={labelCls}>Nº de períodos de gracia</label>
            <input className={inputCls} type="number" value={f.periodosGracia} onChange={(e) => setF({ ...f, periodosGracia: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>% Seg. desgravamen</label>
            <input className={inputCls} type="number" step="0.001" value={f.seguroDesgravamenPorcentaje} onChange={(e) => setF({ ...f, seguroDesgravamenPorcentaje: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>% Seg. vehicular</label>
            <input className={inputCls} type="number" step="0.001" value={f.seguroVehicularPorcentaje} onChange={(e) => setF({ ...f, seguroVehicularPorcentaje: Number(e.target.value) })} />
          </div>

          {/* Fila 5: Portes, COK para VAN */}
          <div>
            <label className={labelCls}>Portes (monto fijo)</label>
            <input className={inputCls} type="number" step="0.01" value={f.portesMontoFijo} onChange={(e) => setF({ ...f, portesMontoFijo: Number(e.target.value) })} />
          </div>
          <div>
            <label className={labelCls}>COK anual para VAN (%) <Tooltip text="Costo de Oportunidad del Capital. Es tu tasa de referencia para calcular el VAN. Representa el rendimiento mínimo que esperarías de una inversión alternativa." /></label>
            <input className={inputCls} type="number" step="0.01" value={f.tasaDescuentoAnual} onChange={(e) => setF({ ...f, tasaDescuentoAnual: Number(e.target.value) })} />
          </div>

          <button className="md:col-span-3 mt-2 rounded-md bg-[#0E3F5D] px-4 py-3 text-sm font-bold text-white hover:bg-[#0b324b]">
            Guardar cambios
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </div>
    </main>
  );
}
