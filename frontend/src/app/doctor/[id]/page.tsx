// src/app/doctor/[id]/page.tsx
"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, User } from "@/context/AuthContext";
import Image from "next/image"; // Para el logo de carga

// Importa los componentes que crearás
import DoctorHeader from "@/app/components/doctor/dashboard/DoctorHeader";
import CurrentTimeDisplay from "@/app/components/doctor/dashboard/CurrentTimeDisplay";
import TodayDoctorAppointments from "@/app/components/doctor/dashboard/TodayDoctorAppointments";
// El Navbar inferior vendrá del layout que envuelve esta página

export default function DoctorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const doctorIdFromUrl = params.id as string;

  const { user, isLoading: authIsLoading, logout } = useAuth();

  useEffect(() => {
    if (
      !authIsLoading &&
      (!user ||
        user.id.toString() !== doctorIdFromUrl ||
        user.role !== "doctor")
    ) {
      logout();
      router.replace("/auth/login");
    }
  }, [user, authIsLoading, doctorIdFromUrl, router, logout]);

  if (authIsLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <Image
          src="/logo.png"
          alt="Cargando..."
          width={60}
          height={60}
          className="animate-pulse mb-4"
        />
        <p className="text-lg text-gray-600">
          Cargando dashboard del doctor...
        </p>
      </div>
    );
  }

  if (user.id.toString() !== doctorIdFromUrl || user.role !== "doctor") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Acceso no autorizado.</p>
      </div>
    );
  } else if (!user) {
    router.push("/auth/login");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0">
      {" "}
      {/* Fondo y padding para Navbar inferior */}
      <DoctorHeader user={user} />
      <CurrentTimeDisplay />
      <main className="flex-grow px-4 md:px-6 py-6 space-y-6">
        <TodayDoctorAppointments doctorId={user.id.toString()} />

        <button
          onClick={() => router.push(`/doctor/${user.id}/agenda`)} // Ruta a la agenda completa
          className="w-full bg-[#812B75] hover:bg-[#6a235e] text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-base"
        >
          Consultar Agenda
        </button>
      </main>
      {/* El BottomNavbar se renderizará por el layout que envuelve esta página */}
    </div>
  );
}
