export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Marco legal, fórmulas y supuestos</h1>
          <a className="text-sm underline" href="/dashboard">Volver</a>
        </div>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Base legal usada</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Ley N° 28587 (transparencia en servicios financieros).</li>
            <li>Resolución SBS N° 3274-2017 (conducta de mercado, TCEA y cronograma).</li>
            <li>Ley N° 26702 (marco general del sistema financiero peruano).</li>
          </ul>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Fórmulas implementadas</h2>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p><strong>Conversión TEA a TEM:</strong> TEM = (1 + TEA)^(30/baseAnual) - 1</p>
            <p><strong>Conversión TN a TEA:</strong> TEA = (1 + TN/m)^m - 1, luego a TEM.</p>
            <p><strong>Método francés:</strong> Cuota constante para periodos sin gracia.</p>
            <p><strong>Interés del periodo:</strong> Interés = SaldoInicial × TEM.</p>
            <p><strong>Amortización:</strong> Amortización = Cuota - Interés - Seguros - Portes.</p>
            <p><strong>TIR:</strong> sobre flujo del deudor.</p>
            <p><strong>TCEA:</strong> TCEA = (1 + TIR_periodo)^(baseAnual/30) - 1.</p>
            <p><strong>VAN:</strong> descuento mensual usando COK anual configurable.</p>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Supuestos del sistema</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Frecuencia de pago mensual (30 días por periodo).</li>
            <li>Base anual configurable: 360 o 365.</li>
            <li>Monedas operativas: PEN y USD.</li>
            <li>Periodo de gracia: NONE, PARTIAL o TOTAL.</li>
            <li>Redondeo monetario: 2 decimales (half-up).</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
