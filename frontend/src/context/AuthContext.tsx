"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { SWRConfig } from "swr";
import apiClient, { errorMessage } from "@/lib/axios";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  phone_number?: string;
  photo_url?: string;
  gender?: string;
  confirmed: boolean;
  doctorInfo?: { user_id: number; speciality: string } | null;
}
export interface Registration {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "patient" | "doctor";
  speciality?: string;
}
interface AuthState {
  user: User | null;
  isLoading: boolean;
  sessionError: string;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Registration) => Promise<{ message: string; user: User }>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
}
const Context = createContext<AuthState | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    setSessionError("");
    try {
      const { data } = await apiClient.get<{ user: User }>("/users/me");
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (!(axios.isAxiosError(error) && error.response?.status === 401))
        setSessionError(errorMessage(error));
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ user: User }>("/auth/login", {
      email,
      password,
    });
    setUser(data.user);
    setSessionError("");
    return data.user;
  }, []);
  const register = useCallback(async (data: Registration) => {
    return (
      await apiClient.post<{ message: string; user: User }>(
        "/auth/register",
        data,
      )
    ).data;
  }, []);
  const logout = useCallback(async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
    setSessionError("");
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        isLoading,
        sessionError,
        login,
        register,
        logout,
        fetchCurrentUser,
      }}
    >
      <SWRConfig
        key={user?.id ?? "anonymous"}
        value={{
          provider: () => new Map(),
          revalidateOnFocus: true,
          onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 401)
              setUser(null);
          },
        }}
      >
        {children}
      </SWRConfig>
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("Falta AuthProvider.");
  return value;
}
export const dashboardPath = (user: User) =>
  "/" + (user.role === "doctor" ? "doctor" : "paciente") + "/" + user.id;
