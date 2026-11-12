// src/components/paciente/dashboard/PatientHeader.tsx
"use client";

import React from "react";
import Image from "next/image";
import { User } from "@/context/AuthContext"; // Importa la interfaz User
import { BellIcon } from "@heroicons/react/24/outline"; // Ejemplo de iconos de Heroicons

interface PatientHeaderProps {
  user: User | null;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ user }) => {
  if (!user) {
    return (
      <header className="bg-gradient-to-r from-[#89BAD8] to-[#35799F] p-4 text-white flex items-center justify-between space-x-3 shadow-md sticky top-0 z-20 md:relative h-[68px]">
        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
      </header>
    );
  }

  const RightIcon = BellIcon;

  return (
    <header className="bg-gradient-to-r from-[#89BAD8] to-[#35799F] p-4 text-white flex items-center justify-between space-x-3 shadow-md sticky top-0 z-20 md:relative">
      <div className="flex items-center space-x-3">
        {user.photo_url ? (
          <Image
            src={user.photo_url}
            alt={`Foto de ${user.first_name}`}
            width={44} // Tamaño un poco más grande
            height={44}
            className="rounded-full border-2 border-white"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#35799F] text-xl font-bold">
            {user.first_name?.charAt(0).toUpperCase()}
            {user.last_name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-semibold text-md md:text-lg leading-tight">
            {user.first_name} {user.last_name}
          </h1>
          {/* <p className="text-xs opacity-80">Paciente</p> */}
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
        <RightIcon className="w-6 h-6" />
      </button>
    </header>
  );
};

export default PatientHeader;
