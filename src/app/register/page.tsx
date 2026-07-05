"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCaptcha() {
    const r = await fetch("/api/auth/captcha");
    if (r.ok) {
      const d = await r.json();
      setCaptchaQuestion(d.question);
      setCaptchaAnswer("");
    }
  }

  useEffect(() => {
    fetchCaptcha();
  }, []);

  return (
    <main className="grid min-h-screen md:grid-cols-[1fr_1fr]">
      <section className="hidden bg-[#0E3F5D] text-white md:flex md:flex-col md:items-center md:justify-center p-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4FAEC7] text-5xl font-bold text-[#0E3F5D]">M</div>
        <h1 className="mt-10 text-4xl font-extrabold tracking-wide text-center">M-MOTORS FINANCE</h1>
        <p className="mt-6 max-w-md text-center text-lg text-slate-100">
          Solicitud de acceso para ejecutivos comerciales.
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#E9E9EF] px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="text-[3.2rem] leading-[0.95] font-extrabold text-[#0E3F5D]">Crear cuenta</h2>
          <p className="mt-4 text-sm text-slate-500">Registra tus credenciales comerciales</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              
              if (password !== confirmPassword) {
                return setError("Las contraseñas no coinciden");
              }

              setLoading(true);
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  username, 
                  email, 
                  telefono, 
                  password, 
                  captchaAnswer: Number(captchaAnswer) 
                }),
              });
              setLoading(false);

              if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "No se pudo crear cuenta" }));
                await fetchCaptcha(); // Refresh captcha on failure
                return setError(data.error ?? "No se pudo crear cuenta");
              }
              router.push("/dashboard");
            }}
          >
            <div>
              <label className="block text-[1.2rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Usuario</label>
              <input className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="Ej: maria_ventas" minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            
            <div>
              <label className="block text-[1.2rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Correo Electrónico</label>
              <input type="email" className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="correo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-[1.2rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Teléfono</label>
              <input type="tel" className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="999 999 999" minLength={6} value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[1.2rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Contraseña</label>
                <input className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="Mín. 6 letras" minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[1.2rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Confirmar</label>
                <input className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none" placeholder="Repite contraseña" minLength={6} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            {/* Captcha matemático */}
            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verificación de seguridad</span>
                <button type="button" onClick={fetchCaptcha} className="text-xs text-[#4FAEC7] hover:underline">
                  ↻ Nueva pregunta
                </button>
              </div>
              <p className="text-base font-bold text-[#0E3F5D] mb-2">
                {captchaQuestion || "Cargando pregunta…"}
              </p>
              <input
                className="w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#4FAEC7]"
                placeholder="Escribe el resultado"
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
            <button className="mt-2 w-full rounded-md bg-[#4FAEC7] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm hover:bg-[#4399B0] disabled:opacity-60" type="submit" disabled={loading || !captchaQuestion}>
              {loading ? "CREANDO CUENTA..." : "SOLICITAR ACCESO"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-sm font-bold text-[#0E3F5D] hover:underline">Volver a iniciar sesión</a>
          </div>
        </div>
      </section>
    </main>
  );
}
