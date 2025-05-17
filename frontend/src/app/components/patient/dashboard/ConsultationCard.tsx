"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { StarIcon } from "@heroicons/react/24/solid"; // Para las estrellas de rating

interface ConsultationCardProps {
  doctorImage: string | StaticImageData; // Puede ser una URL o imagen importada
  doctorName: string;
  doctorSpeciality: string;
  rating: number; // ej. 4 de 5
  diagnosis: string;
  prescription: string; // O "formulación"
}

const ConsultationCard: React.FC<ConsultationCardProps> = ({
  doctorImage,
  doctorName,
  doctorSpeciality,
  rating,
  diagnosis,
  prescription,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 p-4 rounded-xl shadow-lg min-w-[280px] sm:min-w-[300px] md:min-w-[320px] flex-shrink-0 h-full flex flex-col justify-between">
      {/* Doctor Info */}
      <div className="flex items-center mb-3">
        <Image
          src={doctorImage}
          alt={`Foto de Dr(a). ${doctorName}`}
          width={40}
          height={40}
          className="rounded-full mr-3 border-2 border-white object-cover"
        />
        <div>
          <p className="font-semibold text-sm text-gray-800">{doctorName}</p>
          <p className="text-xs text-gray-600">{doctorSpeciality}</p>
          <div className="flex items-center mt-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon
                key={index}
                className={`w-3 h-3 ${
                  index < rating ? "text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Consultation Details */}
      <div className="space-y-1.5 text-xs text-gray-700">
        <div>
          <span className="font-medium text-gray-600">Diagnóstico:</span>
          <p className="ml-1 truncate">{diagnosis}</p>{" "}
          {/* truncate si puede ser largo */}
        </div>
        <div>
          <span className="font-medium text-gray-600">Formulación:</span>
          <p className="ml-1 truncate">{prescription}</p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationCard;
