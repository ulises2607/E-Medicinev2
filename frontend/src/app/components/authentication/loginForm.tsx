"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardPath, useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/axios";
export default function LoginForm() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!isLoading && user) router.replace(dashboardPath(user));
  }, [isLoading, user, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const loggedIn = await login(
        String(data.get("email")),
        String(data.get("password")),
      );
      router.replace(dashboardPath(loggedIn));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-wrap">
      <section className="card auth-card">
        <Link className="brand" href="/">
          E-medicine<span>+</span>
        </Link>
        <p className="eyebrow">Tu salud, más cerca</p>
        <h1>Iniciar sesión</h1>
        <p className="muted">Ingresá para reservar o gestionar tus turnos.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={pending || isLoading}>
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="auth-footer">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/auth/sign-up">Crear cuenta</Link>
        </p>
      </section>
    </main>
  );
}
