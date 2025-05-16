// src/app/paciente/[id]/page.tsx
"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, User } from "@/context/AuthContext"; // Asegúrate que User esté bien definida
import Image from "next/image";
import imagenCarousel from "../../../../public/home/Frame 2388.png";

// Importa los componentes que crearás
import NotiSalud from "@/app/components/patient/dashboard/NotiSalud";
import PatientHeader from "@/app/components/patient/dashboard/PatientHeader";
import ImageCarousel from "@/app/components/ui/ImageCarousel";
import TodayAppointments from "@/app/components/patient/dashboard/TodayAppointments";
import { format } from "date-fns";
// import LastConsultations from "@/components/paciente/dashboard/LastConsultations"; // Ajusta ruta
// import NotiSalud from "@/components/paciente/dashboard/NotiSalud"; // Ajusta ruta
// El Navbar inferior vendrá del layout que envuelve esta página

// Define una interfaz para los items de NotiSalud si los datos son estáticos o vienen de API
interface NotiSaludItem {
  id: string | number;
  title: string;
  imageUrl: string; // O StaticImageData si importas
  link?: string;
}

export default function PatientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const patientIdFromUrl = params.id as string;
  const date = new Date();

  const { user, isLoading: authIsLoading, logout } = useAuth();

  // Datos de ejemplo (reemplazar con SWR o props si es un Server Component)
  const carouselImages = [
    // Deberías tener estas imágenes en /public/images/dashboard/ o similar
    {
      src: imagenCarousel,
      alt: "Telemedicina E-medicine",
    },
    // { src: '/images/dashboard/banner-cuida-tu-salud.jpg', alt: 'Cuida tu salud' },
  ];

  const notiSaludItems: NotiSaludItem[] = [
    {
      id: 1,
      title: "5 Consejos para una dieta balanceada este invierno",
      imageUrl: "/images/notisalud/dieta-invierno.jpg",
      link: "#",
    },
    {
      id: 2,
      title: "Importancia de la actividad física regular para tu corazón",
      imageUrl: "/images/notisalud/actividad-fisica.jpg",
      link: "#",
    },
    {
      id: 3,
      title: "Nuevas funcionalidades en la app: Agenda inteligente",
      imageUrl: "/images/notisalud/app-novedades.jpg",
      link: "#",
    },
  ];

  useEffect(() => {
    if (
      !authIsLoading &&
      (!user ||
        user.id.toString() !== patientIdFromUrl ||
        user.role !== "patient")
    ) {
      // Si la carga de auth terminó y no hay usuario, o el ID no coincide, o no es paciente
      logout(); // Limpia cualquier sesión incorrecta
      router.replace("/auth/login");
    }
  }, [user, authIsLoading, patientIdFromUrl, router, logout]);

  if (authIsLoading || !user) {
    // Muestra un loader más elaborado o el esqueleto de la página
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
          Cargando dashboard del paciente...
        </p>
      </div>
    );
  }

  // Si el user.id no es string, conviértelo o ajusta la comparación
  if (user.id.toString() !== patientIdFromUrl || user.role !== "patient") {
    // Este caso debería ser cubierto por el useEffect, pero es una doble verificación.
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Acceso no autorizado.</p>
      </div>
    );
  }

  return (
    // pb-20 para dejar espacio para el Navbar inferior en móviles
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0">
      <PatientHeader user={user} />

      {/* Aquí iría ImageCarousel si lo implementas */}
      <div className="w-full h-40 md:h-56 relative mb-6 shadow-lg">
        <Image
          src={carouselImages[0].src}
          alt={carouselImages[0].alt}
          layout="fill"
          objectFit="cover"
          priority // La imagen principal del dashboard
        />
        {/* Indicadores de puntos si es carrusel */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
          {carouselImages.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === 0 ? "bg-white" : "bg-white/60"
              }`}
            ></div>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-8">
        {" "}
        {/* Espacio entre secciones */}
        <TodayAppointments pacienteId={user.id.toString()} fechaActual={date} />
        {/* <LastConsultations pacienteId={user.id.toString()} /> */}
        <NotiSalud />
      </div>

      {/* El BottomNavbar.tsx se renderiza como parte del layout que envuelve esta página,
          asegúrate de que /paciente/[id]/layout.tsx exista y lo incluya, o
          que tu RootLayout lo maneje condicionalmente.
      */}
    </div>
  );
}
