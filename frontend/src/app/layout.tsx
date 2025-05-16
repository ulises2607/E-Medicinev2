import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-medicine",
  description: "Tu plataforma de telemedicina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Establece el idioma principal de tu aplicación */}
      <body className={`${inter.className} bg-gray-100`}>
        {/* Fondo base para toda la app */}
        <AuthProvider>
          {/* ENVUELVE TUS CHILDREN AQUÍ */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
