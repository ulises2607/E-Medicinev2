"use client";
import { useState } from "react";
import Link from "next/link";
import SignupForm from "@/app/components/authentication/signupForm";
export default function SignupPage() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  return (
    <main className="auth-wrap">
      <section className="card auth-card wide">
        <Link className="brand" href="/">
          E-medicine<span>+</span>
        </Link>
        <h1>Crear cuenta</h1>
        <p className="muted">Elegí cómo vas a usar E-medicine.</p>
        <fieldset className="role-picker">
          <legend className="sr-only">Tipo de cuenta</legend>
          <label>
            <input
              type="radio"
              name="role"
              checked={role === "patient"}
              onChange={() => setRole("patient")}
            />{" "}
            Soy paciente
          </label>
          <label>
            <input
              type="radio"
              name="role"
              checked={role === "doctor"}
              onChange={() => setRole("doctor")}
            />{" "}
            Soy profesional
          </label>
        </fieldset>
        <SignupForm key={role} role={role} />
        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link href="/auth/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
