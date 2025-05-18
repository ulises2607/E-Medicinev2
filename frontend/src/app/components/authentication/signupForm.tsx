// src/components/authentication/signupForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AuthField from "../ui/authField";
import AuthGenderField from "../ui/authGenderField";
import PhoneNumberInput from "../ui/authPhoneField";
import Speciality from "../Speciality";

// Schemas de Zod (adaptados)
// Schema base común
const baseSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  last_name: z
    .string()
    .min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  phone_number: z
    .string()
    .min(10, { message: "El teléfono debe tener al menos 10 dígitos." })
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other"], {
    required_error: "El género es obligatorio.",
  }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string(),
  country: z
    .string()
    .min(2, { message: "País es requerido" })
    .optional()
    .or(z.literal("")),
});

// Schema para Paciente (solo campos base)
const patientSignupSchema = baseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  }
);

// Schema para Doctor (campos base + específicos de doctor)
const doctorSignupSchema = baseSchema
  .extend({
    speciality: z
      .string()
      .min(3, { message: "La especialidad debe tener al menos 3 caracteres." }),
    // professionalCertificates: z.string().url({ message: "Debe ser una URL válida para el certificado." }).optional().or(z.literal('')), // Si es una sola URL
    // O si son múltiples, podrías ser un array, pero para un input simple, una string es más fácil.
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type SignupFormInputs = z.infer<typeof baseSchema> & { speciality?: string }; // Tipo unión

interface SignupFormProps {
  role: "patient" | "doctor";
}

const SignupForm: React.FC<SignupFormProps> = ({ role }) => {
  const { register: registerUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Elegir el schema de validación según el rol
  const currentSchema =
    role === "doctor" ? doctorSignupSchema : patientSignupSchema;

  const {
    register, // de react-hook-form
    handleSubmit,
    setValue, // para el campo de teléfono
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(currentSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setServerError(null);
    setFormSuccess(null);
    const userDataToSubmit = { ...data, role }; // Añadir el rol a los datos
    // Limpiar professionalCertificates si no es doctor o está vacío
    if (role !== "doctor" || !userDataToSubmit.speciality) {
      // Podrías necesitar más campos de doctor aquí
      delete userDataToSubmit.speciality;
      // delete userDataToSubmit.professionalCertificates;
    }

    console.log("Enviando datos de registro:", userDataToSubmit);
    try {
      const response = await registerUser(userDataToSubmit); // Llama a la función del AuthContext
      console.log("Respuesta del registro:", response);
      setFormSuccess(
        response.message || "¡Registro exitoso! Por favor, inicia sesión."
      );
      // Redirigir al login después de un breve momento o al hacer clic en un botón
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error en el registro.";
      setServerError(errorMessage);
      console.error("Error de registro en el formulario:", error);
    }
  };

  // Para PhoneNumberInput
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  useEffect(() => {
    if (phoneValue) {
      setValue("phone_number", phoneValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [phoneValue, setValue]);

  return (
    <div className="w-full py-6">
      {" "}
      {/* Quité max-w-md para que tome el ancho del padre en la página */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#35799F]">
          Crear Cuenta de {role === "doctor" ? "Profesional" : "Paciente"}
        </h2>
        <div className="w-24 h-1 mx-auto mt-2 rounded-full bg-gradient-to-r from-[#812B75] via-[#89BAD8] to-[#35799F]"></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AuthField
            id="first_name"
            type="text"
            name="first_name"
            fieldTitle="Nombres"
            iconSrc="/assets/login/icon-login-type.png"
            placeholder="Tus nombres"
            register={register}
            error={errors.first_name}
          />
          <AuthField
            id="last_name"
            type="text"
            name="last_name"
            fieldTitle="Apellidos"
            iconSrc="/assets/login/icon-login-type.png"
            placeholder="Tus apellidos"
            register={register}
            error={errors.last_name}
          />
        </div>

        {/* AuthGenderField necesita ser adaptado para react-hook-form o usar inputs radio normales */}
        {/* Por ahora, un select simple para género: */}
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Género
          </label>
          <select
            {...register("gender")}
            id="gender"
            className={`w-full h-11 px-3 py-2 border-b-2 ${
              errors.gender ? "border-red-500" : "border-[#ADC6D8]"
            } focus:outline-none focus:border-[#35799F] bg-transparent`}
          >
            <option value="">Selecciona...</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="other">Otro</option>
          </select>
          {errors.gender && (
            <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>
          )}
        </div>

        <AuthField
          id="email"
          type="email"
          name="email"
          fieldTitle="Correo Electrónico"
          iconSrc="/assets/signup/email-input-icon-2.png"
          placeholder="tuemail@example.com"
          register={register}
          error={errors.email}
        />

        <PhoneNumberInput
          name="phone_number"
          value={phoneValue}
          onChange={setPhoneValue}
        />
        {/* El register('phone_number') se hace vía setValue */}
        {errors.phone_number && (
          <p className="text-xs text-red-500 mt-1">
            {errors.phone_number.message}
          </p>
        )}

        {role === "doctor" && (
          <>
            <AuthField
              id="country"
              type="text"
              name="country"
              fieldTitle="País (Doctor)"
              iconSrc="/assets/signup/world-form-icon.png"
              placeholder="País de residencia"
              register={register}
              error={errors.country}
            />
            <AuthField
              id="speciality"
              type="text"
              name="speciality"
              fieldTitle="Especialidad"
              iconSrc="/assets/signup/doctor-role-icon.png"
              placeholder="Ej: Cardiología"
              register={register}
              error={errors.speciality}
            />
            {/* <AuthField id="professionalCertificates" type="url" name="professionalCertificates" fieldTitle="URL Certificado (Opcional)" iconSrc="/assets/signup/doctor-role-icon.png" placeholder="https://ejemplo.com/certificado.pdf" register={register} error={errors.professionalCertificates} /> */}
          </>
        )}

        <AuthField
          id="password"
          type="password"
          name="password"
          fieldTitle="Contraseña"
          iconSrc="/assets/login/icon-login-password.png"
          placeholder="••••••••"
          register={register}
          error={errors.password}
        />
        <AuthField
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          fieldTitle="Confirmar Contraseña"
          iconSrc="/assets/login/icon-login-password.png"
          placeholder="••••••••"
          register={register}
          error={errors.confirmPassword}
        />

        {serverError && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
            {serverError}
          </p>
        )}
        {formSuccess && (
          <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
            {formSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || authIsLoading || !isDirty || !isValid}
          className="w-full bg-[#812B75] hover:bg-[#6b245f] text-white font-semibold py-3 px-4 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#89BAD8] focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting || authIsLoading ? "Registrando..." : "Crear Cuenta"}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
