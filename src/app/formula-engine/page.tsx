export default function FormulaEnginePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Motor de Fórmulas para Cotización</h1>
          <a className="text-sm underline" href="/dashboard">Volver</a>
        </div>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Fórmulas financieras implementadas</h2>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p><strong>TEA a TEM:</strong> TEM = (1 + TEA)^(30/baseAnual) - 1</p>
            <p><strong>TN a TEA:</strong> TEA = (1 + TN/m)^m - 1</p>
            <p><strong>Método francés:</strong> cuota constante en periodos sin gracia.</p>
            <p><strong>Interés:</strong> Interés_k = Saldo_(k-1) × TEM</p>
            <p><strong>Amortización:</strong> Amort_k = Cuota - Interés - Seguros - Portes</p>
            <p><strong>TIR:</strong> sobre el flujo del deudor.</p>
            <p><strong>TCEA:</strong> (1 + TIR_periodo)^(baseAnual/30) - 1</p>
            <p><strong>VAN:</strong> descuento de flujos con COK anual configurable.</p>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Supuestos de cotización</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Frecuencia mensual (30 días).</li>
            <li>Base anual 360 o 365.</li>
            <li>Gracia: none, partial o total.</li>
            <li>Redondeo monetario a 2 decimales.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
