"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";

export interface User {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  phone_number?: string;
  photo_url?: string;
  gender?: "male" | "female" | "other";
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  date_of_birth?: string;
  confirmed: boolean;
  // Perfiles anidados (estos vienen del 'include' en Sequelize)
  pacienteInfo?: {
    user_id: number | string;
    credit_card_token?: string;
  } | null;
  doctorInfo?: {
    user_id: number | string;
    speciality: string;
    consultation_value?: number | string;
    availability_status?: "available" | "not_available";
    id_document_type?: string;
    id_document_number?: string;
    certificados?: any[];
    disponibilidades?: any[];
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  register: (
    userData: any
  ) => Promise<{ id: string | number; role: string } | any>; // La respuesta del backend es {id, role}
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    console.log("AuthContext: Intentando fetchCurrentUser...");
    try {
      const response = await apiClient.get<{ user: User }>("/users/me");
      const fetchedUser = response.data.user;
      console.log("AuthContext: fetchCurrentUser exitoso", fetchedUser);
      setUser(fetchedUser);
      return fetchedUser;
    } catch (error: any) {
      console.error(
        "AuthContext: Error en fetchCurrentUser o no hay sesión:",
        error.response?.data?.message || error.message
      );
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("AuthProvider: Montado, iniciando fetchCurrentUser inicial.");
    setIsLoading(true);
    fetchCurrentUser().finally(() => {
      console.log("AuthProvider: fetchCurrentUser inicial completado.");
      setIsLoading(false);
    });
  }, [fetchCurrentUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    console.log("AuthContext: Intentando login...");
    setIsLoading(true);
    try {
      // backend en /api/auth/login devuelve { message: '...', user: UserData }
      const response = await apiClient.post<{ user: User; message: string }>(
        "/auth/login",
        { email, password }
      );
      const loggedInUser = response.data.user;
      console.log(
        "AuthContext: Login exitoso, usuario de respuesta:",
        loggedInUser
      );
      setUser(loggedInUser); // Actualiza el estado con el usuario del login
      setIsLoading(false);
      return loggedInUser;
    } catch (error: any) {
      console.error(
        "AuthContext: Error en login:",
        error.response?.data?.message || error.message
      );
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: any): Promise<any> => {
    console.log("AuthContext: Intentando register con datos:", userData);
    setIsLoading(true);
    try {
      // backend en /api/auth/register devuelve { message: '...', user: {id, role, email ...} }
      // o según tu auth.service.js, devolvía el usuario completo.
      // Vamos a asumir que devuelve el usuario completo sin la contraseña.
      const response = await apiClient.post<{ user: User; message: string }>(
        "/auth/register",
        userData
      );
      console.log("AuthContext: Registro exitoso", response.data);
      // NO establecemos el usuario aquí porque el registro no implica login automático.
      setIsLoading(false);
      router.push("/auth/login");
      return response.data; // Devuelve { user: ..., message: ... }
    } catch (error: any) {
      console.error(
        "AuthContext: Error en register:",
        error.response?.data?.message || error.message
      );
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    console.log("AuthContext: Intentando logout...");
    setIsLoading(true);
    try {
      await apiClient.post("/auth/logout");
      console.log("AuthContext: Logout exitoso en backend.");
      router.push("/auth/login");
    } catch (error: any) {
      console.error(
        "AuthContext: Error en logout del backend:",
        error.response?.data?.message || error.message
      );
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push("/auth/login"); // Redirigir siempre después del intento de logout
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, fetchCurrentUser }}
    >
      {/* Renderizar hijos incluso durante la carga inicial, ellos decidirán qué mostrar */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
