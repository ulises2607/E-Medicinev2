"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/axios";
export default function SignupForm({ role }: { role: "patient" | "doctor" }) {
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    setError("");
    if (password !== data.get("confirmPassword")) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("La contraseña no puede superar 72 bytes.");
      return;
    }
    setPending(true);
    try {
      await register({
        first_name: String(data.get("first_name")).trim(),
        last_name: String(data.get("last_name")).trim(),
        email: String(data.get("email")).trim(),
        password,
        role,
        ...(role === "doctor"
          ? { speciality: String(data.get("speciality")).trim() }
          : {}),
      });
      setSuccess(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  if (success)
    return (
      <div className="success form-stack" role="status">
        <h2>Tu cuenta está lista</h2>
        <p>Ahora podés iniciar sesión con tu correo y contraseña.</p>
        <Link className="button primary" href="/auth/login">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="two-columns">
        <label>
          Nombre
          <input
            name="first_name"
            autoComplete="given-name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label>
          Apellido
          <input
            name="last_name"
            autoComplete="family-name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
      </div>
      <label>
        Correo electrónico
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      {role === "doctor" && (
        <label>
          Especialidad
          <input
            name="speciality"
            minLength={3}
            maxLength={255}
            placeholder="Ej. Cardiología"
            required
          />
        </label>
      )}
      <label>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          aria-describedby="password-help"
          required
        />
      </label>
      <small id="password-help" className="muted">
        Usá al menos 8 caracteres.
      </small>
      <label>
        Repetir contraseña
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
