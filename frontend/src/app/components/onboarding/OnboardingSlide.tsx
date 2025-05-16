"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";

interface OnboardingSlideProps {
  imageSrc: StaticImageData | string;
  imageAlt: string;
  title: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  imageSrc,
  imageAlt,
  title,
}) => {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Imagen */}
      <div className="w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[350px] md:h-[350px] relative mb-6 md:mb-8">
        <Image
          src={imageSrc} // Ahora imageSrc es el objeto importado
          alt={imageAlt}
          layout="fill"
          objectFit="contain" // Para asegurar que toda la ilustración sea visible
          priority // Dar prioridad a la primera imagen del slide si es posible (o a la visible)
        />
      </div>
      {/* Título/Descripción */}
      <p className="text-sm sm:text-base text-gray-700 leading-relaxed px-4">
        {" "}
        {/* Color de texto más suave y padding lateral */}
        {title}
      </p>
    </div>
  );
};

export default OnboardingSlide;
