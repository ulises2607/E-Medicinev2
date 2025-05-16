"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // Necesitas: npm install @hookform/resolvers
import { z } from "zod";
import { useAuth, User } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AuthField from "../ui/authField";

// Esquema de Zod para el login
const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Por favor, ingresa un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login, user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setServerError(null);
    try {
      const loggedInUser = await login(data.email, data.password);
      if (loggedInUser) {
        console.log("Login exitoso en LoginForm, usuario:", loggedInUser);
        // La redirección se maneja en el useEffect
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al iniciar sesión. Verifica tus credenciales.";
      setServerError(errorMessage);
      console.error("Error de login en el formulario:", error);
    }
  };

  useEffect(() => {
    if (!authIsLoading && user) {
      console.log(
        "Usuario detectado en AuthContext (LoginForm), redirigiendo...",
        user
      );
      const basePath = user.role === "doctor" ? "/doctor" : "/paciente";
      router.replace(`${basePath}/${user.id}`); // Ajusta esta ruta
    }
  }, [user, authIsLoading, router]);

  if (authIsLoading && !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Image
          src="/logo.png"
          alt="Cargando..."
          width={60}
          height={60}
          className="animate-pulse mb-4"
        />
        <p className="text-lg text-gray-600">Verificando sesión...</p>
      </div>
    );
  }
  if (user && !authIsLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Image
          src="/logo.png"
          alt="Cargado"
          width={60}
          height={60}
          className="mb-4"
        />
        <p className="text-lg text-gray-600">Sesión activa. Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white p-6 md:p-8 rounded-xl shadow-xl">
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="E-medicine Logo"
          width={56}
          height={56}
          className="mx-auto mb-3"
        />
        <h2 className="text-3xl font-bold text-[#35799F]">Iniciar Sesión</h2>
        <div className="w-28 h-1 mx-auto mt-2.5 rounded-full bg-gradient-to-r from-[#812B75] via-[#89BAD8] to-[#35799F]"></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthField
          id="email"
          type="email"
          name="email"
          fieldTitle="Correo Electrónico"
          iconSrc="/assets/login/icon-login-type.png"
          iconInputSrc="/assets/login/email-input-icon.png"
          placeholder="tuemail@example.com"
          register={register}
          error={errors.email}
        />
        <AuthField
          id="password"
          type="password"
          name="password"
          fieldTitle="Contraseña"
          iconSrc="/assets/login/icon-login-password.png"
          iconInputSrc="/assets/login/password-input-icon.png"
          placeholder="••••••••"
          register={register}
          error={errors.password}
        />
        {serverError && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
            {serverError}
          </p>
        )}
        <div>
          <Link
            href="/auth/forgot-password"
            className="block text-xs sm:text-sm text-[#35799F] hover:text-[#812B75] hover:underline text-center my-5"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <div className="flex justify-between items-center border-2 border-gray-200 p-3 my-4 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recaptcha"
                className="h-4 w-4 sm:h-5 sm:w-5 text-[#35799F] border-gray-300 rounded focus:ring-[#89BAD8]"
              />
              <label
                htmlFor="recaptcha"
                className="text-xs sm:text-sm font-medium text-gray-700"
              >
                No soy un robot
              </label>
            </div>
            <Image
              src="/assets/login/captcha-logo-2.png"
              width={32}
              height={32}
              alt="captcha-icon"
              className="sm:w-9 sm:h-9"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting || authIsLoading}
          className="w-full bg-[#812B75] hover:bg-[#6b245f] text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#812B75] focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting || authIsLoading ? "Ingresando..." : "Ingresar"}
        </button>
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>
            ¿No tienes una cuenta?{" "}
            <Link
              className="font-medium text-[#812B75] hover:underline"
              href="/auth/sign-up"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
export default LoginForm;
