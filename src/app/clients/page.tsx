"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

type Client = {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  consentimientoDatos: boolean;
  _count?: { credits: number };
};

const emptyForm = { dni: "", nombres: "", apellidos: "", correo: "", telefono: "", consentimientoDatos: false };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({ dni: c.dni, nombres: c.nombres, apellidos: c.apellidos, correo: c.correo, telefono: c.telefono, consentimientoDatos: c.consentimientoDatos });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Seguro que deseas eliminar al cliente "${name}"?`)) return;
    const r = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d.error ?? "No se pudo eliminar"); setMsgType("err"); return; }
    setMsg("Cliente eliminado"); setMsgType("ok");
    await load();
  }

  return (
    <main className="min-h-screen bg-[#F1F2F6] p-8 pl-12 md:pl-16">
      <AppSidebar active="clients" />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0E3F5D]">Clientes</h1>
            <p className="mt-2 text-sm text-slate-500">Gestión de solicitantes para cotizaciones de crédito vehicular.</p>
          </div>
          <a href="/dashboard" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">Volver a cotizaciones</a>
        </div>

        {/* Form */}
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
            const method = editingId ? "PUT" : "POST";
            const r = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) { setMsg(d.error ?? "No se pudo guardar"); setMsgType("err"); return; }
            setMsg(editingId ? "Cliente actualizado" : "Cliente registrado");
            setMsgType("ok");
            setForm(emptyForm);
            setEditingId(null);
            await load();
          }}
        >
          <h2 className="mb-3 font-semibold text-slate-700">
            {editingId ? `Editando cliente #${editingId}` : "Registrar nuevo cliente"}
          </h2>
          <div className="grid gap-3 md:grid-cols-5">
            <input className="rounded-md border border-slate-300 p-2 text-sm" placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
            <input className="rounded-md border border-slate-300 p-2 text-sm" placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required />
            <input className="rounded-md border border-slate-300 p-2 text-sm" placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required />
            <input className="rounded-md border border-slate-300 p-2 text-sm" placeholder="Correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
            <input className="rounded-md border border-slate-300 p-2 text-sm" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
          </div>

          {/* Ley 29733 — Consentimiento */}
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <input
              type="checkbox"
              id="consentimiento"
              checked={form.consentimientoDatos}
              onChange={(e) => setForm({ ...form, consentimientoDatos: e.target.checked })}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <label htmlFor="consentimiento" className="text-sm text-gray-700">
              <span className="font-semibold">Consentimiento para tratamiento de datos personales</span><br />
              El titular autoriza el registro y uso de sus datos personales para fines de evaluación
              crediticia, conforme a la <span className="font-semibold">Ley N.° 29733</span> —
              Ley de Protección de Datos Personales del Perú.
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-md bg-[#0E3F5D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b324b] disabled:opacity-50"
              type="submit"
              disabled={!form.consentimientoDatos}
            >
              {editingId ? "Guardar cambios" : "Registrar cliente"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {msg && (
          <p className={`mt-3 text-sm ${msgType === "ok" ? "text-[#0E3F5D]" : "text-red-600"}`}>{msg}</p>
        )}

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#EEF0F4] text-xs font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">DNI</th>
                <th className="p-3 text-left">Nombres</th>
                <th className="p-3 text-left">Correo</th>
                <th className="p-3 text-left">Teléfono</th>
                <th className="p-3 text-center">Simul.</th>
                <th className="p-3 text-center">Datos</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-3">#{c.id}</td>
                  <td className="p-3">{c.dni}</td>
                  <td className="p-3">{c.nombres} {c.apellidos}</td>
                  <td className="p-3">{c.correo}</td>
                  <td className="p-3">{c.telefono}</td>
                  <td className="p-3 text-center">
                    <a href={`/dashboard?clientId=${c.id}`} className="font-bold text-[#0E3F5D] hover:underline">
                      {c._count?.credits ?? 0}
                    </a>
                  </td>
                  <td className="p-3 text-center">
                    {c.consentimientoDatos
                      ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">✓ Sí</span>
                      : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">✗ No</span>
                    }
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600">Editar</button>
                      <button onClick={() => handleDelete(c.id, `${c.nombres} ${c.apellidos}`)} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500">Eliminar</button>
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
