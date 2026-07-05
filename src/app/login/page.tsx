"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      <section className="hidden bg-[#0E3F5D] text-white md:flex md:flex-col md:items-center md:justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4FAEC7] text-5xl font-bold text-[#0E3F5D]">M</div>
        <h1 className="mt-10 text-4xl font-extrabold tracking-wide">M-MOTORS FINANCE</h1>
        <p className="mt-6 max-w-md text-center text-lg text-slate-100">
          Plataforma exclusiva para ejecutivos comerciales. Cotiza el plan de &ldquo;compra inteligente&rdquo; en segundos
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#E9E9EF] px-8 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-[3.6rem] leading-[0.95] font-extrabold text-[#0E3F5D]">Bienvenido de vuelta</h2>
          <p className="mt-4 text-sm text-slate-500">Ingresa tus credenciales para acceder al sistema</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, captchaAnswer: Number(captchaAnswer) }),
              });
              setLoading(false);
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data.error ?? "Error al iniciar sesión");
                // Always refresh captcha on any failure
                await fetchCaptcha();
                return;
              }
              router.push("/dashboard");
            }}
          >
            <label className="block text-[1.55rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Usuario</label>
            <input
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-[#4FAEC7]"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <div className="mt-2 flex items-center justify-between">
              <label className="block text-[1.55rem] font-bold uppercase tracking-tight text-[#0E3F5D]">Contraseña</label>
              <span className="text-xs text-slate-500">¿Olvidaste tu contraseña?</span>
            </div>
            <input
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-[#0E3F5D] placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-[#4FAEC7]"
              placeholder="Ingresa tu contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {/* Captcha matemático */}
            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verificación de seguridad</span>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="text-xs text-[#4FAEC7] hover:underline"
                >
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              className="mt-2 w-full rounded-md bg-[#4FAEC7] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm hover:bg-[#4399B0] disabled:opacity-60"
              type="submit"
              disabled={loading || !captchaQuestion}
            >
              {loading ? "VERIFICANDO…" : "ACCEDER AL SISTEMA"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">¿No tienes una cuenta de vendedor?</p>
          <div className="text-center">
            <a href="/register" className="text-sm font-bold text-[#0E3F5D]">Solicitar acceso</a>
          </div>
        </div>
      </section>
    </main>
  );
}
