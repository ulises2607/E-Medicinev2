"use client";

import React from "react";
import Image, { StaticImageData } from "next/image"; // Para usar StaticImageData si importas imágenes directamente

interface OnboardingSlideProps {
  imageSrc: string | StaticImageData; // Puede ser una URL o una imagen importada
  imageAlt: string;
  title: string; // El texto como "Consultas con especialistas..."
  // Podríamos tener un título principal constante "Te damos la bienvenida a E-medicine" en el contenedor
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  imageSrc,
  imageAlt,
  title,
}) => {
  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-md">
      {" "}
      {/* Limitar ancho máximo */}
      {/* Contenedor de la imagen para mantener proporciones y tamaño */}
      <div className="mb-6 md:mb-10 w-[280px] h-[280px] md:w-[320px] md:h-[320px] relative">
        {" "}
        {/* Tamaño específico */}
        <Image
          src={imageSrc}
          alt={imageAlt}
          layout="fill"
          objectFit="contain" // 'contain' suele ser mejor para ilustraciones para que se vean completas
          priority={true} // Para la primera imagen del onboarding (LCP)
        />
      </div>
      <p className="text-neutral-700 text-base md:text-lg leading-relaxed max-w-sm">
        {" "}
        {/* max-w-sm para el texto */}
        {title}
      </p>
    </div>
  );
};

export default OnboardingSlide;
