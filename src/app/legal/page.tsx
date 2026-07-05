export default function LegalPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Marco Legal del Proyecto</h1>
          <a className="text-sm underline" href="/dashboard">Volver</a>
        </div>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Normativa considerada</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Ley N° 28587: transparencia e información al usuario financiero.</li>
            <li>Resolución SBS N° 3274-2017: conducta de mercado, cronogramas y TCEA.</li>
            <li>Ley N° 26702: marco del sistema financiero y supervisión SBS.</li>
          </ul>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Aplicación práctica en el sistema</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Se presenta cronograma detallado por cuota.</li>
            <li>Se incluye TCEA como indicador del costo real del crédito.</li>
            <li>Se desglosan intereses, amortización, seguros y gastos para transparencia.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
