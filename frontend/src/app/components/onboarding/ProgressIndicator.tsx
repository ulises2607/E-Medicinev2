"use client";

import React from "react";

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number; // Basado en índice 0
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <div className="flex justify-center space-x-2 my-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ease-in-out
    ${
      index === currentStep
        ? "bg-[#35799F] w-8 md:w-10"
        : "bg-[#D3DDE1] w-2.5 md:w-3"
    } 
  `}
        />
      ))}
    </div>
  );
};

export default ProgressIndicator;
