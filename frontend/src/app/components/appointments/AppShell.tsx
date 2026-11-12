"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { dashboardPath, useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/axios";
export default function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role?: "patient" | "doctor";
}) {
  const { user, isLoading, sessionError, fetchCurrentUser, logout } = useAuth();
  const router = useRouter(),
    params = useParams(),
    pathname = usePathname();
  const [error, setError] = useState("");
  const wrongAccount = Boolean(
    user && role && (user.role !== role || String(user.id) !== params.id),
  );
  useEffect(() => {
    if (isLoading || sessionError) return;
    if (!user) router.replace("/auth/login");
    else if (wrongAccount) router.replace(dashboardPath(user));
  }, [user, isLoading, sessionError, wrongAccount, router]);
  if (sessionError)
    return (
      <main className="auth-wrap">
        <div className="card">
          <p role="alert">{sessionError}</p>
          <button className="button" onClick={() => void fetchCurrentUser()}>
            Reintentar
          </button>
        </div>
      </main>
    );
  if (isLoading || !user || wrongAccount)
    return (
      <main className="auth-wrap">
        <p role="status">Cargando tu cuenta…</p>
      </main>
    );
  const home = dashboardPath(user);
  const links = [
    { href: home, label: "Inicio" },
    { href: home + "/agenda", label: "Mis turnos" },
    user.role === "doctor"
      ? { href: home + "/disponibilidad", label: "Disponibilidad" }
      : { href: home + "/agendar-turnos", label: "Reservar turno" },
  ];
  async function signOut() {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" href={home}>
          E-medicine<span>+</span>
        </Link>
        <div className="account">
          <span>
            {user.first_name} {user.last_name}
            <small>{user.role === "doctor" ? "Profesional" : "Paciente"}</small>
          </span>
          <button className="text-button" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside>
          <nav aria-label="Principal">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="sidebar-note">Un espacio para organizar tu atención.</p>
        </aside>
        <main className="workspace-main">
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
