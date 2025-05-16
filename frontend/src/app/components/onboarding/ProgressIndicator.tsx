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
    <div className="flex justify-center items-center space-x-2 my-6 md:my-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ease-in-out
            ${index === currentStep ? "bg-[#35799F] w-6" : "bg-[#D3DDE1] w-2"}
          `}
        />
      ))}
    </div>
  );
};

export default ProgressIndicator;
