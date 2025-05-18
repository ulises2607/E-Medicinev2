"use client";

import React, { useState } from "react";
import Image from "next/image";
import SignupForm from "@/app/components/authentication/signupForm"; // Ajusta la ruta
import AuthHeader from "@/app/components/ui/authHeader"; // Si lo usas en el layout de auth, no aquí
import Link from "next/link";

type Role = "patient" | "doctor" | "";

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("");
  const [step, setStep] = useState(1);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleNextStep = () => {
    if (selectedRole) {
      setStep(2);
    } else {
      alert("Por favor, selecciona un rol."); // O un mensaje de error más elegante
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
    setSelectedRole(""); // Opcional: resetear el rol al volver atrás
  };

  return (
    // El AuthHeader ya debería estar en src/app/auth/layout.tsx
    // El layout también debería centrar este contenido.
    <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-xl shadow-xl">
      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <Image
              src="/logo.png"
              alt="E-medicine Logo"
              width={48}
              height={48}
              className="mx-auto mb-2"
            />
            <h2 className="text-2xl font-bold text-[#35799F]">Elige tu Rol</h2>
            <p className="text-sm text-gray-600 mt-1">
              ¿Cómo te unirás a E-medicine?
            </p>
            <div className="w-24 h-1 mx-auto mt-2 rounded-full bg-gradient-to-r from-[#812B75] via-[#89BAD8] to-[#35799F]"></div>
          </div>

          <div className="space-y-4 my-8">
            {/* Opción Paciente */}
            <label
              htmlFor="role-patient"
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all duration-150
                          ${
                            selectedRole === "patient"
                              ? "border-[#35799F] bg-blue-50 ring-2 ring-[#35799F]"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/signup/patient-role-icon.png"
                  width={28}
                  height={28}
                  alt="patient-role-icon"
                />
                <span
                  className={`font-medium ${
                    selectedRole === "patient"
                      ? "text-[#35799F]"
                      : "text-gray-700"
                  }`}
                >
                  Soy Paciente
                </span>
              </div>
              <input
                type="radio"
                id="role-patient"
                name="role"
                value="patient"
                checked={selectedRole === "patient"}
                onChange={() => handleRoleSelect("patient")}
                className="hidden" // El estilo se aplica al label
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  selectedRole === "patient"
                    ? "border-[#35799F]"
                    : "border-gray-400"
                }`}
              >
                {selectedRole === "patient" && (
                  <div className="w-2.5 h-2.5 bg-[#35799F] rounded-full"></div>
                )}
              </div>
            </label>

            {/* Opción Doctor */}
            <label
              htmlFor="role-doctor"
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all duration-150
                          ${
                            selectedRole === "doctor"
                              ? "border-[#812B75] bg-purple-50 ring-2 ring-[#812B75]"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/signup/doctor-role-icon.png"
                  width={28}
                  height={28}
                  alt="doctor-role-icon"
                />
                <span
                  className={`font-medium ${
                    selectedRole === "doctor"
                      ? "text-[#812B75]"
                      : "text-gray-700"
                  }`}
                >
                  Soy Profesional de la Salud
                </span>
              </div>
              <input
                type="radio"
                id="role-doctor"
                name="role"
                value="doctor"
                checked={selectedRole === "doctor"}
                onChange={() => handleRoleSelect("doctor")}
                className="hidden"
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  selectedRole === "doctor"
                    ? "border-[#812B75]"
                    : "border-gray-400"
                }`}
              >
                {selectedRole === "doctor" && (
                  <div className="w-2.5 h-2.5 bg-[#812B75] rounded-full"></div>
                )}
              </div>
            </label>
          </div>

          <button
            onClick={handleNextStep}
            disabled={!selectedRole}
            className="w-full bg-[#812B75] hover:bg-[#6b245f] text-white font-semibold py-3 px-4 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#89BAD8] focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </>
      )}

      {step === 2 && selectedRole && (
        <div>
          {/* Botón para volver al paso anterior */}
          <button
            onClick={handlePreviousStep}
            className="text-sm text-[#35799F] hover:underline mb-4 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
            Volver a selección de rol
          </button>
          <SignupForm role={selectedRole} />
        </div>
      )}
      <div className="text-center text-sm text-gray-600 mt-8">
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link
            className="font-medium text-[#812B75] hover:underline"
            href="/auth/login"
          >
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
