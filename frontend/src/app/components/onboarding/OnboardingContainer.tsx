// src/components/onboarding/OnboardingContainer.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingSlide from "./OnboardingSlide";
import ProgressIndicator from "./ProgressIndicator";
import Image from "next/image"; // Para el logo

// Tus imágenes importadas (esto está perfecto)
import imagen1 from "../../../../public/onbording-first.png"; // Ajusta la ruta si moviste los componentes
import imagen2 from "../../../../public/onbording-second.png";
import imagen3 from "../../../../public/onbording-finally.png";

const onboardingSlidesData = [
  {
    imageSrc: imagen1,
    imageAlt: "Consultas con especialistas",
    title:
      "Consultas con especialistas sin largas esperas, desde la comodidad de tu hogar.",
  },
  {
    imageSrc: imagen2,
    imageAlt: "Historiales médicos seguros",
    title:
      "Accede a tus historiales médicos y recomendaciones personalizadas de manera segura.",
  },
  {
    imageSrc: imagen3,
    imageAlt: "Fácil de usar",
    title: "Fácil de usar y disponible en cualquier momento y lugar.",
  },
];

const OnboardingContainer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const totalSteps = onboardingSlidesData.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/auth/login"); // O la ruta que corresponda
    }
  };

  const currentSlideData = onboardingSlidesData[currentStep];

  return (
    // Contenedor principal con fondo y padding. justify-between para empujar header y footer a los extremos.
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-[#FAFAFA] md:p-8 relative overflow-hidden">
      {" "}
      {/* bg-gray-50 o tu color de fondo deseado */}
      {/* Elementos decorativos de fondo (círculos) - Ejemplo para el primer slide */}
      {currentStep === 0 && (
        <>
          <div className="absolute top-10 right-[-50px] w-40 h-40 bg-[#89BAD8] rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 md:w-60 md:h-60 md:right-[-80px] md:top-16"></div>
          <div className="absolute top-24 right-10 w-20 h-20 bg-[#812B75] rounded-full opacity-20 mix-blend-multiply filter blur-lg animate-blob animation-delay-4000 md:w-32 md:h-32 md:right-20"></div>
        </>
      )}
      {/* Podrías tener diferentes círculos o ninguno para otros slides si quieres */}
      <header className="text-center w-full mt-8 md:mt-12 z-10">
        <p className="text-neutral-600 text-sm sm:text-base">
          {" "}
          {/* Color de texto más suave */}
          Te damos la bienvenida
        </p>
        <div className="flex items-center justify-center mb-1">
          <Image
            src="/logo.png"
            alt="E-medicine Logo"
            width={24}
            height={24}
            className="mr-2"
          />{" "}
          {/* Ajusta tamaño y margen */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#35799F]">
            {" "}
            {/* Color Principal */}
            E-medicine
          </h1>
        </div>
        <div className="w-32 h-1 mx-auto mt-2 rounded-full bg-gradient-to-r from-[#812B75] via-[#89BAD8] to-[#35799F]"></div>
        {/* Línea degradada del logo, si es parte del header y no un componente separado */}
      </header>
      <main className="flex-grow flex flex-col items-center justify-center w-full py-4 z-10">
        <OnboardingSlide
          imageSrc={currentSlideData.imageSrc}
          imageAlt={currentSlideData.imageAlt}
          title={currentSlideData.title}
        />
      </main>
      <footer className="w-full max-w-xs mb-8 md:mb-12 z-10">
        <ProgressIndicator totalSteps={totalSteps} currentStep={currentStep} />
        <button
          onClick={handleNext}
          className="w-full bg-[#35799F] hover:bg-[#2a6184] text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#89BAD8] focus:ring-opacity-50 transition-all duration-150 ease-in-out"
        >
          {currentStep === totalSteps - 1 ? "Comenzar" : "Continuar"}
        </button>
      </footer>
    </div>
  );
};

export default OnboardingContainer;
