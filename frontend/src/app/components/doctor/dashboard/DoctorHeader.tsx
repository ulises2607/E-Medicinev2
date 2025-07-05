"use client";

import React from "react";
import Image from "next/image";
import { User } from "@/context/AuthContext";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

interface DoctorHeaderProps {
  user: User; // Asumimos que el usuario ya está cargado
}

const DoctorHeader: React.FC<DoctorHeaderProps> = ({ user }) => {
  // El ícono de la derecha en tu Figma (corazón con bolita) puede ser para notificaciones o favoritos.
  // Usaré BellIcon como placeholder.
  const RightSideIcon = BellIcon; // O tu ícono personalizado

  return (
    <header className="bg-gradient-to-r from-[#89BAD8] via-[#61A5CB] to-[#35799F] p-4 text-white flex items-center justify-between space-x-3 shadow-md sticky top-0 z-20 md:relative">
      <div className="flex items-center space-x-3">
        {user.photo_url ? (
          <Image
            src={user.photo_url}
            alt={`Foto de Dr(a). ${user.last_name}`}
            width={44}
            height={44}
            className="rounded-full border-2 border-white object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#35799F] text-xl font-bold">
            {user.first_name?.charAt(0).toUpperCase()}
            {user.last_name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-semibold text-md md:text-lg leading-tight">
            Dr(a). {user.first_name} {user.last_name}
          </h1>
          <p className="text-xs opacity-90">
            {user.doctorInfo?.speciality || "Especialidad no definida"}
          </p>
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
        <RightSideIcon className="w-6 h-6" />
      </button>
    </header>
  );
};

export default DoctorHeader;
