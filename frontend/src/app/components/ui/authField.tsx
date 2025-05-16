"use client";
import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";
import Image from "next/image";

interface AuthFieldProps {
  id: string;
  type: string;
  name: string; // Para react-hook-form
  label?: string; // Si quieres una etiqueta encima
  fieldTitle?: string; // Tu prop original
  iconSrc?: string; // Tu prop original
  iconInputSrc?: string; // Tu prop original
  placeholder: string;
  register: UseFormRegister<any>; // De react-hook-form
  error?: FieldError; // De react-hook-form
}

const AuthField: React.FC<AuthFieldProps> = ({
  id,
  type,
  name,
  label,
  fieldTitle,
  iconSrc, // No usado en este ejemplo simple, pero podrías añadirlo
  iconInputSrc, // No usado en este ejemplo simple
  placeholder,
  register,
  error,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      {/* Si quieres mantener el fieldTitle con icono */}
      {fieldTitle && iconSrc && (
        <div className="flex items-center gap-2 mb-1">
          <Image src={iconSrc} alt={fieldTitle} width={24} height={24} />{" "}
          {/* Ajusta tamaño */}
          <span className="text-sm text-gray-700">{fieldTitle}</span>
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...register(name)} // Registrar el campo con react-hook-form
          className={`w-full h-[45px] px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-indigo-500"
          } sm:text-sm`}
        />
        {iconInputSrc && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Image src={iconInputSrc} alt="input icon" width={20} height={20} />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
};

export default AuthField;
