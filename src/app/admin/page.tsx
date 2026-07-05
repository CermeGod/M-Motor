"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";

type Stats = { totalUsers: number; totalClients: number; totalCredits: number; totalFinanciado: Record<string, number> };
type AdminUser = { id: number; username: string; role: string; email?: string | null; createdAt: string; ultimoAcceso?: string | null };
type AdminCredit = { id: number; moneda: string; precioVehiculo: string; createdAt: string; user: { username: string }; client: { nombres: string; apellidos: string }; vehicle: { marca: string; modelo: string }; metrics?: { tcea: string } | null };

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [credits, setCredits] = useState<AdminCredit[]>([]);
  const [msg, setMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      // Verify admin access
      const me = await fetch("/api/auth/me");
      if (!me.ok) { router.push("/login"); return; }
      const meData = await me.json();
      if (meData.role !== "ADMIN") { router.push("/dashboard"); return; }
      setCurrentUserId(meData.userId);

      // Load all data in parallel
      const [sRes, uRes, cRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/credits"),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (cRes.ok) setCredits(await cRes.json());
      setLoading(false);
    }
    init();
  }, [router]);

  async function changeRole(userId: number, newRole: "ADMIN" | "VENDEDOR") {
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? "Error al cambiar rol"); return; }
    setMsg(`Rol actualizado correctamente`);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#F1F2F6] text-slate-500">Verificando permisos...</main>;

  const fmt = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 2 });

  return (
    <main className="min-h-screen bg-[#F1F2F6] p-8 pl-12 md:pl-16">
      <AppSidebar active="admin" />
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0E3F5D]">Panel de Administrador</h1>
            <p className="mt-1 text-sm text-slate-500">Gestión del sistema M-Motors Finance</p>
          </div>
          <a href="/dashboard" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">← Dashboard</a>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Usuarios registrados", value: stats.totalUsers, icon: "👤", color: "bg-blue-50 border-blue-200" },
              { label: "Clientes registrados", value: stats.totalClients, icon: "🧑‍💼", color: "bg-green-50 border-green-200" },
              { label: "Cotizaciones generadas", value: stats.totalCredits, icon: "📊", color: "bg-purple-50 border-purple-200" },
              { label: "Total financiado PEN", value: `S/ ${fmt(stats.totalFinanciado["PEN"] ?? 0)}`, icon: "💰", color: "bg-amber-50 border-amber-200" },
            ].map((card) => (
              <div key={card.label} className={`rounded-2xl border ${card.color} p-5`}>
                <div className="text-2xl">{card.icon}</div>
                <div className="mt-2 text-2xl font-bold text-slate-800">{card.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {msg && <p className="text-sm text-[#0E3F5D] font-medium">{msg}</p>}

        {/* Users table */}
        <section>
          <h2 className="mb-3 text-xl font-bold text-[#0E3F5D]">Usuarios del sistema</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#EEF0F4] text-xs font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Username</th>
                  <th className="p-3 text-left">Rol</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Registro</th>
                  <th className="p-3 text-left">Último acceso</th>
                  <th className="p-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3">#{u.id}</td>
                    <td className="p-3 font-medium">{u.username}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{u.email ?? "—"}</td>
                    <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("es-PE")}</td>
                    <td className="p-3 text-slate-500">{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString("es-PE") : "—"}</td>
                    <td className="p-3">
                      {u.id !== currentUserId ? (
                        <button
                          onClick={() => changeRole(u.id, u.role === "ADMIN" ? "VENDEDOR" : "ADMIN")}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                        >
                          → {u.role === "ADMIN" ? "Hacer Vendedor" : "Hacer Admin"}
                        </button>
                      ) : <span className="text-xs text-slate-400">Tú</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Last 20 credits */}
        <section>
          <h2 className="mb-3 text-xl font-bold text-[#0E3F5D]">Últimas 20 cotizaciones del sistema</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#EEF0F4] text-xs font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Ejecutivo</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Vehículo</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-right">TCEA</th>
                  <th className="p-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3"><a href={`/credits/${c.id}`} className="text-[#0E3F5D] hover:underline font-medium">#{c.id}</a></td>
                    <td className="p-3">{c.user.username}</td>
                    <td className="p-3">{c.client.nombres} {c.client.apellidos}</td>
                    <td className="p-3">{c.vehicle.marca} {c.vehicle.modelo}</td>
                    <td className="p-3 text-right">{c.moneda} {fmt(Number(c.precioVehiculo))}</td>
                    <td className="p-3 text-right">{c.metrics ? `${Number(c.metrics.tcea).toFixed(2)}%` : "—"}</td>
                    <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
