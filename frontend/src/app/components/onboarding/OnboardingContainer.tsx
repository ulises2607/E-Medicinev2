"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Para la redirección final
import OnboardingSlide from "./OnboardingSlide";
import ProgressIndicator from "./ProgressIndicator";
import imagen1 from "../../../../public/onbording-first.png";
import imagen2 from "../../../../public/onbording-second.png";
import imagen3 from "../../../../public/onbording-finally.png";
// Asegúrate de tener tus imágenes en la carpeta public o impórtalas
// import onboardingImg1 from '../../../public/images/onboarding/onboarding1.png'; // Ejemplo de importación

const onboardingSlidesData = [
  {
    imageSrc: imagen1, // Reemplaza con tus rutas reales o imágenes importadas
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
  const [currentStep, setCurrentStep] = useState(0); // Índice del slide actual (0, 1, 2)
  const router = useRouter();

  const totalSteps = onboardingSlidesData.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Último slide, redirigir a la siguiente pantalla (ej. login o selector de rol)
      router.push("/auth/login"); // O '/auth/role-select' o lo que corresponda
    }
  };

  const currentSlideData = onboardingSlidesData[currentStep];

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-gray-50 md:p-8">
      {/* Sección del Header del Onboarding */}
      <header className="text-center pt-12 pb-4 md:pt-16 md:pb-6">
        {" "}
        {/* Más padding vertical */}
        {/* Aquí podría ir el logo de E-medicine si lo tienes */}
        {/* <img src="/logo.png" alt="E-medicine Logo" className="mx-auto mb-2 h-10 w-auto" /> */}
        <p className="text-neutral-500 text-base md:text-lg">
          {" "}
          {/* Color más suave para el subtítulo */}
          Te damos la bienvenida a
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#35799F]">
          {" "}
          {/* Color Principal */}
          E-medicine
        </h1>
      </header>

      {/* Elementos decorativos de fondo (círculos) */}
      {/* Estos son ejemplos, necesitarás ajustar su posición y apariencia */}
      {currentStep === 0 && ( // Solo para el primer slide, como en Figma
        <>
          <div className="absolute top-20 right-5 w-32 h-32 bg-[#89BAD8] rounded-full opacity-30 mix-blend-multiply filter blur-lg animate-blob animation-delay-2000 md:w-48 md:h-48"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-[#812B75] rounded-full opacity-30 mix-blend-multiply filter blur-md animate-blob animation-delay-4000 md:w-24 md:h-24"></div>
        </>
      )}

      {/* Contenido del Slide Actual */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4">
        <OnboardingSlide
          imageSrc={currentSlideData.imageSrc}
          imageAlt={currentSlideData.imageAlt}
          title={currentSlideData.title}
        />
      </main>

      {/* Footer del Onboarding */}
      <footer className="w-full max-w-xs py-8 md:py-12">
        <ProgressIndicator totalSteps={totalSteps} currentStep={currentStep} />
        <button
          onClick={handleNext}
          className="w-full bg-[#35799F] hover:bg-[#2a6184] text-white font-semibold py-3 px-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#89BAD8] focus:ring-opacity-50 transition duration-150 ease-in-out"
          // Color Principal para el botón, con hover y focus states
        >
          {currentStep === totalSteps - 1 ? "Comenzar" : "Continuar"}
        </button>
      </footer>
    </div>
  );
};

export default OnboardingContainer;
