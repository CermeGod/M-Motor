"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="grid min-h-screen md:grid-cols-[1fr_1fr]">
      <section className="hidden bg-[#0E3F5D] text-white md:flex md:flex-col md:items-center md:justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4FAEC7] text-5xl font-bold text-[#0E3F5D]">M</div>
        <h1 className="mt-10 text-4xl font-extrabold tracking-wide">M-MOTORS FINANCE</h1>
        <p className="mt-6 max-w-md text-center text-lg text-slate-100">
          Solicitud de acceso para ejecutivos comerciales.
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#E9E9EF] px-8 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-[3.2rem] leading-[0.95] font-extrabold text-[#0E3F5D]">Crear cuenta</h2>
          <p className="mt-4 text-sm text-slate-500">Registra credenciales para solicitar acceso</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "No se pudo crear cuenta" }));
                return setError(data.error ?? "No se pudo crear cuenta");
              }
              router.push("/dashboard");
            }}
          >
            <label className="block text-[1.55rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Usuario</label>
            <input className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="Usuario (mín. 3)" minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} />
            <label className="block text-[1.55rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Contraseña</label>
            <input className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="Contraseña (mín. 6)" minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="mt-2 w-full rounded-md bg-[#4FAEC7] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm hover:bg-[#4399B0]" type="submit">
              SOLICITAR ACCESO
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-sm font-bold text-[#0E3F5D]">Volver a iniciar sesión</a>
          </div>
        </div>
      </section>
    </main>
  );
}
